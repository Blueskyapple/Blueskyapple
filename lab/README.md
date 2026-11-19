# Daily Research Lab

Small tools built from recurring problems reported on the public web. Each project includes the evidence that motivated it, a working download, and a reproducible test.

| Submission | What it does | Files |
| --- | --- | --- |
| 2026-11-19 · Subtitle Drift Fixer | Corrects a constant delay or gradual drift in an SRT using one or two spoken times. | [Project and tests](projects/2026-11-19-subtitle-drift-fixer/) · [Download Subtitle Drift Fixer](https://github.com/Blueskyapple/Blueskyapple/releases/download/lab-2026-11-19-subtitle-drift-fixer/subtitle-drift-fixer.html) |
| 2026-11-19 · Booklet Sheet Finder | Finds the sheet to reprint for any page of a folded booklet and prints a front-and-back plan. | [Project and tests](projects/2026-11-19-booklet-sheet-finder/) · [Download Booklet Sheet Finder](https://github.com/Blueskyapple/Blueskyapple/releases/download/lab-2026-11-19-booklet-sheet-finder/booklet-sheet-finder.html) |
| 2026-11-19 · Bookmark Copy Cleaner | Previews and removes duplicate bookmarks within each folder of an HTML export, offline. | [Project and tests](projects/2026-11-19-bookmark-cleaner/) · [Download Bookmark Copy Cleaner](https://github.com/Blueskyapple/Blueskyapple/releases/download/lab-2026-11-19-bookmark-cleaner/bookmark-cleaner.html) |
| 2026-11-19 · CSV Encoding Desk | Prepares UTF-8 CSVs for Excel or cleans an invisible marker from an import header, offline. | [Project and tests](projects/2026-11-19-csv-encoding/) · [Download CSV Encoding Desk](https://github.com/Blueskyapple/Blueskyapple/releases/download/lab-2026-11-19-csv-encoding/csv-encoding.html) |

## Daily mission

1. Read recent user reports across independent sites. Record concrete examples, workarounds and competing tools. Pick one problem using evidence of repetition, cost to the user, an identifiable audience and a deliverable small enough to test today.
2. Build in a dated project directory. Test the downloadable artifact through its normal entry point with a realistic example and failure cases. Document the results, limitations and sources.
3. Add a manifest naming the tested asset, update the catalog, and push to the research-lab branch. The publishing workflow creates a tagged GitHub release for each new manifest. Verify the release asset before advertising its download URL. Resume the same day's project on retries.
4. Read every page of the GitHub releases API and flatten the results into one JSON array. Run `python lab/snapshot.py releases.json YYYY-MM-DD` and commit the resulting [daily snapshot](metrics/). If retrieval fails, record the gap and retain prior observations.
5. Compare download gains over matching observation windows, using the asset ID to detect resets. Also review project-specific feedback and task outcomes. Record which change to the next project's scope, packaging or discovery follows from the evidence. A blank count means an asset was unavailable. Raw file downloads, distinct users and successful sessions are unmeasured.

Use the project name in the repository's issue tracker when reporting a problem or describing a use case.
