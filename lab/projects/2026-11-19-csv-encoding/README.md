# CSV Encoding Desk

Download `csv-encoding.html`, open it in a modern browser, choose a UTF-8 CSV, and click **Save a copy**. Use **Excel** when accented names or non-Latin characters look garbled on opening an export. Use **Data import** when an invisible byte-order mark (BOM) prevents a program from recognizing the first column name.

The tool runs offline, reads up to 32 MiB and changes only the leading UTF-8 marker. It preserves delimiters, quotes and newlines. For a legacy encoding, export the original data as UTF-8 first. Text already saved with incorrect characters requires a different repair.

## Why this project

Broadcom documents garbled non-Latin incident exports. A separate project reports that the opposite setting can leave an unexpected marker in the first header when importing an Excel export. A local copy with an explicit destination addresses both cases without requiring access to the original exporter. [Broadcom support](https://knowledge.broadcom.com/external/article/268555/file-name-in-chinese-language-is-not-ret.html) · [Strawberryfield import report](https://github.com/esmero/strawberryfield/issues/400)

Excel's text import flow also handles encoding selection. An offline utility is most likely to help the person preparing a file for someone else. That audience and its demand are hypotheses to check against downloads and issue reports. [Microsoft Excel guidance](https://support.microsoft.com/en-us/office/opening-csv-utf-8-files-correctly-in-excel-8a935af5-3416-4edd-ba7e-3dfd2bc4a032)

## Verification

With Python, Playwright and Chromium installed, run `python test_browser.py` from this directory. The test drives the form offline, reads the downloaded bytes, and exercises encoding and size errors. Compatibility with Excel is based on the documented file format. The test runs in Chromium.

Launch verification passed eight offline file conversions, four invalid or oversized inputs, and a successful retry after an error. The published HTML matched the tested file by SHA-256.
