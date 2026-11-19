"""Run with python test_browser.py after installing Playwright and Chromium."""
import codecs
from pathlib import Path
from shutil import which
from tempfile import TemporaryDirectory
import unittest

from playwright.sync_api import sync_playwright


HEADER = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\r\n<TITLE>Bookmarks</TITLE>\r\n<DL><p>\r\n'
END = '</DL><p>\r\n'
FIRST = '<DT><A HREF="https://example.org/?a=1&amp;b=2" ADD_DATE="1">Café</A>\r\n'
COPY = FIRST.replace('ADD_DATE="1"', 'ADD_DATE="2"')


class BookmarkCleaner(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.runtime = sync_playwright().start()
        cls.browser = cls.runtime.chromium.launch(executable_path=which("chromium"))

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.runtime.stop()

    def setUp(self):
        self.page = self.browser.new_page()
        self.addCleanup(self.page.close)
        self.page.context.set_offline(True)
        self.page.set_content(Path(__file__).with_name("bookmark-cleaner.html").read_text())
        self.file = self.page.get_by_label("Choose a bookmark HTML export")
        self.save = self.page.get_by_role("button", name="Save cleaned HTML")

    def select(self, data):
        self.file.set_input_files({"name": "bookmarks.html", "mimeType": "text/html", "buffer": data})

    def test_saved_file_and_second_pass(self):
        retained = (FIRST.replace('Café', 'Work copy') + FIRST.replace('ADD_DATE', 'TAGS')
                    + FIRST.replace('?a=1', '?a=2') + COPY + '<DD>User notes\r\n'
                    + '<DT><H3>Reading</H3>\r\n<DL><p>\r\n' + FIRST + END)
        expected = codecs.BOM_UTF8 + (HEADER + FIRST + retained + END).encode()
        self.select(codecs.BOM_UTF8 + (HEADER + FIRST + COPY + retained + END).encode())
        self.page.get_by_text("7 bookmarks checked. 1 duplicate copy found.").wait_for()
        with self.page.expect_download() as event:
            self.save.click()
        self.assertEqual(event.value.suggested_filename, "bookmarks-cleaned.html")
        data = event.value.path().read_bytes()
        self.assertEqual(data, expected)
        self.select(data)
        self.page.get_by_text("6 bookmarks checked. 0 duplicate copies found.").wait_for()
        self.assertFalse(self.save.is_visible())

    def test_large_collection_and_preview(self):
        self.select((HEADER + FIRST * 8000 + END).encode())
        self.page.get_by_text("8000 bookmarks checked. 7999 duplicate copies found.").wait_for()
        self.assertEqual(self.page.locator("li").count(), 13)

    def test_errors_clear_previous_download(self):
        self.select((HEADER + FIRST + COPY + END).encode())
        self.save.wait_for()
        for data, message in [(b"\xff", "not UTF-8"), (b"<html>hello</html>", "standard line-based"),
                              ((HEADER + FIRST).encode(), "standard line-based")]:
            self.select(data)
            self.page.get_by_role("status").filter(has_text=message).wait_for()
            self.assertFalse(self.save.is_visible())
        with TemporaryDirectory() as tmp:
            large = Path(tmp) / "large.html"
            with large.open("wb") as f:
                f.truncate(32 * 1024 * 1024 + 1)
            self.file.set_input_files(large)
            self.page.get_by_text("Choose an export of 32 MiB or less.").wait_for()
        self.select((HEADER + END).encode())
        self.page.get_by_text("0 bookmarks checked. 0 duplicate copies found.").wait_for()


if __name__ == "__main__":
    unittest.main()
