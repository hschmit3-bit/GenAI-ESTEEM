# BallHawk: AI-Use Disclosure (Draft)

This builds on the AI-use record from Problem Framing (October 1, 2026). No credentials or private information are included.

## Tools used

| Tool | Where | Used for |
|---|---|---|
| **Claude (Anthropic)**, claude.ai | Problem Framing, First Working Slice, Prototype Revision | Brainstorming names, researching competitors, proofreading, drafting the Replit build prompt and READMEs. In this revision: code changes, browser testing and drafting documentation. |
| **Replit Agent** | First Working Slice | Building the first version of the app (React + Vite) from my build prompt, and hosting it. |

No other AI tools were used.

## How AI helped with development

- **Code:** Replit Agent wrote the first version of the interface. In this revision, Claude worked from my repository and the peer review PDF. It found why the review counts disagreed and wrote the fixes in `App.tsx`, `index.css` and `sampleData.json`. I approved each major change before it was pushed to GitHub.
- **Debugging:** Claude traced the 8-vs-5 mismatch to three causes: a hard-coded banner, the Confidence column being counted as a field, and a "mixed" confidence value that the code couldn't read as a number. It also found that the "Choose a clip" message was never displayed.
- **Testing:** Claude ran the before and after versions in a headless browser, checked the counts, the buttons and the exported CSVs, and took the screenshots in `docs/screenshots/`.
- **Writing:** Claude drafted this file, `revision.md` and the README. I reviewed and edited them.
- **Design decisions** stayed with me: which feedback to act on, keeping the AI simulated, and adding Confirm all.

## Representative prompts

| Prompt (excerpt) | What it produced | What I changed |
|---|---|---|
| **Replit Agent, first build** *(summary; I drafted the prompt with Claude)*: "Build a single-page web app called 'BallHawk', a prototype that auto-tags football film into a breakdown spreadsheet… the flow must work end to end with no dead ends." It set out the three setup steps, the three sample clips, a sheet that fills one play per second, editable cells with yellow highlighting under 70% confidence, a summary bar, CSV export, scripted JSON results with no real AI, error messages for missing or unsupported input, and comments marking where a vision model would replace the JSON. | The first working slice, close to the prompt as written | I set the scope (one screen, no accounts, no database, no Hudl) and wrote the three test cases the samples are built around. The prompt's example banner and summary text, with fixed counts, turned out to be a mistake (see Verification). |
| **Claude, revision:** "You are a software developer working on revisions to my AI tool for a class project. Here is a pdf on the expectations for this next phase… What else do you need from me?" | A gap analysis (no code in the repo, a broken README link) and a list of what was needed | I chose which suggested revisions to build and decided to keep the AI simulated |
| **Claude, revision:** "Add a 'confirm all' checkmark along with other buttons along the top of the interface. Efficiency is key with this project" | A Confirm all toolbar button that skips blank fields and marks bulk confirmations in the CSV | This was my change to Claude's design (see below) |

## Human judgment: an AI suggestion I changed

Claude suggested a **✓ button on each yellow cell** so a coach could confirm one correct AI guess at a time. I changed this by adding **Confirm all** to the toolbar. Coaches break down dozens of plays per game, and BallHawk is only worth using if it saves time. Confirming cells one by one brings back the tedium the product is meant to remove. Claude pointed out that this weakens the export-check safeguard, so we kept two limits: Confirm all doesn't fill in blank fields, and the CSV labels bulk-confirmed values separately. I accepted the remaining risk as a trade-off and documented it in [revision.md](revision.md#5-risk-response).

Earlier decisions were also mine: keeping the AI simulated for this milestone, and scoping the first version to exclude Hudl integration, mobile, other sports and predictive analytics.

## Verification

- **Checked:** for each change, I ran the app in Replit's preview and walked through Sample A and Sample B. Claude ran a type check, a production build and automated browser tests of the before and after versions, including all five test cases in `revision.md`. I looked at the screenshots and exported CSVs.
- **What I learned about checking AI work:** the build prompt contained example text with fixed numbers: the banner "5 of 15 fields need review" and a summary bar of "13 high confidence · 2 need review." Replit Agent copied the banner text word for word, so it never matched the count the app actually calculated. Neither AI caught this. My peer reviewers did. I now treat numbers in a prompt as examples the code should calculate, and I check every on-screen number against the data behind it.
- **Still needs checking:** no real football film has gone through BallHawk, the confidence scores are scripted, and no coach has used the revised version. The test results show the review flow works as designed. They don't show that the AI tags plays correctly.

## AI inside the product

| Item | Details |
|---|---|
| **Task** | Watch each play and fill in Down & Distance, Formation/Defensive Front, Play Type and Result, with a confidence score per field |
| **Inputs** | A game or practice clip, plus offense/defense and camera angle |
| **Outputs** | One row per play, with fields under 70% confidence or left blank flagged for the coach to review |
| **Current status** | **Simulated (Wizard of Oz).** Results come from `artifacts/ballhawk/src/sampleData.json`, not a model. The review flow, export check and CSV export are real, working code. **Planned:** a vision model on one frame per play, starting with Formation. |
