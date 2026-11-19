# Bookmark Copy Cleaner

Remove repeated bookmarks from the same folder in a browser HTML export. The tool works offline and produces a separate file.

1. Export your bookmarks as HTML. In Chrome, open Bookmark Manager and choose **Export bookmarks** from its menu.
2. Open the downloaded `bookmark-cleaner.html` in your browser and select your export.
3. Review the number of duplicates and a sample of the folder paths and titles. Select **Save cleaned HTML**.
4. Import the cleaned copy into an empty browser profile and check your folders. Importing into a populated profile can append its entries. Keep the original export as a backup. [Chrome import and export instructions](https://support.google.com/chrome/answer/96816)

## What counts as a duplicate

Within each folder, the first matching entry wins. The URL, title and bookmark attributes must match, apart from the added and modified timestamps. Separate folders, distinct query strings, renamed entries and different tags are kept. Bookmarks with descriptions are kept. Duplicate folders and ongoing sync problems are outside the scope of this tool.

The cleaner accepts standard line-based UTF-8 Netscape bookmark exports up to 32 MiB. It removes only the selected bookmark lines. Folder structure, byte-order mark and line endings are retained. A file with unsupported structure produces an error before saving.

## Why this project

A Chrome user reported over 8,000 bookmarks, mostly duplicates. Firefox users also report duplicates after importing HTML. Manual cleanup grows with collection size. Some Chrome configurations offer an account-based cleanup option. This utility gives people migrating browsers a way to preview the changes to an exported copy offline. The reports establish a recurring problem. The size of the audience for this particular solution is still unknown. [Chrome user report](https://support.google.com/chrome/thread/443196344/in-my-all-bookmarks-i-have-over-8000-bookmarks-most-of-these-entries-are-duplicates?hl=en) · [Firefox user report](https://support.mozilla.org/en-US/questions/1142704) · [Chrome account-based cleanup](https://support.google.com/chrome/blog/396839965/access-your-chrome-data-anywhere-by-signing-in?hl=en-GB)

## Test results

Three offline Chromium browser tests passed. The downloaded copy matched the expected UTF-8 bytes and a second pass found no duplicates. A synthetic 8,000-entry export produced the expected 7,999 matches. Invalid UTF-8, malformed HTML, oversized input and recovery were exercised through the file picker.

Run `python test_browser.py` with Python, Playwright and Chromium installed. Native browser import and live bookmark synchronization were outside the test scope.
