# KS2 Lesson Studio

Two-way lesson slides for Key Stage 2 teachers. Made for Rabinder.

**Live site:** https://greenengine6.github.io/ks2-lesson-studio/

## What it does

- **Make a lesson:** choose the year group and subject, type a topic, and get about 12 slides with answers, teacher notes and a lesson plan.
- **Two-way teaching:** starter, vote (A to D), talk time, "show me", three-level challenge and exit ticket. One switch sets every response prompt for **online** or **in-class** teaching.
- **Present:** full screen, answers hidden until you tap, countdown timer, private teacher notes.
- **PowerPoint:** one click downloads an editable `.pptx` with an answer slide after each question slide and your notes in the speaker notes.
- **Adapt:** make the lesson easier, harder, 30 minutes long, or more interactive.
- **Plan a unit:** a sequence of lessons, each one turned into slides with one tap.
- **Copy quiz / Copy plan:** formatted text to paste into email, Word or a quiz app.

## First-time setup (once per device)

1. Sign in at **console.anthropic.com** and add credit.
2. Under **Limits**, set a monthly spend limit.
3. Under **API keys**, create a key named after the device (for example `Rabinder laptop`).
4. Open the site, paste the key into **Connect Claude**, and press **Save and test**.

## Private link (no key for the teacher) — Vercel

When the site runs on Vercel, the API key stays on the server and teachers connect by tapping a private link.

1. In Vercel, open the project, then **Settings → Environment Variables**, and add:
   - `ANTHROPIC_API_KEY`: the key from the Anthropic Console
   - `ACCESS_CODE`: a long random code (the "house key" inside the link)
2. Redeploy (Deployments → ⋯ → Redeploy).
3. Send the link `https://<your-vercel-address>/#join=<ACCESS_CODE>`. Tapping it once connects that device; the code is removed from the address bar.
4. To cut off every old link, change `ACCESS_CODE` in Vercel, redeploy, and send the new link.

`api/claude.js` only accepts the two models the site uses, caps the length of each answer, and never returns the key.

## Privacy

- The API key is stored **only in that browser** (local storage). It is sent only to `api.anthropic.com`; the page's security policy blocks every other destination.
- Lessons are saved **only in that browser**. The PowerPoint download is the copy to keep.
- The repository is private. The site address works for anyone who has it, is hidden from search engines, and does nothing without a key.
- To revoke access, delete the key in the Anthropic Console.

## Updating

- Edit `index.html` and push to `main`. GitHub Pages republishes in about a minute.
- The Claude models are set in `CONFIG` near the top of the script in `index.html` (`lessonModel`, `quickModel`).

## Credits

PowerPoint export uses [PptxGenJS](https://github.com/gitbrent/PptxGenJS) 4.0.1 (MIT licence, see `assets/PPTXGENJS-LICENSE.txt`).
