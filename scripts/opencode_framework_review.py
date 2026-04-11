#!/usr/bin/env python3
"""Create a consolidated framework review from recent audit files."""

from __future__ import annotations

import argparse
import re
import time
from pathlib import Path


def latest_file(audits_dir: Path, pattern: str) -> Path | None:
    matches = sorted(audits_dir.glob(pattern), key=lambda path: path.stat().st_mtime, reverse=True)
    return matches[0] if matches else None


def read_text(path: Path | None) -> str:
    if path is None or not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def extract_int(text: str, label: str) -> int | None:
    match = re.search(rf"- {re.escape(label)}: (\d+)", text)
    return int(match.group(1)) if match else None


def extract_quality_line(text: str) -> str | None:
    match = re.search(r"- Quality checks: .+", text)
    return match.group(0) if match else None


def extract_bullet_block(text: str, header: str, limit: int) -> list[str]:
    pattern = rf"## {re.escape(header)}\n\n(?P<body>.*?)(?:\n## |\Z)"
    match = re.search(pattern, text, re.S)
    if not match:
        return []
    body = match.group("body")
    bullets = [line for line in body.splitlines() if line.startswith("- ")]
    return bullets[:limit]


def render_review(
    *,
    repo_dir: Path,
    optimise_path: Path | None,
    compare_path: Path | None,
    audit_path: Path | None,
) -> str:
    optimise_text = read_text(optimise_path)
    compare_text = read_text(compare_path)
    audit_text = read_text(audit_path)

    sessions = extract_int(optimise_text, "Sessions audited")
    high_risk = extract_int(optimise_text, "High-risk sessions")
    large_files = extract_int(optimise_text, "Large files over 300 lines")
    quality_line = extract_quality_line(optimise_text)
    optimise_recs = extract_bullet_block(optimise_text, "Recommendations", 3)
    compare_interp = extract_bullet_block(compare_text, "Interpretation", 3)
    audit_risky = extract_bullet_block(audit_text, "Overview", 4)

    lines: list[str] = [
        "# Framework Review",
        "",
        f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        f"Repository: {repo_dir}",
        "",
        "## Sources",
        "",
        f"- Optimise: `{optimise_path.name}`" if optimise_path else "- Optimise: missing",
        f"- Compare: `{compare_path.name}`" if compare_path else "- Compare: missing",
        f"- Session audit: `{audit_path.name}`" if audit_path else "- Session audit: missing",
        "",
        "## Snapshot",
        "",
    ]
    if sessions is not None:
        lines.append(f"- Sessions audited: {sessions}")
    if high_risk is not None:
        lines.append(f"- High-risk sessions: {high_risk}")
    if large_files is not None:
        lines.append(f"- Large files over 300 lines: {large_files}")
    if quality_line:
        lines.append(quality_line)
    lines.extend(["", "## Framework Signals", ""])
    if compare_interp:
        lines.extend(compare_interp)
    else:
        lines.append("- No comparison interpretation available yet.")
    lines.extend(["", "## Latest Recommendations", ""])
    if optimise_recs:
        lines.extend(optimise_recs)
    else:
        lines.append("- No optimise recommendations found.")
    lines.extend(["", "## Audit Notes", ""])
    if audit_risky:
        lines.extend(audit_risky)
    else:
        lines.append("- No session-audit overview bullets found.")
    lines.extend(["", "## Review", ""])
    if high_risk and high_risk > 0:
        lines.append("- The framework is still showing loop risk in real sessions. Prioritize anti-loop and planning-gate fixes.")
    else:
        lines.append("- No obvious high-risk loop count in the latest optimise snapshot.")
    if quality_line and " fail " in quality_line:
        lines.append("- Verification failures in the target repo reduce confidence in workflow-efficiency conclusions.")
    if large_files and large_files > 0:
        lines.append("- Oversized files remain a structural drag on agent performance and context efficiency.")
    lines.extend(["", "## Next Action", ""])
    lines.append("- Pick one high-risk session from the latest reports, patch one framework control point, then rerun `/optimise-compare`.")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a consolidated framework review.")
    parser.add_argument("--dir", dest="directory", type=str, default=".")
    parser.add_argument("--audits-dir", dest="audits_dir", type=str, default=None)
    parser.add_argument("--out", type=str, default=None)
    args = parser.parse_args()

    repo_dir = Path(args.directory).expanduser().resolve()
    audits_dir = Path(args.audits_dir).expanduser().resolve() if args.audits_dir else repo_dir / ".agent-toolkit" / "plans" / "audits"
    if not repo_dir.is_dir():
        raise SystemExit(f"Directory not found: {repo_dir}")
    if not audits_dir.exists():
        raise SystemExit(f"Audits directory not found: {audits_dir}")

    optimise_path = latest_file(audits_dir, "opencode-optimise-*.md")
    compare_path = latest_file(audits_dir, "opencode-optimise-compare-*.md")
    audit_path = latest_file(audits_dir, "opencode-audit-*.md")
    review = render_review(
        repo_dir=repo_dir,
        optimise_path=optimise_path,
        compare_path=compare_path,
        audit_path=audit_path,
    )

    out_path = Path(args.out).expanduser() if args.out else audits_dir / f"framework-review-{time.strftime('%Y-%m-%d-%H%M%S')}.md"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(review + "\n", encoding="utf-8")
    print(str(out_path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
