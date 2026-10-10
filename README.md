# KS2 Lesson Engine

Made with ♥ by Rabinder Kaur, Head of Key Stage 2.

Ten lesson engines, a slide studio and a play area that turn one topic into a two-way online lesson for Years 3 to 6. Each engine makes a **class screen to share** on Teams, Zoom or Meet, plus **teacher notes** to keep. Every engine ships with a finished example, so it can be used before anything is generated.

**Live site:** https://greenengine6.github.io/ks2-lesson-studio/

## Who signs in

| Who | How |
|---|---|
| **Teachers** | The landing page asks *Who’s teaching today?*: their name and the PIN Rabinder gave them. They open their **personal link** once on their own device. On a shared classroom laptop, Rabinder’s **classroom link** sets up every enrolled teacher at once. |
| **Rabinder (admin)** | The only login: **Hello Admin**, with *Rabinder Kaur* pre-filled. She uses her password on a new device, then sets up a **passkey** (Face ID, fingerprint or the screen lock) on her laptop and phone. |
| **Pupils** | Never sign in. They answer the class feedback faces on the shared screen, and no names are stored. |

PINs are stored only as salted PBKDF2 checks. Five wrong tries lock that name for a while.

## What is inside

| Part | What it does |
|---|---|
| **Slide Studio** | About 12 two-way slides with answers, a lesson plan, Adapt, unit planning and a PowerPoint download. |
| **Maths Reasoning** | “Which one doesn’t belong?” then an Open Middle puzzle the class tries live. The board checks every answer. |
| **Story Spark** | A mystery scene revealed line by line, with see/think/wonder, a word bank and a model paragraph. |
| **Reading Ladder** | One text at three reading levels, tap-to-define words, and VIPERS questions. |
| **Science Mystery** | A case file, a live class vote, a safe home investigation and the big reveal. |
| **Sound Journey** | A journey read over live nature or city sounds, then guess the place. |
| **Unplugged Code** | A robot grid the class programs (checked to be solvable), plus a bug to fix. |
| **Step-by-Step** | Any task in small timed steps for SEND and EAL. |
| **Escape Room** | Code locks that drop away when cracked, with a timer and hints. |
| **Brain Break** | A timed calm-down led by Symphony, who breathes with the class. |
| **Big Debate** | A news story becomes a fair debate with before-and-after votes. |
| **Wonder Window** | A full-screen play area for the whole class: starlings dodging a falcon, fireflies that learn to flash together, the planets at their real relative speeds, and the northern lights. Symphony reads the facts, and wonder questions appear for the chat. |
| **Symphony** | The helper. She is a girl who speaks English and Malay and was named for her musical voice. Click her, or tap **Ask Symphony**, to ask anything by text or by voice. On phones she answers out loud, then listens again. Every voice on the site is hers: Brain Break, Sound Journey and Wonder Window read in the same girl's voice. |

**Present mode** (every engine and Slide Studio) gives you:
- full screen;
- **Magic pointer** (P), timer (T) and teacher notes (N);
- **Class feedback** (C): five faces, keys 1–5 to count, and "best bit".

**Switches** (header, menu and the lit cards on the home page):
- Night mode;
- Symphony’s voice;
- Magic pointer;
- Teaching online.

Class screens stay bright in Night mode, because they are what pupils see.

The landing page on a phone opens on the background with the title, credit and description at the bottom; one scroll down shows *Who’s teaching today?* and, at the end, the privacy note. On a laptop it all fits one screen.

On phones, all the site’s text is 25% smaller (never below 9px), so more fits on the screen. Typing boxes stay at 16px so iPhones do not zoom in, and class screens and slides keep their own sizing.

## Rabinder’s dashboard and report

After *Hello Admin*, the dashboard shows:
- **Teaching time:** active minutes only.
- **Activity:** sessions, lessons made and presented, and engines used.
- **Feedback:** class mood, best bits and teacher feedback.
- **Deviations to look at:**
  - no sessions for 7 days;
  - repeated failed lessons;
  - sessions after 9 pm;
  - very short or 3-hour sessions;
  - slow lesson making;
  - a big drop in weekly time;
  - class mood under 3;
  - few feedback screens;
  - low ratings.

From the dashboard, Rabinder can:
- **Download report:** a print-ready HTML report with a briefing, actions for the week, tables and charts. Open it, then *Print or save as PDF*.
- **CSV:** download the raw data for Excel.
- **Symphony’s analysis:** a written analysis that is added to the next report.
- **Ask Symphony:** she gives a prepared briefing, answers questions about the data by voice or text, and points to *Download report* for the full detail.
- **Teachers and PINs:** enrol a teacher, copy their personal link, give a new PIN, or remove them.
- **From your teachers:** teachers’ activity arrives by itself. Each teacher’s device locks it (ECDH P-256 + AES-GCM, sealed to this dashboard’s key) and sends it to the inbox every few minutes, when a lesson is made or presented, when feedback is saved, and when the page is closed. The dashboard fetches and opens it, and **Check now** fetches straight away. Offline devices keep it and send it later.

Only Rabinder downloads anything (the report and the CSV). Teachers never see a download, apart from the PowerPoint of their own slides.

The activity log lives in each browser (IndexedDB) until it is sent. It never records pupils’ names or what anyone asks Symphony.

## Setup

1. **Connect once.** On the first device, press **Connect** and paste the engine key, or open the owner’s one-tap link. The key stays in that browser.
2. **Admin.** Rabinder signs in with her password (handed over privately; it is not stored in this repository). Only a salted PBKDF2 check and an encrypted key are in `index.html`. She then sets up a passkey on each device.
3. **Teachers.** Enrol each one on the dashboard and send them their personal link privately. Tell them their PIN yourself.
4. **Inbox (once).** Teachers’ activity reaches the dashboard through a small Google Apps Script web app (`inbox/Code.gs`). In Apps Script: New project, paste `Code.gs`, then Deploy > New deployment > Web app, *Execute as: Me*, *Who has access: Anyone*. Put the web app address (it ends in `/exec`) in `index.html` as `"inbox"` in the config. The script only ever stores locked data: it cannot read it.

## Privacy and protection

- The site is hidden from search engines. The page’s security policy only allows requests to the engine API, Google Fonts and the Apps Script inbox.
- It blocks right-click, text selection and copying (except the site’s own Copy buttons), dragging, printing, and the save, view-source and developer-tools shortcuts.
- It blanks the page when a screenshot shortcut is pressed, and pauses while developer tools are open.
- These are deterrents. No website can stop a phone camera or someone reading published code.
- Screen sharing on Teams, Zoom and Meet keeps working.

## Files

```
index.html               page shell, config (models, admin check), overlays
assets/css/              app (design system), lumen (night mode, luminous switches), board, slides,
                         chat (Symphony), people (sign-in, dashboard, class feedback), play (Wonder Window)
assets/js/app.js         routing, header, dock, landing page, Connect
assets/js/core.js        engine connection (streaming), storage, copying
assets/js/people.js      landing sign-in, Hello Admin, passkeys, enrolment links
assets/js/track.js       activity log (sessions, lessons, feedback)
assets/js/report.js      metrics, deviations, briefing, report template, CSV
assets/js/admin.js       Rabinder's dashboard
assets/js/feedback.js    teacher feedback, class feedback
assets/js/sync.js        sends teachers' activity (locked) to the inbox; the dashboard fetches and opens it
assets/js/fx/voice.js    Symphony's voice: a girl's voice, one sentence at a time, used by every read-aloud
inbox/Code.gs            the Apps Script inbox (stores locked activity only)
tools/stamp.py           stamps one version on every script and style address; run before each commit
assets/js/chat.js        Symphony chat (voice and text, English and Malay)
assets/js/play.js        Wonder Window scenes
assets/js/security.js    protection deterrents
assets/js/crypto.js, idb.js, settings.js, theme.js, slides.js, engines/, fx/
```

## Credits

- Visual effects are vanilla re-implementations (no libraries), inspired by Tubes cursor (Kevin Levron, threejs-components), CardSwap and Ribbons (React Bits), MagnificationDock and Interactive Waves.
- PowerPoint export: [PptxGenJS](https://github.com/gitbrent/PptxGenJS) 4.0.1, MIT licence (`assets/PPTXGENJS-LICENSE.txt`).
- Slide fonts: TeX Gyre Adventor and Schola, GUST Font Licence. Interface fonts: Plus Jakarta Sans, DM Sans and JetBrains Mono from Google Fonts.
