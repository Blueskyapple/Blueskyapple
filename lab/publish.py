"""Publish one immutable download per project. Invoke from the repository root."""
import json
import os
from pathlib import Path
import subprocess


def gh(*args):
    return subprocess.check_output(["gh", *args], text=True)


def main():
    existing = json.loads(gh("api", "--paginate", "--slurp",
                             "repos/{owner}/{repo}/releases?per_page=100"))
    releases = {release["tag_name"]: release for page in existing for release in page}
    for manifest in sorted(Path("lab/projects").glob("*/release.json")):
        metadata = json.loads(manifest.read_text())
        folder = manifest.parent
        tag = "lab-" + folder.name
        version = metadata.get("version", 1)
        if version > 1:
            tag += f"-v{version}"
        asset = folder / metadata["asset"]
        if asset.parent != folder or not asset.is_file():
            raise ValueError(f"Missing distribution file in {folder}")
        release = releases.get(tag)
        if release and not release["draft"]:
            if not any(a["name"] == asset.name and a["state"] == "uploaded" for a in release["assets"]):
                raise ValueError(f"Published release {tag} is missing {asset.name}")
            continue
        if not release:
            title = metadata["title"] if version == 1 else f"{metadata['title']} v{version}"
            gh("release", "create", tag, "--draft", "--target", os.environ["GITHUB_SHA"],
               "--title", title, "--notes-file", str(folder / "README.md"))
        gh("release", "upload", tag, str(asset), "--clobber")
        gh("release", "edit", tag, "--draft=false", "--latest=false")


if __name__ == "__main__":
    main()
