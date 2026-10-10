# KS2 Lesson Engine

Made with ♥ by Rabinder Kaur, Head of Key Stage 2.

Ten engines and a slide studio that turn one topic into a two-way online lesson for Years 3 to 6. Each one makes a **class screen to share** on Teams, Zoom or Meet, plus **teacher notes** to keep. Every engine ships with a finished example, so it can be used before anything is generated.

**Live site:** https://greenengine6.github.io/ks2-lesson-studio/

## The engines

| Engine | What pupils do |
|---|---|
| **Slide Studio** | The original lesson builder: about 12 two-way slides, answers, lesson plan, Adapt, unit planning, PowerPoint download. |
| **Maths Reasoning** | “Which one doesn’t belong?” (every answer can be right), then an Open Middle puzzle the class tries live. The board checks answers and finds the best one by trying every option. |
| **Story Spark** | A mystery scene with moving weather, revealed line by line; see/think/wonder, a word bank, a model paragraph with its features highlighted, the writing task. |
| **Reading Ladder** | One text at three reading levels (same facts, same key words), tap-to-define words, VIPERS questions with answers to reveal. |
| **Science Mystery** | A puzzling case file, notice and wonder, a live class vote on predictions, a safe home investigation, the big reveal and myth-busting. |
| **Sound Journey** | Eyes closed: the screen reads a journey over live rain, forest, river or city sounds; then guess the place, fact file, here vs there, say hello in the local language. |
| **Unplugged Code** | A robot grid the class programs with F, L, R (and repeats); a buggy algorithm to debug; an unplugged game for home. The grid is checked to be solvable. |
| **Step-by-Step** | Any task broken into small timed steps with Now / Next / Then, a tick-off checklist and a word bank with home-language words (SEND and EAL). |
| **Escape Room** | A story mission where each lock is a card: a correct code drops it away and brings the next lock forward. Timer, hints and a finale. |
| **Brain Break** | A timed calm-down or wake-up script led by Lumi, who grows on breathe-in and shrinks on breathe-out, with read-aloud and nature sounds. |
| **Big Debate** | Paste a news story: a balanced debate or assembly with before-and-after live votes, arguments on both sides and oracy stems. |

**Present mode** (every engine): full screen, Magic pointer (ribbons follow the mouse so pupils on a call can see where you point; key P), timer (T), teacher notes (N), arrow keys between screens.

**Online / In class** (top right) switches every “how to respond” prompt between chat-based and classroom wording.

## Setup (once per device)

1. Sign in at **console.anthropic.com**, add credit and set a monthly spend limit under **Limits**.
2. Create a key under **API keys**.
3. Open the site, press **Connect** (top right, or the key at the end of the dock), paste the key and press **Save and test**.

**Set up someone else’s device without telling them the key:** on a connected device, open **Connect → Copy a one-tap setup link** and send it privately. Opening the link once saves the key in that browser and removes it from the address bar. Anyone who has the link can use the key, so delete the message afterwards. To cut off every device, delete the key in the Anthropic Console.

## Privacy

- The key and all saved activities stay **in that browser only** (local storage). The page’s security policy only allows requests to `api.anthropic.com` and Google Fonts.
- The site is hidden from search engines and does nothing without a key.
- The engines ask for topics, not pupils. Don’t type pupils’ names or personal details into the boxes.

## Updating

- Models are set in the small `config` block in `index.html` (`mainModel`, `quickModel`).
- Each engine is one file in `assets/js/engines/` with its fields, prompt, example, class screens and teacher notes.
- Push to `main`; GitHub Pages republishes in about a minute.

## Optional: private link on Vercel

`api/claude.js` lets the site run on Vercel with the key kept on the server (`ANTHROPIC_API_KEY`) and teachers joining with `https://<vercel-address>/#join=<ACCESS_CODE>`. Not needed for GitHub Pages.

## Files

```
index.html               page shell, Connect dialog, Present overlays
assets/css/              app.css (neumorphic design system), board.css (class screens), slides.css
assets/js/app.js         routing, header, dock, landing page
assets/js/core.js        Claude connection (streaming), storage, copying
assets/js/slides.js      Slide Studio
assets/js/engines/       the ten engines + shared framework
assets/js/fx/            Tubes, Lumi, Waves, Ribbons, CardSwap, Dock, sounds, particles
```

## Credits

- Visual effects are vanilla re-implementations (no libraries) inspired by: Tubes cursor (Kevin Levron, threejs-components), CardSwap and Ribbons (React Bits), MagnificationDock, Interactive Waves.
- PowerPoint export: [PptxGenJS](https://github.com/gitbrent/PptxGenJS) 4.0.1, MIT licence (`assets/PPTXGENJS-LICENSE.txt`).
- Slide fonts: TeX Gyre Adventor and Schola, GUST Font Licence (`assets/fonts/TEX-GYRE-LICENSE.txt`). Interface fonts: Plus Jakarta Sans and DM Sans from Google Fonts.
