#!/usr/bin/env python3
"""Generate a combined optimisation report for an OpenCode project."""

from __future__ import annotations

import argparse
from pathlib import Path

from opencode_optimise_common import build_snapshot, default_out_path, render_snapshot_report
import opencode_session_audit as session_audit


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate an OpenCode optimisation report.")
    parser.add_argument("--dir", dest="directory", type=str, default=".")
    parser.add_argument("--days", type=int, default=7)
    parser.add_argument("--db", type=str, default=str(session_audit.DB_DEFAULT))
    parser.add_argument("--out", type=str, default=None)
    args = parser.parse_args()

    directory = Path(args.directory).expanduser().resolve()
    db_path = Path(args.db).expanduser()
    days = max(1, int(args.days))
    if not directory.is_dir():
        raise SystemExit(f"Directory not found: {directory}")
    if not db_path.exists():
        raise SystemExit(f"OpenCode db not found: {db_path}")

    snapshot = build_snapshot(directory=directory, days=days, db_path=db_path, offset_days=0)
    report = render_snapshot_report(snapshot)
    out_path = Path(args.out).expanduser() if args.out else default_out_path(directory, "opencode-optimise")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(report + "\n", encoding="utf-8")
    print(str(out_path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
