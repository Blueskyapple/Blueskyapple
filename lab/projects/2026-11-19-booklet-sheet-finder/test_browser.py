"""Offline browser checks. Requires Playwright, Chromium and pdftotext."""
from pathlib import Path
from shutil import which
import subprocess
import unittest

from playwright.sync_api import sync_playwright


class SheetFinder(unittest.TestCase):
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
        self.page.set_content(Path(__file__).with_name("booklet-sheet-finder.html").read_text())
        self.pages = self.page.get_by_label("Document pages")
        self.find = self.page.get_by_label("Find page")

    def rows(self):
        return self.page.locator("tbody tr").evaluate_all(
            "(rows) => rows.map(row => [...row.querySelectorAll('td')].map(td => td.textContent))"
        )

    def test_reprint_center_sheet_and_print_plan(self):
        self.find.fill("7")
        self.assertEqual(self.page.locator("output").inner_text(), "Page 7 is on sheet 4, front right.")
        self.assertEqual(self.rows()[-1], ["10", "7", "8", "9"])
        self.page.evaluate("window.print = () => window.printRequested = true")
        self.page.get_by_role("button", name="Print this plan").click()
        self.assertTrue(self.page.evaluate("window.printRequested"))
        pdf = self.page.pdf(format="A4")
        text = subprocess.check_output(["pdftotext", "-layout", "-", "-"], input=pdf).decode()
        self.assertIn("Page 7 is on sheet 4, front right.", text)
        self.assertRegex(text, r"4\s+10\s+7\s+8\s+9")
        self.assertNotIn("Print this plan", text)

    def test_reading_order_after_fold(self):
        for binding in ("left", "right"):
            self.page.get_by_label("Binding edge").select_option(binding)
            for count in (1, 2, 3, 4, 8, 13, 15, 16, 37, 255, 256):
                with self.subTest(binding=binding, count=count):
                    self.pages.fill(str(count))
                    rows = self.rows()
                    near, far = (1, 0) if binding == "left" else (0, 1)
                    first_half = [v for row in rows for v in (row[near], row[2 + far])]
                    second_half = [v for row in reversed(rows) for v in (row[2 + near], row[far])]
                    self.assertEqual(first_half + second_half,
                                     [str(i) for i in range(1, count + 1)] + ["Blank"] * (-count % 4))

    def test_lookup_and_input_recovery(self):
        self.pages.fill("13")
        self.page.get_by_label("Binding edge").select_option("right")
        self.find.fill("1")
        self.assertIn("sheet 1, front left", self.page.locator("output").inner_text())
        self.assertEqual(self.page.locator(".hit").inner_text(), "1")
        self.find.fill("14")
        self.assertFalse(self.page.locator("table").is_visible())
        self.find.fill("")
        for value in ("0", "", "3.5", "257"):
            self.pages.fill(value)
            self.assertFalse(self.page.locator("table").is_visible())
        self.pages.fill("4")
        self.assertEqual(self.rows(), [["1", "4", "3", "2"]])


if __name__ == "__main__":
    unittest.main()
