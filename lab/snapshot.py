"""Record per-project download counts from a complete GitHub Releases JSON list."""
import argparse
import csv
from datetime import date
import json
from pathlib import Path

LAB = Path(__file__).resolve().parent


def snapshot(releases, day, root=LAB):
    by_tag = {r["tag_name"]: r for r in releases if not r["draft"]}
    rows = []
    for path in sorted((root / "projects").glob("*/release.json")):
        project = path.parent.name
        manifest = json.loads(path.read_text())
        name = manifest["asset"]
        for version in range(1, manifest.get("version", 1) + 1):
            tag = "lab-" + project + (f"-v{version}" if version > 1 else "")
            release = by_tag.get(tag, {})
            asset = next((a for a in release.get("assets", [])
                          if a["name"] == name and a["state"] == "uploaded"), None)
            rows.append((project, "available" if asset else "awaiting_asset",
                         asset["id"] if asset else "", asset["download_count"] if asset else "",
                         release.get("published_at", ""), asset["browser_download_url"] if asset else "", version))
    dest = root / "metrics" / f"{day.isoformat()}.csv"
    dest.parent.mkdir(exist_ok=True)
    temp = dest.with_suffix(".tmp")
    with temp.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.writer(stream, lineterminator="\n")
        writer.writerow(("project", "status", "asset_id", "downloads", "published_at", "download_url", "version"))
        writer.writerows(rows)
    temp.replace(dest)
    return dest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("releases", type=Path, help="All release pages flattened into one JSON array")
    parser.add_argument("day", type=date.fromisoformat, help="Lab day in America/Los_Angeles")
    args = parser.parse_args()
    print(snapshot(json.loads(args.releases.read_text()), args.day))
