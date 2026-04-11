#!/usr/bin/env python3
"""Shared helpers for OpenCode optimisation reports."""
from __future__ import annotations
import shutil
import subprocess
import textwrap
import time
from dataclasses import dataclass
from pathlib import Path
import opencode_session_audit as session_audit
SOURCE_SUFFIXES = {".py", ".ts", ".tsx", ".js", ".jsx", ".sh", ".md"}
IGNORED_DIRS = {".git", ".venv", "node_modules", "__pycache__", ".mypy_cache", ".ruff_cache"}
@dataclass(frozen=True)
class CheckResult:
    name: str
    command: str
    status: str
    detail: str
    duration_s: float

@dataclass(frozen=True)
class OptimisationSnapshot:
    directory: Path
    days: int
    offset_days: int
    db_path: Path
    metrics: list[session_audit.SessionMetrics]
    checks: list[CheckResult]
    large_files: list[tuple[str, int]]

def skip_result(name: str, command: str, detail: str) -> CheckResult:
    return CheckResult(name=name, command=command, status="skip", detail=detail, duration_s=0.0)

def run_command(command: list[str], *, cwd: Path, timeout_s: int) -> CheckResult:
    started = time.time()
    try:
        completed = subprocess.run(
            command,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout_s,
            check=False,
        )
    except FileNotFoundError:
        return skip_result(" ".join(command[:2]), " ".join(command), f"Command not found: {command[0]}")
    except subprocess.TimeoutExpired:
        return CheckResult(
            name=" ".join(command[:2]),
            command=" ".join(command),
            status="fail",
            detail=f"Timed out after {timeout_s}s",
            duration_s=time.time() - started,
        )

    output = "\n".join(part.strip() for part in [completed.stdout, completed.stderr] if part.strip())
    detail = textwrap.shorten(output or "No output.", width=200, placeholder="...")
    return CheckResult(
        name=" ".join(command[:2]),
        command=" ".join(command),
        status="pass" if completed.returncode == 0 else "fail",
        detail=detail,
        duration_s=time.time() - started,
    )

def has_python_files(directory: Path) -> bool:
    return any(directory.rglob("*.py"))

def has_tests(directory: Path) -> bool:
    return any(directory.rglob("test_*.py")) or (directory / "tests").exists()

def find_large_files(directory: Path, limit: int = 300) -> list[tuple[str, int]]:
    large_files: list[tuple[str, int]] = []
    for path in directory.rglob("*"):
        if not path.is_file():
            continue
        if any(part in IGNORED_DIRS for part in path.parts):
            continue
        if path.suffix not in SOURCE_SUFFIXES:
            continue
        try:
            line_count = sum(1 for _ in path.open("r", encoding="utf-8"))
        except UnicodeDecodeError:
            continue
        if line_count > limit:
            large_files.append((str(path.relative_to(directory)), line_count))
    large_files.sort(key=lambda item: item[1], reverse=True)
    return large_files

def collect_quality_checks(directory: Path) -> list[CheckResult]:
    checks: list[CheckResult] = []
    has_python = has_python_files(directory)
    if has_python and shutil.which("ruff"):
        checks.append(run_command(["ruff", "check", "."], cwd=directory, timeout_s=120))
        checks.append(run_command(["ruff", "format", "--check", "."], cwd=directory, timeout_s=120))
    else:
        detail = "Skipped: ruff unavailable or no Python files found."
        checks.append(skip_result("ruff check", "ruff check .", detail))
        checks.append(skip_result("ruff format", "ruff format --check .", detail))
    if has_python and shutil.which("mypy"):
        checks.append(run_command(["mypy", "."], cwd=directory, timeout_s=180))
    else:
        checks.append(skip_result("mypy", "mypy .", "Skipped: mypy unavailable or no Python files found."))
    if has_tests(directory) and shutil.which("uv"):
        checks.append(run_command(["uv", "run", "pytest"], cwd=directory, timeout_s=300))
    else:
        checks.append(skip_result("uv run", "uv run pytest", "Skipped: uv unavailable or no tests detected."))
    return checks

def collect_session_metrics(
    *, directory: Path, days: int, db_path: Path, offset_days: int = 0
) -> list[session_audit.SessionMetrics]:
    now_s = time.time()
    until_ms = int((now_s - offset_days * 24 * 60 * 60) * 1000)
    since_ms = int((now_s - (offset_days + days) * 24 * 60 * 60) * 1000)
    with session_audit._connect(db_path) as conn:
        sessions = session_audit._fetch_sessions(conn, since_ms=since_ms, directory=str(directory))
        window_sessions = [session for session in sessions if session.updated_ms < until_ms]
        return [session_audit._compute_metrics(conn, session) for session in window_sessions]

def build_snapshot(
    *, directory: Path, days: int, db_path: Path, offset_days: int = 0
) -> OptimisationSnapshot:
    return OptimisationSnapshot(
        directory=directory,
        days=days,
        offset_days=offset_days,
        db_path=db_path,
        metrics=collect_session_metrics(directory=directory, days=days, db_path=db_path, offset_days=offset_days),
        checks=collect_quality_checks(directory),
        large_files=find_large_files(directory),
    )

def classify_session(metric: session_audit.SessionMetrics) -> str:
    if metric.loop_score >= 6 or metric.compactions >= 5:
        return "looped"
    if metric.compactions >= 2 and metric.tool_calls <= 3:
        return "stalled"
    if metric.tool_calls >= 80 or metric.duration_s >= 60 * 60:
        return "completed expensively"
    return "completed efficiently"

def session_breakdown(metrics: list[session_audit.SessionMetrics]) -> dict[str, int]:
    counts = {
        "completed efficiently": 0,
        "completed expensively": 0,
        "stalled": 0,
        "looped": 0,
    }
    for metric in metrics:
        counts[classify_session(metric)] += 1
    return counts

def median_int(values: list[int]) -> int:
    return session_audit._median(values) if values else 0

def recommendations(snapshot: OptimisationSnapshot) -> list[str]:
    recommendations_out: list[str] = []
    high_risk = [metric for metric in snapshot.metrics if metric.loop_score >= 4]
    failed_checks = [check for check in snapshot.checks if check.status == "fail"]
    if high_risk:
        recommendations_out.append(
            "Framework: inspect the top loop-score session and tighten the matching guard rail before broader changes."
        )
    if failed_checks:
        recommendations_out.append(
            f"Project: fix the first failing quality gate (`{failed_checks[0].command}`) before optimisation work."
        )
    if snapshot.large_files:
        largest_path, line_count = snapshot.large_files[0]
        recommendations_out.append(
            f"Maintainability: split `{largest_path}` ({line_count} lines) before adding more logic there."
        )
    if not any(check.command == "uv run pytest" and check.status != "skip" for check in snapshot.checks):
        recommendations_out.append(
            "Robustness: add at least one smoke or integration test path so optimisation changes have a regression net."
        )
    if not recommendations_out:
        recommendations_out.append(
            "Baseline looks healthy. Capture a checkpoint and compare again after the next major change."
        )
    return recommendations_out[:4]

def default_out_path(directory: Path, prefix: str) -> Path:
    stamp = time.strftime("%Y-%m-%d-%H%M%S")
    return directory / ".agent-toolkit" / "plans" / "audits" / f"{prefix}-{stamp}.md"

def render_snapshot_report(snapshot: OptimisationSnapshot) -> str:
    breakdown = session_breakdown(snapshot.metrics)
    failed = [check for check in snapshot.checks if check.status == "fail"]
    skipped = [check for check in snapshot.checks if check.status == "skip"]
    lines: list[str] = [
        "# OpenCode Optimisation Report",
        "",
        f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        f"Directory: {snapshot.directory}",
        f"Window: last {snapshot.days} day(s)",
        f"DB: {snapshot.db_path}",
        "",
        "## Overview",
        "",
        f"- Sessions audited: {len(snapshot.metrics)}",
        f"- High-risk sessions: {sum(1 for metric in snapshot.metrics if metric.loop_score >= 4)}",
        f"- Session classes: efficient={breakdown['completed efficiently']}, expensive={breakdown['completed expensively']}, stalled={breakdown['stalled']}, looped={breakdown['looped']}",
    ]
    if snapshot.metrics:
        lines.extend(
            [
                f"- Median loop score: {median_int([metric.loop_score for metric in snapshot.metrics])}",
                f"- Median tool calls: {median_int([metric.tool_calls for metric in snapshot.metrics])}",
                f"- Median compactions: {median_int([metric.compactions for metric in snapshot.metrics])}",
            ]
        )
    lines.extend(
        [
            f"- Quality checks: {len(snapshot.checks) - len(failed) - len(skipped)} pass / {len(failed)} fail / {len(skipped)} skip",
            f"- Large files over 300 lines: {len(snapshot.large_files)}",
            "",
            "## Session Health",
            "",
        ]
    )
    if not snapshot.metrics:
        lines.append("No OpenCode sessions found for this directory in the selected window.")
    else:
        for metric in sorted(snapshot.metrics, key=lambda item: item.loop_score, reverse=True)[:3]:
            lines.append(
                f"- {classify_session(metric)} | loop={metric.loop_score} | tools={metric.tool_calls} | "
                f"compactions={metric.compactions} | `{metric.session.id}` | {metric.session.title}"
            )
    lines.extend(["", "## Quality Checks", "", "| Check | Status | Duration | Details |", "|---|---|---:|---|"])
    for check in snapshot.checks:
        lines.append(f"| `{check.command}` | {check.status} | {check.duration_s:.1f}s | {check.detail.replace('|', '\\|')} |")
    lines.extend(["", "## File Caps", ""])
    if not snapshot.large_files:
        lines.append("No source files over 300 lines detected.")
    else:
        for path, line_count in snapshot.large_files[:10]:
            lines.append(f"- {line_count} lines: `{path}`")
    lines.extend(["", "## Recommendations", ""])
    for recommendation in recommendations(snapshot):
        lines.append(f"- {recommendation}")
    lines.append("")
    return "\n".join(lines)

def render_compare_report(*, current: OptimisationSnapshot, previous: OptimisationSnapshot) -> str:
    current_breakdown = session_breakdown(current.metrics)
    previous_breakdown = session_breakdown(previous.metrics)
    current_median_tools = median_int([metric.tool_calls for metric in current.metrics])
    previous_median_tools = median_int([metric.tool_calls for metric in previous.metrics])
    current_median_compactions = median_int([metric.compactions for metric in current.metrics])
    previous_median_compactions = median_int([metric.compactions for metric in previous.metrics])
    lines: list[str] = [
        "# OpenCode Optimisation Comparison",
        "",
        f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        f"Directory: {current.directory}",
        f"Current window: last {current.days} day(s)",
        f"Previous window: {previous.offset_days + previous.days} to {previous.offset_days} day(s) ago",
        "",
        "## Session Deltas",
        "",
        "| Metric | Current | Previous | Delta |",
        "|---|---:|---:|---:|",
        f"| Sessions audited | {len(current.metrics)} | {len(previous.metrics)} | {len(current.metrics) - len(previous.metrics)} |",
        f"| Looped sessions | {current_breakdown['looped']} | {previous_breakdown['looped']} | {current_breakdown['looped'] - previous_breakdown['looped']} |",
        f"| Stalled sessions | {current_breakdown['stalled']} | {previous_breakdown['stalled']} | {current_breakdown['stalled'] - previous_breakdown['stalled']} |",
        f"| Expensive completions | {current_breakdown['completed expensively']} | {previous_breakdown['completed expensively']} | {current_breakdown['completed expensively'] - previous_breakdown['completed expensively']} |",
        f"| Efficient completions | {current_breakdown['completed efficiently']} | {previous_breakdown['completed efficiently']} | {current_breakdown['completed efficiently'] - previous_breakdown['completed efficiently']} |",
        f"| Median tool calls | {current_median_tools} | {previous_median_tools} | {current_median_tools - previous_median_tools} |",
        f"| Median compactions | {current_median_compactions} | {previous_median_compactions} | {current_median_compactions - previous_median_compactions} |",
        "",
        "## Current State",
        "",
        f"- Current high-risk sessions: {sum(1 for metric in current.metrics if metric.loop_score >= 4)}",
        f"- Current quality failures: {sum(1 for check in current.checks if check.status == 'fail')}",
        f"- Current large files over 300 lines: {len(current.large_files)}",
        "",
        "## Interpretation",
        "",
    ]
    if current_breakdown["looped"] < previous_breakdown["looped"]:
        lines.append("- Looping improved relative to the previous window.")
    elif current_breakdown["looped"] > previous_breakdown["looped"]:
        lines.append("- Looping worsened relative to the previous window.")
    else:
        lines.append("- Looping was flat relative to the previous window.")
    if current_median_tools > previous_median_tools:
        lines.append("- Median tool usage increased; check for over-exploration or larger task scope.")
    if current_median_compactions > previous_median_compactions:
        lines.append("- Median compactions increased; review continuation and compaction guard rails.")
    if sum(1 for check in current.checks if check.status == "fail"):
        lines.append("- Current repo still has failing quality checks, so workflow efficiency gains may not be trustworthy yet.")
    lines.extend(["", "## Recommendations", ""])
    lines.append("- Framework: use the worst current session as the next anti-loop regression test.")
    lines.append("- Project: fix the current quality-gate failures before attributing improvements to the framework.")
    lines.append("")
    return "\n".join(lines)
