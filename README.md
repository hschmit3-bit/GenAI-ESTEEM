# BallHawk

**BallHawk is an AI film-breakdown assistant that watches football clips and fills in the play-by-play breakdown sheet, so coaches review data instead of typing it.**

**Intended user:** an assistant coach or graduate assistant at a mid-sized college or large high school football program. They break down game and practice film by hand, typing down and distance, formation, play type and result for every play. That takes hours per game and leaves less time for deeper analysis.

## Quick links

| | |
|---|---|
| **Live prototype (Replit)** | [ball-hawk-film-breakdown.replit.app](https://ball-hawk-film-breakdown.replit.app/) |
| **Demo video (Google Drive)** | See [Demo Video](#demo-video) |
| **Revision documentation:** improvements, peer feedback, tests, before-and-after, risk response | [revision.md](revision.md) |
| **AI-use disclosure (draft)** | [ai-use-disclosure.md](ai-use-disclosure.md) |
| **Prototype code** | [`artifacts/ballhawk/src/`](artifacts/ballhawk/src/) |
| **Screenshots used as evidence** | [`docs/screenshots/`](docs/screenshots/) |

## Opening the prototype

- **Live:** open the link above. No login or setup is needed, and it works in any desktop browser.
- **Quick demo (about 1 minute):** choose **Defense**, set the angle to **End zone**, pick **Sample B**, and click **Tag Plays**. Four yellow cells need review. Type in the two blank ones, press **✓** (or **✓ Confirm all**) for the others, then click **Export CSV**.
- **Run it yourself:** import this repository into Replit and click **Run**. No API keys are needed.

## What the prototype does

1. Choose **Offense** or **Defense**, a **camera angle**, and a **clip**: upload an .mp4/.mov/.webm or pick a sample.
2. Click **Tag Plays**. BallHawk fills in the breakdown sheet one play at a time: Down & Distance, Formation (or Defensive Front), Play Type, Result and a Confidence score.
3. Fields under 70% confidence, or left blank, turn **yellow**. One count, shown in the summary, the banner and the **Review fields (N)** button, tracks how many are left.
4. Fix a wrong field by typing in it, or confirm a correct one with **✓**. **✓ Confirm all** confirms every flagged field that has a value. Blank fields still need typing.
5. **Export CSV.** If fields are still unreviewed, BallHawk warns you first. The CSV's **Review status** column marks any unchecked or bulk-confirmed AI guesses.
6. **Tag another clip** starts over.

## What's working, simulated and planned

| Part | Status |
|---|---|
| Input flow, validation, error messages | **Working** |
| Filling the sheet play by play, editing, ✓ / Confirm all, review count, export check, CSV export | **Working** |
| Video analysis (reading the film) | **Simulated (Wizard of Oz).** Results come from [`sampleData.json`](artifacts/ballhawk/src/sampleData.json). Uploaded clips show demo results labeled "live video analysis not yet connected." |
| Confidence scores | **Simulated.** Written into the sample data. |
| Vision-model tagging (starting with Formation), accuracy testing against hand-tagged plays | **Planned** |
| Hudl integration, accounts, saved breakdowns | **Out of scope** |

## Changes in this revision

Based on peer review and re-testing (full details in [revision.md](revision.md)):

- **One consistent review count.** Fixes the 8-vs-5 mismatch both reviewers reported.
- **Marking fields as reviewed.** Edit, ✓, or ✓ Confirm all. Fixes the stuck "edited REVIEW" tag.
- **Export check and a CSV Review status column.** The safeguard against exporting unchecked AI guesses.

## Code map

| File | What it does |
|---|---|
| [`artifacts/ballhawk/src/App.tsx`](artifacts/ballhawk/src/App.tsx) | The whole interface: inputs, scripted tagging, review rule (`needsReview`), confirm actions, export check, CSV |
| [`artifacts/ballhawk/src/sampleData.json`](artifacts/ballhawk/src/sampleData.json) | Scripted results for Sample A (clear film), Sample B (rain, end zone) and Sample C (corrupted file) |
| [`artifacts/ballhawk/src/index.css`](artifacts/ballhawk/src/index.css) | Styles |
| `artifacts/api-server`, `lib/`, `artifacts/mockup-sandbox` | Replit's default workspace scaffolding, not used by the prototype |

## Demo Video

**[Demo video — Google Drive link coming soon]**

Viewing access is granted to Emelia Hughes and Samuel Huang. The same file is uploaded to Canvas.

## Notes

- No passwords, API keys or secrets are stored in this repository.
- All sample results are fictional. No real game film is stored here, and uploaded clips never leave the browser.
- AI use: Claude (Anthropic) and Replit Agent. See [ai-use-disclosure.md](ai-use-disclosure.md).
