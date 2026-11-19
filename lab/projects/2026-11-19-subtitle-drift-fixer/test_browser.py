"""Requires Python, Playwright, Chromium and ffprobe."""
import codecs
import json
from pathlib import Path
from shutil import which
import subprocess
import unittest

from playwright.sync_api import sync_playwright


def subtitles(times):
    captions = ['<i>Héllo</i>\r\n東京', 'A timestamp in speech: 00:01:00,000', 'Thank you']
    blocks = [f'{i}\r\n{start} --> {end}\r\n{text}'
              for i, ((start, end), text) in enumerate(zip(times, captions), 1)]
    return codecs.BOM_UTF8 + ('\r\n\r\n'.join(blocks) + '\r\n').encode()


ORIGINAL = [('00:00:10,000', '00:00:12,000'), ('00:05:10,000', '00:05:12,000'),
            ('00:10:10,000', '00:10:12,000')]


class DriftFixer(unittest.TestCase):
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
        self.page.set_content(Path(__file__).with_name('subtitle-drift-fixer.html').read_text())
        self.save = self.page.get_by_role('button', name='Save corrected SRT')
        self.status = self.page.get_by_role('status')

    def select(self, data):
        self.page.locator('#file').set_input_files({'name':'talk.SRT','mimeType':'text/plain','buffer':data})

    def download(self):
        with self.page.expect_download() as result:
            self.save.click()
        self.assertEqual(result.value.suggested_filename, 'talk-synced.srt')
        return result.value.path()

    def test_drift_and_player_parser(self):
        self.select(subtitles(ORIGINAL))
        self.page.get_by_label('First spoken time').fill('00:00:11.000')
        self.page.get_by_label('Later spoken time').fill('00:10:17.000')
        path = self.download()
        expected = [('00:00:11,000','00:00:13,020'), ('00:05:14,000','00:05:16,020'),
                    ('00:10:17,000','00:10:19,020')]
        self.assertEqual(path.read_bytes(), subtitles(expected))
        packets = json.loads(subprocess.check_output([
            'ffprobe','-v','error','-f','srt','-show_packets','-of','json',str(path)]))['packets']
        self.assertEqual([int(p['pts']) for p in packets], [11000, 314000, 617000])
        self.assertEqual([int(p['duration']) for p in packets], [2020]*3)

    def test_one_line_shift_and_identity(self):
        original = b'1\n00:00:10,000 --> 00:00:11,000 X1:50\nHi'
        self.select(original)
        self.assertEqual(self.download().read_bytes(), original)
        self.page.get_by_label('First spoken time').fill('00:00:09.000')
        self.assertEqual(self.download().read_bytes(), b'1\n00:00:09,000 --> 00:00:10,000 X1:50\nHi')

    def test_invalid_anchors_and_recovery(self):
        self.select(subtitles(ORIGINAL))
        self.page.get_by_label('Later subtitle line').select_option('0')
        self.save.click()
        self.status.filter(has_text='in increasing order').wait_for()
        self.page.get_by_label('Timing correction').select_option('one')
        self.page.get_by_label('First subtitle line').select_option('1')
        self.page.get_by_label('First spoken time').fill('00:00:01.000')
        self.save.click()
        self.status.filter(has_text='outside the time range').wait_for()
        self.page.get_by_label('First spoken time').fill('00:05:10.000')
        self.assertEqual(self.download().read_bytes(), subtitles(ORIGINAL))

    def test_invalid_files_clear_form(self):
        self.select(subtitles(ORIGINAL))
        self.save.wait_for()
        for data, message in [(b'\xff', 'UTF-8'), (b'nothing', 'numbered SRT'),
                              (b'1\n00:00:02,000 --> 00:00:01,000\nHi', 'end after'),
                              (b'1\n00:00:01,000 --> 00:00:02,000\nx\n2\n00:00:03,000 --> 00:00:04,000\ny','blank line'),
                              (b'x'*(4*1024*1024+1), '4 MiB')]:
            self.select(data)
            self.status.filter(has_text=message).wait_for()
            self.assertFalse(self.save.is_visible())


if __name__ == '__main__':
    unittest.main()
