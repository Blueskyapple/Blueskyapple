"""Save a timestamped observation of the five fixed lab assets for this experiment."""
import argparse
import csv
from datetime import datetime
import json
from pathlib import Path
from zoneinfo import ZoneInfo

HERE = Path(__file__).resolve().parent
TAGS = {
    "lab-2026-11-19-subtitle-drift-fixer-v2": "subtitle-drift-fixer.html",
    "lab-2026-11-19-subtitle-drift-fixer": "subtitle-drift-fixer.html",
    "lab-2026-11-19-booklet-sheet-finder": "booklet-sheet-finder.html",
    "lab-2026-11-19-bookmark-cleaner": "bookmark-cleaner.html",
    "lab-2026-11-19-csv-encoding": "csv-encoding.html",
}
FIELDS = ["observed_at", "tag", "asset_id", "downloads", "since_cutover", "status"]


def observe(releases, when, folder, baseline=False):
    if when.tzinfo is None:
        raise ValueError("Include the timezone in the observation timestamp.")
    folder.mkdir(exist_ok=True, parents=True)
    baseline_path = folder / "cutover.csv"
    initial = {}
    if not baseline:
        with baseline_path.open() as stream:
            initial = {row["tag"]: row for row in csv.DictReader(stream)}
    by_tag = {r["tag_name"]: r for r in releases if not r["draft"]}
    rows = []
    for tag, filename in TAGS.items():
        asset = next((a for a in by_tag.get(tag, {}).get("assets", [])
                      if a["name"] == filename and a["state"] == "uploaded"), None)
        asset_id, count, delta, status = "", "", "", "missing"
        if asset:
            asset_id, count = str(asset["id"]), asset["download_count"]
            status = "observed"
            if baseline:
                delta = 0
            elif initial[tag]["asset_id"] != asset_id:
                status = "replaced"
            elif count < int(initial[tag]["downloads"]):
                status = "counter_reset"
            else:
                delta = count - int(initial[tag]["downloads"])
        elif baseline:
            raise ValueError(f"Missing asset at cutover: {tag}")
        rows.append((when.isoformat(), tag, asset_id, count, delta, status))
    day = when.astimezone(ZoneInfo("America/Los_Angeles")).date()
    dest = baseline_path if baseline else folder / f"{day}.csv"
    if dest.exists():
        return dest
    temp = dest.with_suffix(".tmp")
    with temp.open("w", newline="") as stream:
        writer = csv.writer(stream, lineterminator="\n")
        writer.writerow(FIELDS)
        writer.writerows(rows)
    temp.replace(dest)
    return dest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("releases", type=Path, help="Complete GitHub releases JSON array")
    parser.add_argument("observed_at", type=datetime.fromisoformat)
    parser.add_argument("--baseline", action="store_true")
    args = parser.parse_args()
    print(observe(json.loads(args.releases.read_text()), args.observed_at, HERE / "observations", args.baseline))
