# Subtitle Drift Fixer

Fix a constant delay or gradual timing drift in a UTF-8 SRT subtitle track. The download is one HTML file that runs offline in a browser. Use the built-in local player or enter times from your usual player.

1. Open `subtitle-drift-fixer.html` and choose your SRT.
2. Pick an early subtitle line. Open a local video, pause on the first spoken word, and click **Use player time for first line**. You can also type a time.
3. For gradual drift, repeat with a line near the end. For a uniform delay, select **Constant delay** and use a single match.
4. Select **Preview corrected captions** and play a line midway through the local video. Adjust a match if needed, then select **Save corrected SRT**. Playback supports the media formats your browser can decode.

## Example

In a ten-minute talk, the first caption starts at 10 seconds but the speaker starts at 11. A later caption starts at 10 minutes 10 seconds but its speech starts at 10 minutes 17 seconds. Enter those two spoken times. A cue originally at 5 minutes 10 seconds now starts at 5 minutes 14 seconds. Using only the initial one-second shift would leave the later lines progressively early.

## Fit and limits

Two matches determine a linear mapping for cue starts and ends, rounded to milliseconds. A one-line shift keeps cue durations. Dialogue, line breaks, UTF-8 byte-order marks and trailing cue settings are preserved. The supported input is a numbered SRT with comma-millisecond timestamps, up to 4 MiB and 5,000 cues. A correction producing negative times, collapsed cues or times past 99 hours is rejected. A video with removed scenes or abrupt timing jumps may require separate adjustments for each section.

## Why this project

Multiple viewers report subtitles that gradually slip out of sync after adjusting the delay. Subtitle Edit documents a two-point correction and provides a full editor with video preview. This release tests whether people who already know the two spoken times want a smaller offline tool. Its download count measures distribution. Feedback about whether the middle of a track stays aligned would help assess the result. [Viewer discussion](https://superuser.com/questions/95760/how-can-i-re-sync-the-subtitle-and-the-video-using-vlc-media-player) · [Additional drift report](https://superuser.com/questions/438221/how-to-check-if-a-given-subtitle-file-is-the-right-one) · [Subtitle Edit visual sync](https://github.com/SubtitleEdit/subtitleedit/blob/main/docs/features/visual-sync.md)

## Verification

Six offline Chromium tests passed. In the media workflow, a generated WebM clip provided both timing matches. Chromium displayed the corrected multiline midpoint caption, the downloaded SRT contained its expected interval, and an unsupported media file left manual export available. The saved file matched expected bytes for multilingual, multiline captions, and FFmpeg's ffprobe read the expected start and duration for all three corrected cues. Tests also covered a one-line delay, an unchanged round trip, invalid anchors, invalid files, the size limit and recovery. The test used known timings. Timing accuracy on a particular recording depends on the spoken times entered.

Run `python test_browser.py` with Python, Playwright, Chromium, ffmpeg and ffprobe installed.
