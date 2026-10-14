BallHawk

BallHawk is an AI film-breakdown assistant that watches football clips and fills in the play-by-play analytics sheet, so coaches review data instead of typing it.

What the first working slice does

The prototype is a single screen. The user:

Chooses whether they are breaking down Offense or Defense.
Picks the camera angle: Sideline, End zone, or Unknown.
Uploads a clip (.mp4, .mov, .webm) or picks a built-in sample clip.
Clicks Tag Plays.

BallHawk then fills in a breakdown sheet one play at a time. The columns are Down & Distance, Formation, Play Type, Result, and Confidence. Low-confidence or blank cells are highlighted yellow for review. Every cell can be edited, and the finished sheet exports to CSV. A "Tag another clip" button takes the user back to the start, so the flow has no dead end.

Opening the prototype
Live prototype (Replit): (https://ball-hawk-film-breakdown.replit.app/)
To run it yourself: fork this repository into Replit and click Run. No setup or API keys are needed.
Quick demo: select Offense and Sideline, choose Sample A, and click Tag Plays.
AI behavior: simulated (Wizard of Oz)

The video analysis in this prototype is simulated. No model watches the film. Each sample clip returns pre-scripted results from a JSON file. An uploaded video with a valid file type shows the same demo results and is labeled "Demo results — live video analysis not yet connected."

The following parts are fully working:

the input flow
validation
the play-by-play fill-in
confidence highlighting
cell editing
CSV export
Test results
Test	Input or action	What happened	Pass, partial, or fail
Typical case	Offense, Sideline, Sample A (clear day-game film, 3 plays)	The sheet filled in one play at a time. All 15 fields were completed at 85–97% confidence with no review flags, and the CSV exported correctly.	Pass
Challenge case	Defense, End zone, Sample B (rain, similar jersey colors, 3 plays)	A low-visibility warning appeared. Five fields were highlighted yellow or left blank as "needs review." Edited cells turned green and carried into the CSV. The defensive column header and values switched correctly.	Partial: the flagging communicates the idea, but the uncertainty is scripted, not detected from the video
Invalid or empty case	(a) Clicked Tag Plays with nothing selected; (b) uploaded a .pdf; (c) Sample C (corrupted file)	(a) Inline red messages named each missing step, and the other inputs were kept. (b, c) A "couldn't read this clip" message listed the supported formats and offered a one-click "Try a sample clip" fix.	Pass
Known limitations
Video analysis is simulated. The tagging results are scripted, so this slice does not yet test the core accuracy question: whether AI can hit about 90% per field on real film. The next step is to send one frame per play to a vision model to classify the formation.
Confidence scores are not real. The yellow review highlights come from the scripted data, not from model uncertainty. Real confidence values will need calibration against hand-tagged plays.
No saved data or Hudl workflow. Breakdowns are lost on refresh unless exported to CSV. The tool also runs on uploaded clips rather than beside Hudl. Hudl integration and accounts are intentionally out of scope for this slice.
Notes
No passwords, API keys, or secrets are stored in this repository.
Sample results are fictional. No real game film is stored here.
AI use: Claude (Anthropic) helped draft the Replit build prompt and this README. I made the final decisions and checked the results.
