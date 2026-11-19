"""Run with python test_browser.py. Requires Playwright and Chromium."""
import codecs
from pathlib import Path
from shutil import which
from tempfile import TemporaryDirectory
import unittest

from playwright.sync_api import sync_playwright


class CsvDesk(unittest.TestCase):
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
        self.page.set_content(Path(__file__).with_name("csv-encoding.html").read_text(encoding="utf-8"))

    def select(self, data):
        self.page.locator("#csv").set_input_files(
            {"name": "contacts.CSV", "mimeType": "text/csv", "buffer": data}
        )

    def test_offline_download(self):
        body = 'name,note\r\nZoë,"東京,\r\n café"\r\n'.encode()
        for content in [body, b""]:
            for prefix in [codecs.BOM_UTF8, b""]:
                for target in ["excel", "import"]:
                    with self.subTest(content=content, prefix=prefix, target=target):
                        self.select(prefix + content)
                        self.page.locator("#mode").select_option(target)
                        with self.page.expect_download() as result:
                            self.page.get_by_role("button", name="Save a copy").click()
                        download = result.value
                        self.assertEqual(download.suggested_filename, f"contacts-{target}.csv")
                        expected = codecs.BOM_UTF8 if target == "excel" else b""
                        self.assertEqual(download.path().read_bytes(), expected + content)

    def test_errors_and_recovery(self):
        for data, message in [(b"\xff", "not valid UTF-8"), (b"a\x00", "null bytes"),
                              (codecs.BOM_UTF8 * 2, "Multiple leading")]:
            self.select(data)
            self.page.get_by_role("button", name="Save a copy").click()
            self.page.get_by_text(message, exact=False).wait_for()
            self.assertTrue(self.page.get_by_role("button", name="Save a copy").is_enabled())
        with TemporaryDirectory() as tmp:
            large = Path(tmp) / "large.csv"
            with large.open("wb") as stream:
                stream.truncate(32 * 1024 * 1024 + 1)
            self.page.locator("#csv").set_input_files(large)
            self.page.get_by_role("button", name="Save a copy").click()
            self.page.get_by_text("Choose a file of 32 MiB or less.").wait_for()
        self.select(b"a,b")
        with self.page.expect_download():
            self.page.get_by_role("button", name="Save a copy").click()


if __name__ == "__main__":
    unittest.main()
