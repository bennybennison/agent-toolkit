#!/usr/bin/env python3
"""Audit GitHub Copilot Chat sessions from VS Code workspace storage."""

from __future__ import annotations

import argparse
import json
import statistics
import textwrap
import time
from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse, unquote


WORKSPACE_STORAGE_DEFAULT = (
    Path.home()
    / "Library"
    / "Application Support"
    / "Code"
    / "User"
    / "workspaceStorage"
)


@dataclass(frozen=True)
class SessionMetrics:
    session_id: str
    title: str
    workspace: str
    model: str
    mode: str
    path: Path
    created_ms: int
    updated_ms: int
    requests: int
    tool_calls: int
    compact_requests: int
    repeated_user_prompts: list[tuple[str, int]]
    repeated_terminal_commands: list[tuple[str, int]]
    loop_score: int


def _clamp(text: str, limit: int) -> str:
    compact = " ".join(text.split())
    if len(compact) <= limit:
        return compact
    return compact[: limit - 1] + "…"


def _median(values: list[int]) -> int:
    return int(statistics.median(values)) if values else 0


def _top_repeats(values: list[str], limit: int, clamp: int) -> list[tuple[str, int]]:
    counts = Counter(_clamp(value, clamp) for value in values if value.strip())
    repeated = [(text, count) for text, count in counts.items() if count > 1]
    repeated.sort(key=lambda item: item[1], reverse=True)
    return repeated[:limit]


def _workspace_path(workspace_json: Path) -> str:
    if not workspace_json.exists():
        return ""
    try:
        data = json.loads(workspace_json.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return ""
    folder = data.get("folder")
    if not isinstance(folder, str):
        return ""
    if folder.startswith("file://"):
        parsed = urlparse(folder)
        return unquote(parsed.path)
    return folder


def _iter_session_files(workspace_storage: Path, since_ms: int) -> list[Path]:
    paths = [
        path for path in workspace_storage.rglob("chatSessions/*.jsonl")
        if int(path.stat().st_mtime * 1000) >= since_ms
    ]
    paths.sort(key=lambda path: path.stat().st_mtime, reverse=True)
    return paths


def _loop_score(compact_requests: int, tool_calls: int, repeated_user_prompts: list[tuple[str, int]], repeated_terminal_commands: list[tuple[str, int]]) -> int:
    score = 0
    if compact_requests >= 3:
        score += 4
    elif compact_requests >= 1:
        score += 1

    if repeated_user_prompts:
        top = repeated_user_prompts[0][1]
        score += 4 if top >= 5 else 2 if top >= 3 else 1

    if repeated_terminal_commands:
        top = repeated_terminal_commands[0][1]
        score += 3 if top >= 5 else 2 if top >= 3 else 1

    if compact_requests >= 1 and tool_calls <= 3:
        score += 2
    return score


def _parse_session(path: Path, directory: str | None) -> SessionMetrics | None:
    workspace = _workspace_path(path.parents[1] / "workspace.json")
    if directory and workspace != directory:
        return None

    session_id = ""
    title = path.stem
    model = "unknown"
    mode = "unknown"
    created_ms = 0
    updated_ms = int(path.stat().st_mtime * 1000)
    request_texts: list[str] = []
    terminal_commands: list[str] = []
    tool_calls = 0
    compact_requests = 0

    with path.open(encoding="utf-8") as handle:
        for line in handle:
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            kind = obj.get("kind")
            key = obj.get("k")
            value = obj.get("v")

            if kind == 0 and isinstance(value, dict):
                session_id = str(value.get("sessionId", session_id))
                created_ms = int(value.get("creationDate", created_ms or 0))
                title = str(value.get("customTitle", title))
                input_state = value.get("inputState", {})
                if isinstance(input_state, dict):
                    mode_info = input_state.get("mode", {})
                    if isinstance(mode_info, dict):
                        mode = str(mode_info.get("id", mode))
                    selected_model = input_state.get("selectedModel", {})
                    if isinstance(selected_model, dict):
                        model = str(selected_model.get("identifier", model))
                continue

            if kind == 1 and key == ["customTitle"] and isinstance(value, str):
                title = value
                continue

            if kind == 2 and key == ["requests"] and isinstance(value, list):
                for request in value:
                    if not isinstance(request, dict):
                        continue
                    message = request.get("message", {})
                    if isinstance(message, dict):
                        text = message.get("text")
                        if isinstance(text, str) and text.strip():
                            request_texts.append(text)
                            if text.strip().startswith("/compact"):
                                compact_requests += 1
                    if model == "unknown":
                        model = str(request.get("modelId", model))
                continue

            if kind == 2 and isinstance(key, list) and len(key) >= 3 and key[0] == "requests" and key[2] == "response" and isinstance(value, list):
                for item in value:
                    if not isinstance(item, dict):
                        continue
                    if item.get("kind") != "toolInvocationSerialized":
                        continue
                    tool_calls += 1
                    tool_data = item.get("toolSpecificData", {})
                    if isinstance(tool_data, dict):
                        command = tool_data.get("commandLine", {})
                        if isinstance(command, dict):
                            original = command.get("original")
                            if isinstance(original, str) and original.strip():
                                terminal_commands.append(original)

    if not session_id:
        return None

    repeated_user_prompts = _top_repeats(request_texts, limit=5, clamp=120)
    repeated_terminal_commands = _top_repeats(terminal_commands, limit=5, clamp=120)
    loop_score = _loop_score(compact_requests, tool_calls, repeated_user_prompts, repeated_terminal_commands)

    return SessionMetrics(
        session_id=session_id,
        title=title,
        workspace=workspace,
        model=model,
        mode=mode,
        path=path,
        created_ms=created_ms,
        updated_ms=updated_ms,
        requests=len(request_texts),
        tool_calls=tool_calls,
        compact_requests=compact_requests,
        repeated_user_prompts=repeated_user_prompts,
        repeated_terminal_commands=repeated_terminal_commands,
        loop_score=loop_score,
    )


def _render_report(metrics: list[SessionMetrics], days: int, directory: str | None, workspace_storage: Path) -> str:
    lines: list[str] = []
    lines.append("# Copilot Session Audit")
    lines.append("")
    lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"Window: last {days} day(s)")
    lines.append(f"Scope: {directory if directory else '(all workspaces)'}")
    lines.append(f"Workspace storage: {workspace_storage}")
    lines.append("")

    lines.append("## Overview")
    lines.append("")
    lines.append(f"- Sessions: {len(metrics)}")
    lines.append(f"- Requests (median): {_median([m.requests for m in metrics])}")
    lines.append(f"- Tool calls (median): {_median([m.tool_calls for m in metrics])}")
    lines.append(f"- `/compact` requests (median): {_median([m.compact_requests for m in metrics])}")
    lines.append(f"- Loop score (median): {_median([m.loop_score for m in metrics])}")
    lines.append("")

    lines.append("## Sessions")
    lines.append("")
    lines.append("| Updated | Loop | Requests | Tools | /compact | Mode | Model | Title | Session ID |")
    lines.append("|---|---:|---:|---:|---:|---|---|---|---|")
    for metric in metrics[:50]:
        updated = datetime.fromtimestamp(metric.updated_ms / 1000).strftime("%Y-%m-%d %H:%M:%S")
        lines.append(
            f"| {updated} | {metric.loop_score} | {metric.requests} | {metric.tool_calls} | {metric.compact_requests} | {metric.mode} | {metric.model} | {metric.title.replace('|', '\\|')} | `{metric.session_id}` |"
        )
    lines.append("")

    lines.append("## High Risk")
    lines.append("")
    risky = [metric for metric in metrics if metric.loop_score >= 4]
    if not risky:
        lines.append("No obvious looping signals detected.")
        lines.append("")
    else:
        for metric in risky[:10]:
            lines.append(f"### {metric.title}")
            lines.append("")
            lines.append(f"- Session: `{metric.session_id}`")
            lines.append(f"- Workspace: `{metric.workspace}`")
            lines.append(f"- Mode/Model: `{metric.mode}` / `{metric.model}`")
            lines.append(f"- Signals: requests={metric.requests}, tools={metric.tool_calls}, /compact={metric.compact_requests}, loop_score={metric.loop_score}")
            if metric.repeated_user_prompts:
                lines.append("- Repeated user prompts:")
                for text, count in metric.repeated_user_prompts[:3]:
                    lines.append(f"  - {count}x {textwrap.shorten(text, width=140)}")
            if metric.repeated_terminal_commands:
                lines.append("- Repeated terminal commands:")
                for text, count in metric.repeated_terminal_commands[:3]:
                    lines.append(f"  - {count}x {textwrap.shorten(text, width=140)}")
            lines.append("")

    lines.append("## Interpretation")
    lines.append("")
    lines.append("- Repeated `/compact` often means the session is outgrowing the current slice of work.")
    lines.append("- Repeated terminal commands usually indicate the agent is retrying the same probe instead of advancing.")
    lines.append("- Repeated user prompts point to weak checkpointing or unclear closure.")
    lines.append("")
    return "\n".join(lines) + "\n"


def _default_out_path(directory: str | None) -> Path:
    stamp = datetime.now().strftime("%Y-%m-%d-%H%M%S")
    if directory:
        return Path(directory) / ".agent-toolkit" / "plans" / "audits" / f"copilot-audit-{stamp}.md"
    return WORKSPACE_STORAGE_DEFAULT / "audit" / f"copilot-audit-{stamp}.md"


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit Copilot chat sessions.")
    parser.add_argument("--days", type=int, default=7)
    parser.add_argument("--dir", dest="directory", type=str, default=None)
    parser.add_argument("--workspace-storage", type=str, default=str(WORKSPACE_STORAGE_DEFAULT))
    parser.add_argument("--out", type=str, default=None)
    args = parser.parse_args()

    days = max(1, int(args.days))
    directory = args.directory
    workspace_storage = Path(args.workspace_storage).expanduser()
    since_ms = int((time.time() - days * 24 * 60 * 60) * 1000)

    if not workspace_storage.exists():
        raise SystemExit(f"VS Code workspace storage not found: {workspace_storage}")

    metrics: list[SessionMetrics] = []
    for path in _iter_session_files(workspace_storage, since_ms=since_ms):
        metric = _parse_session(path, directory=directory)
        if metric:
            metrics.append(metric)

    report = _render_report(metrics, days=days, directory=directory, workspace_storage=workspace_storage)
    out_path = Path(args.out).expanduser() if args.out else _default_out_path(directory)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(report, encoding="utf-8")
    print(str(out_path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
