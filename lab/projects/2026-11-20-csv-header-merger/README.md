# Merge CSV Files by Header

Open the downloaded HTML in a browser, choose multiple CSV files in one selection, then expand **Review file and column matches**. Check the row counts and which output columns will be empty for each file. Select **Download merged CSV** to save the combined rows. All processing happens locally.

For example, January exports `ID,City` with `0003,Tokyo`. February exports `City,ID,Amount` with `Oslo,0042,2.50`. The result has the following data.

```csv
ID,City,Amount
0003,Tokyo,""
0042,Oslo,2.50
```

Rows follow file-picker order. Headers follow their first appearance. Matching is exact, so `ID`, `Id` and `ID ` are distinct. Spreadsheet importers may infer numeric types. Choose text for ID columns when importing the result. The tool appends rows and keeps duplicates.

## Supported files

Use UTF-8 comma-separated files with one header row. Quoted commas, embedded line breaks, escaped quotes, empty fields and optional input byte-order marks are supported. Output uses UTF-8 with a BOM and CRLF record endings. Empty physical lines are skipped. A quoted empty value remains a data record.

The tool accepts 2–512 files, 16 MiB total input, 1,024 combined columns, and one million cells each for input and output. Ambiguous headers, invalid quoting, invalid encoding or a row with the wrong number of fields stop the batch and identify the offending file. Large recurring imports with transformation rules are better served by a query or scripted pipeline.

## Research and selection

| Candidate | Evidence, cost and alternatives | Decision |
| --- | --- | --- |
| Combine exports with inconsistent headers | A Fabric Community user reported that concatenating CSVs placed values under the wrong headers. A separate user had 350+ files with varying columns and order. Manual inspection scales with files and columns. Power Query supports folder imports and transformations, and scripts can implement a header union. [Fabric report](https://community.fabric.microsoft.com/discussions/power-bi-services/combine-csv-files-with-inconsistent-columns-and-missing-columns/4798169/replies/4798647) · [350-file report](https://stackoverflow.com/questions/64995505/how-can-i-combine-multiple-csv-files-with-different-column-names-and-column-orde) · [Power Query workflow](https://learn.microsoft.com/en-us/power-query/combine-files-csv) | Selected. The cost of silent misalignment is concrete, a browser can show the mapping before export, and the example gives a measurable acceptance test. |
| Interleave odd and even scanned pages | Users describe scanning 30 pages in two passes, sometimes reversing one stack. A wrong order can require inspecting the PDF again. PDFtk shuffle and GNOME Document Scanner already cover this workflow. [Scan discussion](https://superuser.com/questions/516612/merge-two-pdf-files-containing-even-and-odd-pages-of-a-book) | Plausible demand among single-sided scanner owners. Existing tools and the added PDF packaging and verification work made this a weaker one-day choice. |
| Batch rename camera files | A user describes naming conflicts during a large batch. ReNamer and metadata-aware tools already offer naming rules and sequence numbers. [Naming discussion](https://superuser.com/questions/347931/how-do-i-rename-a-bunch-of-files-in-the-command-prompt) | The audience is identifiable, but preferences vary and a mistake can affect many originals. A preview alone would address only part of the task. |

These reports establish recurrence for the selected problem. They do not measure market size. Two users independently requested retaining unmatched columns as well as matching shared ones. [Additional header-union request](https://stackoverflow.com/questions/75069501/combine-csv-files-with-the-same-column-header)

## Distribution and measurement

At the November 20 morning check the two Subtitle Drift Fixer versions had each gained one asset download in the same roughly 16.5-hour window since the November 19 cutover. The three other lab assets were flat over that window. The repository issue search returned no project-specific reports. This gives little evidence for picking a topic from download rankings, so this release uses the task people actually searched for as its title and shows a worked example in the release notes. Check its asset count in the next daily snapshot at about 24 hours of age, record the actual elapsed time, and look for reports of successful or failed header matches. Counts alone cannot establish why someone downloaded it. [Prior cutover](../2026-11-19-subtitle-drift-fixer/observations/cutover.csv) · [Lab metrics](../../metrics/)

## Verification

Five offline Chromium tests exercised the file picker, mapping preview, and downloaded file. Python's independent CSV reader verified all 350 rows from alternating column layouts. Other cases covered a header-only file, a newly introduced column, multilingual and multiline text, escaped quotes, leading-zero IDs, empty values, malformed inputs, recovery, and a sparse merge exceeding the output limit. Run `python test_browser.py` with Python, Playwright and Chromium installed.
