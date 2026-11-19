# Booklet Sheet Finder

Find which physical sheet to reprint when a page in a folded booklet is damaged. The downloadable HTML also makes a printable front-and-back plan for the entire booklet. It runs offline in a browser.

## Find a sheet

1. Open `booklet-sheet-finder.html`. Enter the document page count, including covers, and choose the binding edge.
2. Enter the page you need to replace. The result identifies its sheet, face and position. The row shows the other three page positions you need to reproduce.
3. In your booklet-printing software, select that sheet for reprinting. **Print this plan** prints the reference table or saves it as a PDF through your browser.

For a left-bound, 16-page zine, page 7 is on sheet 4. Its front reads **10 | 7** and its back reads **8 | 9**. Sheet 1 is always the outermost sheet. Page numbers refer to document positions starting at 1, regardless of any page labels printed in the artwork.

## Where the plan applies

Use this tool for one stack of double-sided sheets nested and folded once down the middle. It supports 1–256 document pages and fills unused positions with blanks at the end. Count any intentionally placed blank pages in the original document. The upper limit is a calculator limit. The paper stock and binding determine how many sheets can physically fold together. Printer feed direction, separate covers, multi-signature books and single-sheet cut-and-fold mini zines require their own layouts.

## Why this project

One zine maker described wasting prints while figuring out page order. An InDesign user specifically wanted to reprint the inner sheet of a 16-page booklet after a partial print. Acrobat already arranges complete jobs and supports sheet ranges. This tool addresses the narrower question of which sheet number to enter when all you know is the damaged page. [Zine maker's account](https://www.reddit.com/r/zines/comments/1wo9r7n/my_first_digital_zine/) · [Center-sheet reprint question](https://community.adobe.com/questions-671/print-booklet-question-i-m-lost-831496) · [Acrobat booklet printing](https://helpx.adobe.com/sg/acrobat/kb/print-booklets-acrobat-reader.html)

## Verification

Three offline Chromium tests passed. The 16-page reprint example matched the reported center spread and the generated PDF contained the expected sheet map. Reading order and blank placement were checked across 11 lengths in both binding directions, including 1 and 256 pages. Invalid inputs and recovery were also exercised. Physical printing and printer-driver settings were outside the test scope.

Run `python test_browser.py` with Playwright, Chromium and Poppler's `pdftotext` installed.
