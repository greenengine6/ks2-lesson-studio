# KS2 Lesson Engine

Made with ♥ by Rabinder Kaur, Head of Key Stage 2.

Ten lesson engines, a slide studio and a play area that turn one topic into a two-way online lesson for Years 3 to 6. The landing page opens on a real-time 3D Earth, lit by the Sun where it really is right now. Each engine makes a **class screen to share** on Teams, Zoom or Meet, plus **teacher notes** to keep. Every engine ships with a finished example, so it can be used before anything is generated.

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
| **lkie.like** | One topic in, a whole lesson out, for every KS2 subject including Bahasa Melayu and Mandarin. A 3-step wizard (year and subject, topic with a curriculum match, length) makes a pack: 10 to 15 slides (recap, hook, key words, concept, worked example, check point, three-level task, talk, plenary, exit ticket) with exact diagrams drawn from the numbers (number lines, fraction bars, place value, timelines, cycles, bar charts, tables, word cards), picture and video ideas, key words, activities, teacher notes, a 2-minute spoken briefing, and a worksheet in three tiers (Scaffolded 6, Standard 8, Stretch 8) with nine question types that pupils can try on screen. Tap a slide and say what to change (“Make this simpler”, “Add a football analogy”); Undo is always there. A unit planner sequences up to 25 lessons with recaps and assessments, checks the plan, and steers recaps to lessons where the class mood was low. Packs open instantly from this device the second time. PowerPoint (with the diagrams and notes) and an editable Word worksheet. Calm slide style for readers who find colour busy. |
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
| **Symphony** | The helper. She is a girl who speaks English and Malay and was named for her musical voice. Click her, or tap **Ask Symphony**, to ask anything by text. Tap the **mic** for voice mode: everything else disappears, a glow along the bottom follows your voice while she listens, sweeps while she thinks and follows her words while she speaks, and her answer appears word by word. She then listens again. Every voice on the site is hers: Brain Break, Sound Journey and Wonder Window read in the same girl's voice. |
| **The Earth** | The landing page background: day colour, night lights, relief, sunlight glinting off the oceans, drifting clouds and a glowing atmosphere, lit for this exact moment. Drag to spin it on a laptop; tilt the phone to look around (iPhones ask once). Space sound pans around you as it turns. |

**Present mode** (every engine and Slide Studio) gives you:
- full screen;
- **Magic pointer** (P), timer (T) and teacher notes (N);
- **Class feedback** (C): five faces, keys 1–5 to count, and "best bit".

**Switches** (header, menu and the lit cards on the home page):
- Sound (the small speaker in the header): the little sounds and the space sound. Everything drops to a whisper while Symphony speaks;
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
  - low ratings;
  - hitting the engine limits (see the engine guard).

From the dashboard, Rabinder can:
- **Download report:** a print-ready HTML report with a briefing, actions for the week, tables and charts. Open it, then *Print or save as PDF*.
- **CSV:** download the raw data for Excel.
- **Symphony’s analysis:** a written analysis that is added to the next report.
- **Ask Symphony:** she gives a prepared briefing, answers questions about the data by voice or text, and points to *Download report* for the full detail.
- **Teachers and PINs:** enrol a teacher, copy their personal link, give a new PIN, or remove them.
- **From your teachers:** teachers’ activity arrives by itself. Each teacher’s device locks it (ECDH P-256 + AES-GCM, sealed to this dashboard’s key) and sends it to the inbox every few minutes, when a lesson is made or presented, when feedback is saved, and when the page is closed. The dashboard fetches and opens it, and **Check now** fetches straight away. Offline devices keep it and send it later.

Only Rabinder downloads reports (the report and the CSV). Teachers only download what they made: the PowerPoint of their own slides and lkie.like's Word worksheet.

The activity log lives in each browser (IndexedDB) until it is sent. It never records pupils’ names or what anyone asks Symphony.

## The engine guard (every button that uses the engine)

Every press of a button that uses the engine is paid for, so one set of rules covers them all (`assets/js/guard.js`): Slide Studio, Plan the unit, the ten engines, lkie.like, Symphony and the dashboard analysis.

- **Real presses only.** Nothing is pressed by a script, by a tap still travelling when a page opens (presses in the first 1.2 seconds are ignored, timed by when the finger actually touched), by a swipe or fling that ends on a button, or by the Enter key in a text box (Enter moves to the next box).
- **Rest.** After a Make button makes something, that button rests for 5 minutes and shows a clock, the time left and a filling bar. A press that ends without a result gives the time back (the engine failed, or Stop was pressed in the first 15 seconds).
- **Caps.** Everything one person makes on a device, together: 15 an hour and 40 a day. The button says when it is ready again; it shows how many are left when 5 or fewer remain.
- **Small edits** (lkie.like's slide editor and worksheet rewrite): one every 8 seconds, 40 an hour.
- **Symphony:** one question every 3 seconds, a short break after 20 in 10 minutes, and 150 a day. Her own replies (hello, who she is, the site) are free.
- **One thing at a time.** While something is being made, in this tab or another, the other Make buttons wait.
- **Rabinder sees it.** Reaching a cap is noted in the activity log, and her dashboard lists who keeps hitting the limits.

The numbers are in `index.html` (`"limits"` in the config). These rules live on each device; the hard ceiling is the monthly spend limit on the key itself (console.anthropic.com, Limits).

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
assets/js/fx/earth.js    the landing Earth (three.js, real Sun position, tilt and drag, space sound)
assets/js/fx/beam.js     Symphony's voice glow
assets/js/fx/audio.js    the one sound engine: effects, sound switch, quiet while Symphony speaks
assets/earth/            Earth textures, 2K for phones and 4K for laptops
assets/vendor/           three.js
assets/js/security.js    protection deterrents
assets/js/guard.js       the engine guard: real presses only, rests, caps, one at a time
assets/js/lkie/          lkie.like: curriculum map and matcher, prompts, data checks, drawing, exports, example, page
assets/css/lkie.css      lkie.like styles
assets/js/crypto.js, idb.js, settings.js, theme.js, slides.js, engines/, fx/
```

## Credits

- The Earth: [three.js](https://threejs.org) r185, MIT licence (`assets/vendor/three-r185/LICENSE.txt`). Earth textures by [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0), based on NASA imagery, as resized and packed by three.js. Shading after the three.js Earth example (Three.js Journey).
- Voice glow: written for this site, after the idea of Libraries.dev's Voice (voice-glow).
- Other visual effects are vanilla re-implementations (no libraries), inspired by CardSwap and Ribbons (React Bits), MagnificationDock and Interactive Waves.
- PowerPoint export: [PptxGenJS](https://github.com/gitbrent/PptxGenJS) 4.0.1, MIT licence (`assets/PPTXGENJS-LICENSE.txt`).
- lkie.like curriculum map: statutory statements from the National Curriculum in England (2014) and the Relationships and Health Education guidance, lightly shortened (Crown copyright, Open Government Licence v3.0); RE after the RE Council's national framework (2013); Bahasa Melayu after the KSSR skill areas (Malaysia), paraphrased. The objective codes are this site's own.
- Slide fonts: TeX Gyre Adventor and Schola, GUST Font Licence. Interface fonts: Plus Jakarta Sans, DM Sans and JetBrains Mono from Google Fonts.
