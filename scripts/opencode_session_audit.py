#!/usr/bin/env python3
"""Audit OpenCode sessions from the local sqlite database.

This script is intentionally dependency-free (stdlib only). It summarizes recent
sessions, flags likely looping behavior (compaction spam, repeated prompts), and
produces a Markdown report that's easy to scan.
"""

from __future__ import annotations

import argparse
import json
import os
import sqlite3
import statistics
import textwrap
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


DB_DEFAULT = Path.home() / ".local" / "share" / "opencode" / "opencode.db"


@dataclass(frozen=True)
class SessionRow:
    id: str
    title: str
    slug: str
    directory: str
    created_ms: int
    updated_ms: int


@dataclass(frozen=True)
class SessionMetrics:
    session: SessionRow
    duration_s: int
    part_counts: dict[str, int]
    assistant_agent_counts: dict[str, int]
    tool_calls: int
    compactions: int
    repeated_user_prompts: list[tuple[str, int]]
    repeated_assistant_prefixes: list[tuple[str, int]]
    loop_score: int


def _dt_local_from_ms(ts_ms: int) -> str:
    dt = datetime.fromtimestamp(ts_ms / 1000)
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def _clamp_prefix(text: str, limit: int) -> str:
    t = " ".join(text.split())
    if len(t) <= limit:
        return t
    return t[: limit - 1] + "…"


def _connect(db_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    return conn


def _fetch_sessions(
    conn: sqlite3.Connection,
    since_ms: int,
    directory: str | None,
) -> list[SessionRow]:
    sql = (
        "select id, title, slug, directory, time_created as created_ms, time_updated as updated_ms "
        "from session where time_updated >= ?"
    )
    args: list[object] = [since_ms]
    if directory:
        sql += " and directory = ?"
        args.append(directory)
    sql += " order by time_updated desc"

    rows = conn.execute(sql, args).fetchall()
    sessions: list[SessionRow] = []
    for r in rows:
        sessions.append(
            SessionRow(
                id=str(r["id"]),
                title=str(r["title"]),
                slug=str(r["slug"]),
                directory=str(r["directory"]),
                created_ms=int(r["created_ms"]),
                updated_ms=int(r["updated_ms"]),
            )
        )
    return sessions


def _part_type_counts(conn: sqlite3.Connection, session_id: str) -> dict[str, int]:
    # part.data is JSON. The top-level field "type" is a stable discriminator.
    rows = conn.execute(
        "select json_extract(data,'$.type') as t, count(*) as n "
        "from part where session_id = ? group by t",
        [session_id],
    ).fetchall()
    out: dict[str, int] = {}
    for r in rows:
        key = r["t"]
        if key is None:
            continue
        out[str(key)] = int(r["n"])
    return out


def _assistant_agent_counts(
    conn: sqlite3.Connection, session_id: str
) -> dict[str, int]:
    rows = conn.execute(
        "select json_extract(data,'$.agent') as agent, count(*) as n "
        "from message "
        "where session_id = ? and json_extract(data,'$.role') = 'assistant' "
        "group by agent",
        [session_id],
    ).fetchall()

    out: dict[str, int] = {}
    for r in rows:
        agent = r["agent"]
        if agent is None:
            continue
        out[str(agent)] = int(r["n"])
    return out


def _top_repeats(
    conn: sqlite3.Connection,
    session_id: str,
    role: str,
    prefix_len: int,
    limit: int,
) -> list[tuple[str, int]]:
    # Pull text parts and count repeated prefixes. This is a heuristic to spot
    # prompt loops (user) and plan restarts (assistant).
    rows = conn.execute(
        "select p.data as pdata "
        "from message m join part p on p.message_id = m.id "
        "where m.session_id = ? "
        "and json_extract(m.data,'$.role') = ? "
        "and json_extract(p.data,'$.type') = 'text'",
        [session_id, role],
    ).fetchall()

    counts: dict[str, int] = {}
    for r in rows:
        pdata = str(r["pdata"])
        try:
            obj = json.loads(pdata)
        except json.JSONDecodeError:
            continue
        text = obj.get("text")
        if not isinstance(text, str) or not text.strip():
            continue
        prefix = _clamp_prefix(text, prefix_len)
        counts[prefix] = counts.get(prefix, 0) + 1

    repeats = [(k, v) for k, v in counts.items() if v > 1]
    repeats.sort(key=lambda kv: kv[1], reverse=True)
    return repeats[:limit]


def _loop_score(
    *,
    part_counts: dict[str, int],
    repeated_user_prompts: list[tuple[str, int]],
    repeated_assistant_prefixes: list[tuple[str, int]],
) -> int:
    score = 0
    compactions = part_counts.get("compaction", 0)
    tool_calls = part_counts.get("tool", 0)

    if compactions >= 3:
        score += 4
    elif compactions == 2:
        score += 2

    if repeated_user_prompts:
        # A single duplicated prompt is common; frequent duplication is a sign.
        top = repeated_user_prompts[0][1]
        if top >= 5:
            score += 4
        elif top >= 3:
            score += 2
        else:
            score += 1

    if repeated_assistant_prefixes:
        top = repeated_assistant_prefixes[0][1]
        if top >= 5:
            score += 3
        elif top >= 3:
            score += 2
        else:
            score += 1

    # If there are many compactions but few tool calls, it's often "restart w/o progress".
    if compactions >= 2 and tool_calls <= 2:
        score += 2

    return score


def _compute_metrics(conn: sqlite3.Connection, session: SessionRow) -> SessionMetrics:
    part_counts = _part_type_counts(conn, session.id)
    assistant_agent_counts = _assistant_agent_counts(conn, session.id)
    tool_calls = part_counts.get("tool", 0)
    compactions = part_counts.get("compaction", 0)
    duration_s = max(0, int((session.updated_ms - session.created_ms) / 1000))

    repeated_user_prompts = _top_repeats(
        conn, session.id, role="user", prefix_len=120, limit=10
    )
    repeated_assistant_prefixes = _top_repeats(
        conn, session.id, role="assistant", prefix_len=100, limit=10
    )

    score = _loop_score(
        part_counts=part_counts,
        repeated_user_prompts=repeated_user_prompts,
        repeated_assistant_prefixes=repeated_assistant_prefixes,
    )

    return SessionMetrics(
        session=session,
        duration_s=duration_s,
        part_counts=part_counts,
        assistant_agent_counts=assistant_agent_counts,
        tool_calls=tool_calls,
        compactions=compactions,
        repeated_user_prompts=repeated_user_prompts,
        repeated_assistant_prefixes=repeated_assistant_prefixes,
        loop_score=score,
    )


def _median(values: list[int]) -> int:
    if not values:
        return 0
    return int(statistics.median(values))


def _render_report(
    *,
    metrics: list[SessionMetrics],
    days: int,
    directory: str | None,
    db_path: Path,
) -> str:
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    scope = directory if directory else "(all directories)"

    durations = [m.duration_s for m in metrics]
    compactions = [m.compactions for m in metrics]
    tool_calls = [m.tool_calls for m in metrics]
    scores = [m.loop_score for m in metrics]

    top_risky = sorted(metrics, key=lambda m: m.loop_score, reverse=True)[:10]

    # Aggregate assistant agent usage across all audited sessions.
    agent_totals: dict[str, int] = {}
    for m in metrics:
        for agent, n in m.assistant_agent_counts.items():
            agent_totals[agent] = agent_totals.get(agent, 0) + n
    top_agents = sorted(agent_totals.items(), key=lambda kv: kv[1], reverse=True)[:8]

    def fmt_s(n: int) -> str:
        if n < 60:
            return f"{n}s"
        return f"{n // 60}m{n % 60:02d}s"

    lines: list[str] = []
    lines.append("# OpenCode Session Audit")
    lines.append("")
    lines.append(f"Generated: {now}")
    lines.append(f"Window: last {days} day(s)")
    lines.append(f"Scope: {scope}")
    lines.append(f"DB: {db_path}")
    lines.append("")

    lines.append("## Overview")
    lines.append("")
    lines.append(f"- Sessions: {len(metrics)}")
    lines.append(f"- Duration (median): {fmt_s(_median(durations))}")
    lines.append(f"- Tool calls (median): {_median(tool_calls)}")
    lines.append(f"- Compactions (median): {_median(compactions)}")
    lines.append(f"- Loop score (median): {_median(scores)}")
    if top_agents:
        lines.append(
            "- Assistant agents (top): "
            + ", ".join([f"{a}={n}" for a, n in top_agents])
        )
    lines.append("")

    lines.append("## Sessions")
    lines.append("")
    lines.append(
        "| Updated | Loop | Compactions | Tools | Duration | Title | Session ID |"
    )
    lines.append("|---|---:|---:|---:|---:|---|---|")
    for m in metrics[:50]:
        updated = _dt_local_from_ms(m.session.updated_ms)
        title = m.session.title.replace("|", "\\|")
        lines.append(
            f"| {updated} | {m.loop_score} | {m.compactions} | {m.tool_calls} | {fmt_s(m.duration_s)} | {title} | `{m.session.id}` |"
        )
    lines.append("")

    lines.append("## High Risk (Likely Loops)")
    lines.append("")
    if not top_risky or top_risky[0].loop_score == 0:
        lines.append("No obvious loop signals detected in this window.")
        lines.append("")
    else:
        for m in top_risky:
            if m.loop_score < 4:
                continue
            lines.append(f"### {m.session.title}")
            lines.append("")
            lines.append(f"- Session: `{m.session.id}`")
            lines.append(f"- Directory: `{m.session.directory}`")
            lines.append(
                f"- Created/Updated: {_dt_local_from_ms(m.session.created_ms)} -> {_dt_local_from_ms(m.session.updated_ms)} ({fmt_s(m.duration_s)})"
            )
            lines.append(
                f"- Signals: compactions={m.compactions}, tools={m.tool_calls}, loop_score={m.loop_score}"
            )
            if m.assistant_agent_counts:
                top = sorted(
                    m.assistant_agent_counts.items(), key=lambda kv: kv[1], reverse=True
                )[:6]
                lines.append(
                    "- Assistant agents: " + ", ".join([f"{a}={n}" for a, n in top])
                )

            if m.repeated_user_prompts:
                lines.append("")
                lines.append("Repeated user prompts (prefix counts):")
                for text, n in m.repeated_user_prompts[:3]:
                    lines.append(f"- {n}x {textwrap.shorten(text, width=140)}")

            if m.repeated_assistant_prefixes:
                lines.append("")
                lines.append("Repeated assistant prefixes (prefix counts):")
                for text, n in m.repeated_assistant_prefixes[:3]:
                    lines.append(f"- {n}x {textwrap.shorten(text, width=140)}")

            lines.append("")
            lines.append(
                "Next action: run `/history` in that repo directory, then fix the blocker or break the task down."
            )
            lines.append("")

    lines.append("## Interpretation")
    lines.append("")
    lines.append("Loop score is a heuristic:")
    lines.append("- +compactions (restarting context repeatedly)")
    lines.append("- +repeated user prompts (confirmation treated as new task)")
    lines.append("- +repeated assistant prefixes (plan restarts / goal restating)")
    lines.append("")
    lines.append("If you see many high scores, tighten guard rails:")
    lines.append("- Prefer `/loop` for iterative work")
    lines.append("- Use `/save-session` before big tool-output steps")
    lines.append("- Ensure hooks never throw (they must be fail-safe)")
    lines.append("")

    return "\n".join(lines) + "\n"


def _default_out_path(directory: str | None) -> Path:
    stamp = datetime.now().strftime("%Y-%m-%d-%H%M%S")
    if directory:
        return Path(directory) / ".agent-toolkit" / "plans" / "audits" / f"opencode-audit-{stamp}.md"
    return (
        Path.home()
        / ".local"
        / "share"
        / "opencode"
        / "audit"
        / f"opencode-audit-{stamp}.md"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit OpenCode sessions.")
    parser.add_argument(
        "--days",
        type=int,
        default=7,
        help="How many days back to include (default: 7).",
    )
    parser.add_argument(
        "--dir",
        dest="directory",
        type=str,
        default=None,
        help="Filter to an exact project directory (default: none).",
    )
    parser.add_argument(
        "--db",
        type=str,
        default=str(DB_DEFAULT),
        help=f"Path to opencode.db (default: {DB_DEFAULT}).",
    )
    parser.add_argument(
        "--out",
        type=str,
        default=None,
        help="Write Markdown report to this path (default: auto).",
    )
    args = parser.parse_args()

    days = max(1, int(args.days))
    directory = args.directory
    db_path = Path(args.db).expanduser()

    if not db_path.exists():
        raise SystemExit(f"OpenCode db not found: {db_path}")

    since_ms = int((time.time() - days * 24 * 60 * 60) * 1000)

    with _connect(db_path) as conn:
        sessions = _fetch_sessions(conn, since_ms=since_ms, directory=directory)
        metrics = [_compute_metrics(conn, s) for s in sessions]

    report = _render_report(
        metrics=metrics,
        days=days,
        directory=directory,
        db_path=db_path,
    )

    out_path = Path(args.out).expanduser() if args.out else _default_out_path(directory)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(report, encoding="utf-8")
    print(str(out_path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
