"""Run with Python, Playwright and Chromium."""
import csv
import io
from pathlib import Path
from shutil import which
import unittest

from playwright.sync_api import sync_playwright


def export(name, rows):
    text = io.StringIO(newline="")
    csv.writer(text).writerows(rows)
    return payload(name, text.getvalue().encode("utf-8-sig"))


def payload(name, data):
    return {"name": name, "mimeType": "text/csv", "buffer": data}


class MergeTests(unittest.TestCase):
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
        self.page.set_content(Path(__file__).with_name("merge-csv-by-header.html").read_text())
        self.files = self.page.get_by_label("Choose two or more CSV files")
        self.save = self.page.get_by_role("button", name="Download merged CSV")
        self.status = self.page.get_by_role("status")

    def saved_rows(self):
        with self.page.expect_download() as item:
            self.save.click()
        self.assertEqual(item.value.suggested_filename, "merged.csv")
        with item.value.path().open(encoding="utf-8-sig", newline="") as stream:
            return list(csv.reader(stream, strict=True))

    def test_mismatched_headers_and_review(self):
        value = 'a, "quoted" note\r\nsecond line'
        self.files.set_input_files([
            export("January.csv", [["ID","City","Note"],["0003","東京",value]]),
            export("February.csv", [["Note","ID","Amount"],["","0042","2.50"]]),
            export("March.csv", [["City","ID"]]),
        ])
        self.page.get_by_text("3 files · 2 data rows · 4 output columns").wait_for()
        self.page.get_by_text("Review file and column matches").click()
        self.assertEqual(self.page.locator("tbody tr").nth(1).locator("td").all_inner_texts(),
                         ["February.csv", "1", "Note · ID · Amount", "City"])
        self.assertEqual(self.saved_rows(), [
            ["ID","City","Note","Amount"],["0003","東京",value,""],["0042","","","2.50"],
        ])

    def test_350_files(self):
        inputs = [export(f"{i}.csv", [["id","value"],[str(i),"A"]]) if i%2==0 else
                  export(f"{i}.csv", [["value","id"],["A",str(i)]]) for i in range(350)]
        self.files.set_input_files(inputs)
        self.assertEqual(self.saved_rows(), [["id","value"]]+[[str(i),"A"] for i in range(350)])

    def test_blank_records_and_empty_single_column_values(self):
        self.files.set_input_files([payload("A.csv", b'code\r\n\r\n""\r\n001'),
                                   payload("B.csv", b'code\n003\n')])
        self.assertEqual(self.saved_rows(), [["code"],[""],["001"],["003"]])

    def test_sparse_output_limit(self):
        cols = [f"extra{i}" for i in range(1000)]
        self.files.set_input_files([export("many-rows.csv", [["id"]] + [["001"]] * 1000),
                                   export("many-columns.csv", [cols])])
        self.status.filter(has_text="million output cells").wait_for()
        self.assertFalse(self.save.is_visible())

    def test_invalid_batch_and_recovery(self):
        valid = payload("valid.csv", b"id,note\n1,ok")
        self.files.set_input_files([valid,valid | {"name":"other.csv"}])
        self.save.wait_for()
        for data, msg in [(b"id,id\n1,2", "unique"), (b"id,\n1,2","nonempty"),
                          (b"id,name\n1","expected 2"), (b'id\n"oops',"Unclosed quote"),
                          (b'id\nx"y', "Unexpected"), (b"", "No header"), (b"\xff","UTF-8"),
                          (b"a\x00","Null bytes")]:
            self.files.set_input_files([valid,payload("broken.csv",data)])
            self.status.filter(has_text="broken.csv").filter(has_text=msg).wait_for()
            self.assertFalse(self.save.is_visible())
        self.files.set_input_files([valid])
        self.status.filter(has_text="at least two").wait_for()
        self.files.set_input_files([valid,payload("fresh.csv",b"note,id\rHI,2\r")])
        self.assertEqual(self.saved_rows(), [["id","note"],["1","ok"],["2","HI"]])


if __name__ == "__main__":
    unittest.main()
