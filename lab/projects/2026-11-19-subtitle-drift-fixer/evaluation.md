# Can people correct subtitle drift without copying timecodes?

## Decision

Ship optional local playback, one-click capture of a spoken time, and a corrected-caption preview in the same offline HTML file. The audience is someone who already has an SRT and can identify two matching lines of dialogue. Version 1 needed two timestamps transcribed from another player, then a separate export and reload to check a third line. Version 2 removes both manual transcriptions and lets the user check that third line before export.

## Market evidence, November 19, 2026

These counts are public GitHub release-asset downloads observed on the same day. Each row covers one tagged release. The files, audiences and time since release differ. Repeat downloads are included, and distribution through other channels is unmeasured.

| Product and release | Observed downloads | How it addresses the task |
| --- | ---: | --- |
| Subtitle Edit 5.4.0, released Nov 6, 2026 | 120,186 across eight desktop app assets, including 72,225 for the Windows x64 setup executable. Six separate SeConv CLI assets excluded. | Its visual sync editor combines a video player, audio visualization and two subtitle matches. Its broader editing, translation and transcription features reach an audience beyond drift correction. [Release data](https://api.github.com/repos/SubtitleEdit/subtitleedit/releases/tags/v5.4.0) · [Visual sync documentation](https://github.com/SubtitleEdit/subtitleedit/blob/main/docs/features/visual-sync.md) |
| SubSync 0.17, released Nov 11, 2021 | 103,488 across all three binaries, including 49,362 for the Windows installer, 41,383 for the portable executable and 12,743 for macOS. | It derives matches from speech. Its documentation describes limits when different sections need different delays. The archived project has had about five years to accumulate these downloads. [Release data](https://api.github.com/repos/sc0ty/subsync/releases/tags/0.17) · [Project FAQ](https://github.com/sc0ty/subsync/wiki/FAQ) |
| Subtitle Drift Fixer v1, released Nov 19, 2026 | 0 at the initial research check, only minutes after publication. | A single offline HTML file accepts manually supplied times. The short exposure cannot establish demand or a baseline conversion rate. [Release data](https://api.github.com/repos/Blueskyapple/Blueskyapple/releases/tags/lab-2026-11-19-subtitle-drift-fixer) |

A viewer described gradually increasing desynchronization after adjusting the playback delay. Another discussion identified both playback-rate differences and cuts between editions as causes. The first is a fit for two-point correction. The second may require several independent adjustments. Download counts establish interest in the broader category. They do not identify the prevalence of either case. [Viewer discussion](https://superuser.com/questions/95760/how-can-i-re-sync-the-subtitle-and-the-video-using-vlc-media-player) · [Discussion of different cuts](https://superuser.com/questions/438221/how-to-check-if-a-given-subtitle-file-is-the-right-one)

## Alternatives considered

| Change | Benefit | Decision |
| --- | --- | --- |
| Capture two times locally and preview a middle cue | Removes switching and transcription from a known workflow. A middle cue also helps the user spot an imperfect fit. | Shipped. Optional local media preserves the direct time-entry workflow and single-file distribution. |
| Automatic speech alignment | Could remove the need to find matching lines. | Defer until users report that locating the lines is their main difficulty. Models, languages and accuracy testing would substantially change this small offline tool. |
| Independent corrections for different scenes | Could fix abrupt jumps between cuts. | Defer until a real example shows where two-point alignment fails. The current preview lets a user detect that case before export. |
| Improve release discovery | Clearer release notes can help a relevant user recognize the task. | The catalog links to the new asset. This also changes its exposure, which limits comparisons with the original asset. |

## What the test establishes

Six offline Chromium tests passed. One test generates a nine-second WebM, seeks to 2 and 7 seconds, and captures both times using the visible buttons. The cue originally at 3 seconds appears at 4.5 seconds. The browser activates the expected multiline caption and the exported cue spans 4.500–5.750 seconds. An unreadable video exercises the manual fallback. The existing ffprobe test continues to check corrected timings independently. These are controlled checks with known matches. Real listeners still have to identify the spoken instant.

## Prospective download checks

Record the v1 and v2 GitHub asset IDs, cumulative counts, observation times, and the other three lab assets at cutover. Collect daily counts for 30 days. Report cumulative and incremental downloads around day 1, day 7 and day 30, alongside changes for the original asset and the three pre-existing sibling tools. Use actual elapsed time and disclose missed checks or replacements. The daily CSV identifies each version and asset. Historical CSVs without a version column contain v1 observations.

The primary outcome is new downloads of v2 since cutover. A secondary outcome is the change in combined v1 and v2 downloads. The old link stays public, while the catalog directs new readers to v2. A download can include a repeat, and the lab has no exposure denominator. The comparison is observational. It cannot establish whether the change caused growth or whether a downloader successfully synchronized a track.

At day 30, sustained new downloads across both the first week and the remaining period will support continued distribution. If downloads stall, look for evidence of discovery problems before expanding the editor. For direct evidence of user value, look for project-specific reports of a successful middle-cue check or a concrete failure. Record the absence of feedback as unknown.
