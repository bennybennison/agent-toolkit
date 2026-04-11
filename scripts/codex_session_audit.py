#!/usr/bin/env python3
"""Audit Codex sessions from local JSONL history files."""

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


SESSIONS_DEFAULT = Path.home() / ".codex" / "sessions"
HISTORY_DEFAULT = Path.home() / ".codex" / "history.jsonl"


@dataclass(frozen=True)
class SessionMetrics:
    session_id: str
    title: str
    cwd: str
    source: str
    path: Path
    started_at: str
    updated_ms: int
    user_messages: int
    assistant_messages: int
    commentary_messages: int
    tool_calls: int
    compactions: int
    repeated_user_prompts: list[tuple[str, int]]
    repeated_commentary_prefixes: list[tuple[str, int]]
    loop_score: int


def _clamp(text: str, limit: int) -> str:
    compact = " ".join(text.split())
    if len(compact) <= limit:
        return compact
    return compact[: limit - 1] + "…"


def _iso_to_ms(value: str) -> int:
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return int(dt.timestamp() * 1000)


def _median(values: list[int]) -> int:
    return int(statistics.median(values)) if values else 0


def _top_repeats(values: list[str], limit: int, clamp: int) -> list[tuple[str, int]]:
    counts = Counter(_clamp(value, clamp) for value in values if value.strip())
    repeated = [(text, count) for text, count in counts.items() if count > 1]
    repeated.sort(key=lambda item: item[1], reverse=True)
    return repeated[:limit]


def _loop_score(compactions: int, tool_calls: int, repeated_user_prompts: list[tuple[str, int]], repeated_commentary_prefixes: list[tuple[str, int]]) -> int:
    score = 0
    if compactions >= 4:
        score += 4
    elif compactions >= 2:
        score += 2

    if repeated_user_prompts:
        top = repeated_user_prompts[0][1]
        score += 4 if top >= 5 else 2 if top >= 3 else 1

    if repeated_commentary_prefixes:
        top = repeated_commentary_prefixes[0][1]
        score += 3 if top >= 5 else 2 if top >= 3 else 1

    if compactions >= 2 and tool_calls <= 3:
        score += 2
    return score


def _load_history_prompts(history_path: Path, since_ms: int, directory: str | None) -> dict[str, list[str]]:
    prompts: dict[str, list[str]] = {}
    if not history_path.exists():
        return prompts

    for line in history_path.read_text(encoding="utf-8").splitlines():
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        ts = int(row.get("ts", 0)) * 1000
        if ts < since_ms:
            continue
        session_id = row.get("session_id")
        text = row.get("text")
        if not isinstance(session_id, str) or not isinstance(text, str):
            continue
        prompts.setdefault(session_id, []).append(text)
    return prompts


def _iter_sessions(sessions_dir: Path, since_ms: int) -> list[Path]:
    paths = [path for path in sessions_dir.rglob("*.jsonl") if int(path.stat().st_mtime * 1000) >= since_ms]
    paths.sort(key=lambda path: path.stat().st_mtime, reverse=True)
    return paths


def _session_title(path: Path, session_id: str) -> str:
    return path.stem.replace("rollout-", "").replace(session_id, "").strip("-") or session_id


def _parse_session(path: Path, directory: str | None, history_prompts: dict[str, list[str]]) -> SessionMetrics | None:
    session_id = ""
    cwd = ""
    source = ""
    started_at = ""
    updated_ms = int(path.stat().st_mtime * 1000)
    user_messages = 0
    assistant_messages = 0
    commentary_messages = 0
    tool_calls = 0
    compactions = 0
    commentary_prefixes: list[str] = []

    with path.open(encoding="utf-8") as handle:
        for line in handle:
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            event_type = obj.get("type")
            payload = obj.get("payload", {})

            if event_type == "session_meta" and isinstance(payload, dict):
                session_id = str(payload.get("id", session_id))
                cwd = str(payload.get("cwd", cwd))
                source = str(payload.get("source", source))
                started_at = str(payload.get("timestamp", started_at))
                continue

            if event_type == "compacted":
                compactions += 1

            if not isinstance(payload, dict):
                continue

            payload_type = payload.get("type")
            if payload_type == "context_compacted":
                compactions += 1
            elif payload_type in {"function_call", "custom_tool_call", "web_search_call"}:
                tool_calls += 1
            elif payload_type == "user_message":
                user_messages += 1
            elif payload_type == "agent_message":
                assistant_messages += 1
                if payload.get("phase") == "commentary":
                    commentary_messages += 1
                    message = payload.get("message")
                    if isinstance(message, str) and message.strip():
                        commentary_prefixes.append(message)
            elif payload_type == "message":
                role = payload.get("role")
                if role == "assistant":
                    assistant_messages += 1
                elif role == "user":
                    user_messages += 1

    if not session_id or not cwd:
        return None
    if directory and cwd != directory:
        return None

    repeated_user_prompts = _top_repeats(history_prompts.get(session_id, []), limit=5, clamp=120)
    repeated_commentary_prefixes = _top_repeats(commentary_prefixes, limit=5, clamp=100)
    loop_score = _loop_score(compactions, tool_calls, repeated_user_prompts, repeated_commentary_prefixes)
    title = _session_title(path, session_id)

    return SessionMetrics(
        session_id=session_id,
        title=title,
        cwd=cwd,
        source=source or "unknown",
        path=path,
        started_at=started_at,
        updated_ms=updated_ms,
        user_messages=user_messages,
        assistant_messages=assistant_messages,
        commentary_messages=commentary_messages,
        tool_calls=tool_calls,
        compactions=compactions,
        repeated_user_prompts=repeated_user_prompts,
        repeated_commentary_prefixes=repeated_commentary_prefixes,
        loop_score=loop_score,
    )


def _render_report(metrics: list[SessionMetrics], days: int, directory: str | None, sessions_dir: Path) -> str:
    lines: list[str] = []
    lines.append("# Codex Session Audit")
    lines.append("")
    lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"Window: last {days} day(s)")
    lines.append(f"Scope: {directory if directory else '(all directories)'}")
    lines.append(f"Sessions root: {sessions_dir}")
    lines.append("")

    lines.append("## Overview")
    lines.append("")
    lines.append(f"- Sessions: {len(metrics)}")
    lines.append(f"- Tool calls (median): {_median([m.tool_calls for m in metrics])}")
    lines.append(f"- Compactions (median): {_median([m.compactions for m in metrics])}")
    lines.append(f"- Commentary messages (median): {_median([m.commentary_messages for m in metrics])}")
    lines.append(f"- Loop score (median): {_median([m.loop_score for m in metrics])}")
    lines.append("")

    lines.append("## Sessions")
    lines.append("")
    lines.append("| Updated | Loop | Compactions | Tools | Commentary | Title | Session ID |")
    lines.append("|---|---:|---:|---:|---:|---|---|")
    for metric in metrics[:50]:
        updated = datetime.fromtimestamp(metric.updated_ms / 1000).strftime("%Y-%m-%d %H:%M:%S")
        lines.append(
            f"| {updated} | {metric.loop_score} | {metric.compactions} | {metric.tool_calls} | {metric.commentary_messages} | {metric.title.replace('|', '\\|')} | `{metric.session_id}` |"
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
            lines.append(f"- Source: `{metric.source}`")
            lines.append(f"- Directory: `{metric.cwd}`")
            lines.append(f"- Signals: compactions={metric.compactions}, tools={metric.tool_calls}, commentary={metric.commentary_messages}, loop_score={metric.loop_score}")
            if metric.repeated_user_prompts:
                lines.append("- Repeated user prompts:")
                for text, count in metric.repeated_user_prompts[:3]:
                    lines.append(f"  - {count}x {textwrap.shorten(text, width=140)}")
            if metric.repeated_commentary_prefixes:
                lines.append("- Repeated commentary prefixes:")
                for text, count in metric.repeated_commentary_prefixes[:3]:
                    lines.append(f"  - {count}x {textwrap.shorten(text, width=140)}")
            lines.append("")

    lines.append("## Interpretation")
    lines.append("")
    lines.append("- High compactions with low tool counts usually means restart pressure rather than useful progress.")
    lines.append("- Repeated commentary prefixes often indicate the agent is narrating micro-steps instead of working in checkpoints.")
    lines.append("- Repeated user prompts can reveal weak closure or continuation loops.")
    lines.append("")
    return "\n".join(lines) + "\n"


def _default_out_path(directory: str | None) -> Path:
    stamp = datetime.now().strftime("%Y-%m-%d-%H%M%S")
    if directory:
        return Path(directory) / ".agent-toolkit" / "plans" / "audits" / f"codex-audit-{stamp}.md"
    return Path.home() / ".codex" / "audit" / f"codex-audit-{stamp}.md"


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit Codex sessions.")
    parser.add_argument("--days", type=int, default=7)
    parser.add_argument("--dir", dest="directory", type=str, default=None)
    parser.add_argument("--sessions-dir", type=str, default=str(SESSIONS_DEFAULT))
    parser.add_argument("--history", type=str, default=str(HISTORY_DEFAULT))
    parser.add_argument("--out", type=str, default=None)
    args = parser.parse_args()

    days = max(1, int(args.days))
    directory = args.directory
    sessions_dir = Path(args.sessions_dir).expanduser()
    history_path = Path(args.history).expanduser()
    since_ms = int((time.time() - days * 24 * 60 * 60) * 1000)

    if not sessions_dir.exists():
        raise SystemExit(f"Codex sessions directory not found: {sessions_dir}")

    history_prompts = _load_history_prompts(history_path, since_ms=since_ms, directory=directory)
    metrics: list[SessionMetrics] = []
    for path in _iter_sessions(sessions_dir, since_ms=since_ms):
        metric = _parse_session(path, directory=directory, history_prompts=history_prompts)
        if metric:
            metrics.append(metric)

    report = _render_report(metrics, days=days, directory=directory, sessions_dir=sessions_dir)
    out_path = Path(args.out).expanduser() if args.out else _default_out_path(directory)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(report, encoding="utf-8")
    print(str(out_path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
