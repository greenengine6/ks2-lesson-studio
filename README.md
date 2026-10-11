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
| **lkie.like** | One topic in, a whole lesson out, for every KS2 subject including Bahasa Melayu and Mandarin. A 3-step wizard (year and subject, topic with a curriculum match, length) makes a pack: 10 to 15 slides (recap, hook, key words, concept, worked example, check point, three-level task, talk, plenary, exit ticket) with exact diagrams drawn from the numbers (number lines, fraction bars, place value, timelines, cycles, bar charts, tables, word cards), real pictures from Wikipedia on up to 5 slides, key words, activities, teacher notes, a 2-minute spoken briefing, and a worksheet in three tiers (Scaffolded 6, Standard 8, Stretch 8) with nine question types that pupils can try on screen. Tap a slide to change it six ways: in plain English (“Make this simpler”, “Add a football analogy”), by editing the words, with a picture, with a YouTube video, with a background, or with a bigger or smaller text size; Undo is always there. A unit planner sequences up to 25 lessons with recaps and assessments, checks the plan, and steers recaps to lessons where the class mood was low. Packs open instantly from this device the second time. PowerPoint (with the diagrams, pictures, backgrounds and notes) and an editable Word worksheet. Ten backgrounds, including Calm for readers who find colour busy. |
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
| **Wonder Window** | A full-screen play area for the whole class with 17 windows, all live scenes with sound: a world map with 24 cities (a plane flies there, then their food, greeting and the time there now), 16 festivals drawn live with their own music, the Seven Wonders and Wonders of Malaysia (English and Bahasa Melayu) as full-screen photographs, extreme weather, the seasons, six habitats from Malaysia's rainforest to the poles, animal record breakers with a speed race, the planets, the northern lights, starlings and fireflies. Symphony reads the facts; every window has a quiz and a class vote. More below. |
| **Symphony** | The helper. Say **“Hey Symphony”** and she answers in a small bubble, even over your slides; she waits for a real pause before answering, does what you ask (open and close pages and Wonder Window's windows, next slide, reveal, a timer, pick someone from our class), and knows what is on the screen, so “Hey Symphony, explain this slide” works. More below. She is a girl who speaks English and Malay and was named for her musical voice. Click her, or tap **Ask Symphony**, to ask anything by text. Tap the **mic** for voice mode: everything else disappears, a glow along the bottom follows your voice while she listens, sweeps while she thinks and follows her words while she speaks, and her answer appears word by word. She then listens again. Every voice on the site is hers: Brain Break, Sound Journey and Wonder Window read in the same girl's voice. |
| **The Earth** | The landing page background: day colour, night lights, relief, sunlight glinting off the oceans, drifting clouds and a glowing atmosphere, lit for this exact moment. Drag to spin it on a laptop; tilt the phone to look around (iPhones ask once). Space sound pans around you as it turns. |

**Present mode** (every engine, Slide Studio and lkie.like) gives you:
- full screen;
- **Magic pointer** (P), timer (T) and teacher notes (N);
- **Draw** (D): pen, highlighter, rubber, six colours, three sizes, undo (Ctrl+Z) and clear. Each slide keeps its own drawing while the page is open; a tap while drawing is a dot, never "next slide"; Esc stops drawing;
- **Join** (J): a live lesson on pupils' own devices (below). The button then shows how many have joined, and a dot that says whether the latest slide reached their devices;
- **Class moments:** every "how pupils respond" pill on a screen (Use a reaction, Hold your work up to the camera, Vote, Type it in the chat, Talk, Think…) is a button. It opens the moment with the instruction, a timer (+30s, pause) and the answers: tap to count hands and reactions, a 3-2-1 countdown for the chat waterfall and for "hold it up", vote bars with the right answer on Reveal. In a live lesson the answers come from pupils' devices;
- **Class feedback** (C): five faces, keys 1–5 to count, and "best bit". In a live lesson pupils tap a face on their own device and it counts here.

## Fractions

Every fraction on the site is shown the way the class writes it: the numerator over the denominator with a line between, never 3/4 (`assets/js/fractions.js`). The engine is asked to write fractions as digits with a slash (3/4, 2 1/2) and any ½-style characters it uses are tidied to the same form, so there is one shape to look for; then every 3/4 on screen (slides, lkie.like packs and worksheets, class moments on the board, pupils' own devices in a live lesson, Symphony's replies, the Wonder Window) is stacked as it appears. The text underneath stays 3/4, so copying, reading aloud and screen readers keep working. PowerPoint and Word files get the numerator as superscript and the denominator as subscript (¹⁄₆, the nearest those files allow in running text), copies get ³⁄₄, and Symphony says "three quarters" and "2 and a half". Dates (12/05/2026), "Year 5/6", page counts like 2 / 12, web addresses and code are left alone.

## Pictures, videos and backgrounds (lkie.like)

- **Pictures by themselves.** A new pack gets a free Wikipedia picture on up to 5 slides without a diagram (title, hook, new learning, talk, plenary). The engine names the Wikipedia article for each one; the site checks every title, description and file name against a strict word list before anything shows. Check them before you present. **Pictures > Add pictures for me** does the same for older packs; **Remove all pictures** takes them off (Undo brings them back).
- **Find a picture** (under each slide, or the slide's **Picture** tab): search Wikipedia's free pictures inside the site. Each picture shows who made it and its licence, on the slide and in the PowerPoint notes.
- **Quality of your choice:** Standard (960 pixels wide), Sharp (1,280), Full HD (1,920) or the Original file. **Fill the space** or **Show all of it**.
- **Your own picture:** **Upload your own**, or paste a picture. It is made smaller in the browser and kept in this browser only; it is never uploaded.
- **A video:** **Find a video on YouTube** opens short, child-friendly results in a new tab; paste the link (and a start time if you like). In Present the video plays inside the slide (YouTube's privacy-enhanced player); the next slide stops it; resizing or full screen keeps it playing. In the PowerPoint it is its picture with a link.
- **Backgrounds:** Bright, Calm, Lined paper, Ocean, Forest, Sunset, Chalkboard, Night sky, Space, any colour, or a picture (light or dark). **Background** sets one for every slide; a slide's own **Background** tab sets just that slide. Dark backgrounds turn the words white; boxes stay light and diagrams sit on a white card, so everything stays readable.
- **Edit text:** every part of the slide as plain boxes (questions and answers, options with the right one ticked, steps, tasks, what you say, minutes, how pupils answer). The title slide edits the lesson title, objective, success criteria and big question.
- **Text size:** Smaller, Normal, Bigger or Biggest, for one slide or every slide. If the words would not fit, the slide shrinks them a little by itself.
- An AI change keeps the slide's picture, video, background and size.

## Wonder Window

Open it from the home page or say “Hey Symphony, open Wonder Window”. It starts on a picker in five groups; tap a window, or say its name (“Hey Symphony, show the rainforest”, “show me Tokyo”, “show the hurricane”, “show the speed race”). **All windows** goes back to the picker; Esc does too.

| Window | What the class sees and does |
|---|---|
| **World Explorer** | The whole world with day and night as they are right now (the dark side shows city lights) and a little sun where it is overhead. Tap one of 24 cities, or **Choose a city** / **Surprise me**: a plane flies there along the shortest route over the globe (a great circle, which looks curved on a flat map), from Kuala Lumpur or the last city, with the distance and about how long the flight takes. Then its postcard shows the time there now and how far ahead or behind us, day or night, how to say hello (**Hear it** in that language when the device has the voice), what it is famous for and a food to try, with real photos, and a fact. Each city has its own soundscape (a busy street, a market, the sea, the wind). |
| **Festivals** | 16 festivals, each drawn live in full screen with its own music: Hari Raya's pelita lamps and ketupat under a new moon (gamelan), Chinese New Year's lanterns and a dragon (gongs and drums), Deepavali's diyas, rangoli and fireworks (tabla), Christmas snow and a twinkling tree (bells), a Gawai longhouse (sape), Kaamatan's rice terraces under Mount Kinabalu, Batu Caves for Thaipusam, Wesak's lotus lamps under the full moon (temple chimes), clouds of colour for Holi (dhol), a menorah for Hanukkah, wheat fields for Vaisakhi, papel picado and marigolds for the Day of the Dead (a waltz), samba confetti in Rio, water fights for Songkran, Mid-Autumn lanterns (guzheng) and a bonfire with fireworks. **Tap the scene to join in**: a firework, a lantern let go, a puff of colour, a splash, a candle lit. Where, when, food and the greeting (**Say the greeting**), with a photo, are under **Find out more**. Festivals in this month are marked. |
| **Seven Wonders** | The ancient seven and the new seven, each drawn live in full screen with its own music: the pyramids and the Sphinx in the desert (an oud), the Hanging Gardens with waterfalls and the blue Ishtar Gate, the Temple of Artemis with its painted frieze, the gold-and-ivory Zeus inside his temple, the Mausoleum with its chariot on top, the Colossus at the harbour mouth at sunrise, the Lighthouse at night with its fire and sweeping beam (the six that are gone are drawn as they may have looked when new); then the Great Wall in the mist, Petra's Treasury seen through the Siq, Christ the Redeemer above Rio, Machu Picchu with its llamas and a condor, Chichén Itzá, the Colosseum and the Taj Mahal with its reflecting pool. Every scene has clouds, birds, boats or camels, and people walking past drawn at their true size next to the monument. **Tap the scene**: the pyramid gets its polished white casing and gold tip back, water splashes and birds fly up in the Gardens, doves lift from the temple, Zeus throws lightning, gulls scatter, the Colossus's torch flares, the lighthouse fire roars, a beacon is lit on the Great Wall with smoke and drums, sunlight sweeps Petra, Rio switches between day and night, the condor swoops, the equinox serpent slithers down Chichén Itzá's stairway, the velarium awning rolls over the Colosseum, and the Taj Mahal changes colour: pink at dawn, white at noon, gold at sunset, blue by moonlight (it cycles by itself too). The real photo is under **Find out more**. **How tall?** starts close up on a Year 4 pupil and a double-decker bus, then the camera pulls back until the Great Pyramid appears, with every wonder drawn to scale beside Big Ben's tower. Tap one to hear it. |
| **Wonders of Malaysia** | Kinabalu, Taman Negara, Rafflesia, orangutans, the Malayan tiger, Mulu (with bats at dusk), the fireflies of Kuala Selangor and more, on the same full-screen photo stage with their own sounds. **BM** switches the words, the captions, Symphony's voice and the quiz to Bahasa Melayu. |
| **Extreme weather** | **Hurricane** seen from space (switch north and south of the equator to see it spin the other way; tap the eye, the eyewall or a rain band). **Thunderstorm**: after each flash the class counts until the thunder, then “6 seconds ÷ 3 = about 2 kilometres away” (tap the sky or **Make lightning**). **Monsoon**: Malaysia's east coast month by month (wind, rain, rough seas and floods). **Blizzard**: move the temperature and wind and see how cold it feels (wind chill). |
| **Seasons** | The Earth going round the Sun with its tilt, and a close-up showing which half leans towards the Sun on any day. Daylight hours for London, Kuala Lumpur and Sydney, with their season. **Play the year**, drag the slider, or tap the orbit. |
| **Rainforest, Savannah, Desert, Coral reef, Tundra, Polar lands** | Living scenes with animals that walk, fly, swim, swing and hop. Every animal is drawn by the site (`assets/js/wonder/fauna.js`), not an emoji: legs swing, wings flap, tails wag, the orangutan swings hand over hand, the flying frog spreads its webbed feet to glide. Tap an animal for its card and photo. The rainforest names its four layers (tap one) and has **BM**. The polar lands are split in two: polar bears in the Arctic, penguins in Antarctica, because they never meet. |
| **Animal record breakers** | 12 record breakers on the full-screen photo stage, a **Speed race** on a savannah track (falcon, car, cheetah, ostrich, Usain Bolt, a fast Year 5 runner and a snail, all at their real relative speeds, with medals at the finish) and **How big?** (the blue whale, a python, a crocodile, a giraffe, an ostrich and a bee hummingbird to scale beside a bus and a pupil; on a phone, drag to slide along the line). |
| **Planets, Northern lights, Starlings, Fireflies** | The planets at their real relative speeds (tap one to hear about it), the northern lights over snowy mountains (tap for a solar storm), starlings dodging a falcon at dusk, and fireflies that slowly learn to flash together. |

Every window has:
- **a caption** that changes every 18 seconds: a fact, then a wonder question for the class. The speaker button has Symphony read it; the arrow shows the next one.
- **Quiz**: tap an answer (right or wrong shows at once, with the score at the end). **Class vote** puts the question on pupils' own devices in a live lesson, or lets you count hands.
- **For teachers**: where the facts come from, and who took each photo and its licence. Facts are rounded the way a child would say them; “about” means the experts' figures differ a little.
- **Sound** (a soundscape, soft music or a festival's own band; thunder in the storm; planes, fireworks and splashes) and **Full screen**. All of it is made live on the device: there are no sound files.

Photos come from Wikipedia with their credits; if a school network blocks Wikipedia, cards show the site's own drawing of the animal (or a picture symbol for a place) instead. Nothing on the Wonder Window is an emoji: the animals and birds in every scene, the picker's icons, the speed racers, the record breakers in How big?, the bats of Mulu, the Chinese New Year dragon and the World Explorer's plane are all drawn and animated by the site, so they look the same on every device. Symphony knows which window and card are open, so “Hey Symphony, tell us more about this” fits what the class sees.

## Symphony: Hey Symphony, patient listening and our class

- **Hey Symphony** (switch in Symphony's panel and in the menu, off until you switch it on): she listens in the background for her name. Say “Hey Symphony” and then your question or what to do, in one go or after a breath. A small pill (top left while presenting) shows the microphone is on; tap it to stop. Anything not said to her is thrown away at once: never shown, kept or sent to the engine. She pauses her ear while she speaks, when the tab is hidden, and switches it off after 45 quiet minutes.
- **Patient listening** (on by default): she waits for a 3.5-second pause before deciding you have finished (1.8 seconds when it is off), so nobody is cut off mid-thought. Tap the mic to send straight away. After she answers she listens for about 9 seconds for a follow-up without her name, and only takes it if it is said to her (a question, a request, or her name), not classroom chatter.
- **She does it herself** (no engine call): “open lkie.like”, “open Slide Studio”, “go home”, “open Wonder Window”, “show the northern lights”, “show me Tokyo”, “show the monsoon”, any engine or Wonder Window window by name; “present”, “next slide”, “back”, “go to slide 5”, “reveal the answers”, “notes”, “show the join code”, “draw”, “class feedback”, “close”; “start a timer for 2 minutes”; “read this slide”; “what time is it”; “make a lesson about volcanoes” (fills in the topic; you press Make). Typed in the chat they work too. Malay works for the main ones (buka, tutup, seterusnya, pilih seorang, ingat kelas kita…).
- **She knows the screen:** while you present she sees the words the class can see on the current slide (never answers still hidden), so “explain this slide simply” or “give me a question about this” fits the lesson.
- **Our class:** “Hey Symphony, remember our class: Aisyah, Wei Jie and Priya”, or **Our class** in her panel (one first name per line, or add the pupils who joined the live lesson). “Pick someone” shows a short shuffle and one name, big, and says it; nobody is picked twice until everyone has had a turn. First names only, kept on this device only, never sent to the engine or to the reports.

## Your lessons on the dashboard

The home page shows **Your lessons**: every lkie.like pack and Slide Studio lesson made on this device, each with its topic, year and subject, and a picture of the topic (the pack's title picture, or the best Wikipedia picture for the topic). **Keep on dashboard** (in lkie.like and Slide Studio, or the pin on the card) keeps a lesson at the front. Tap a card to open the lesson.

## Live lessons: pupils join with a QR code

Press **Join** in Present mode. The screen shows a QR code, the address `…/ks2-lesson-studio/join` with a 6-digit code (for laptops), and **Copy link for the chat** (for Teams, Zoom or Meet). Pupils type a first name or nickname: no accounts, no sign-in.

| Moment | On the pupil's device | On the class screen |
|---|---|---|
| Reaction | 👍 Got it, 👌 Nearly, 👎 Not yet, and ❤️ 😮 👏 | counts, and the reactions float up the screen |
| Vote | the real options (A to D) | bars hidden until Reveal; then pupils see if they were right |
| Answer (chat, waterfall) | a box, or one box per exit-ticket question | answers face down until Reveal, all at once; how many match each expected answer |
| Show me | a mini whiteboard: four pens, rubber, undo, clear | the boards face down until Reveal; tap one to enlarge |
| Talk, think | the instruction and the timer, "We are ready", "I have an idea" | how many are ready |
| Class feedback | five faces | the faces count by themselves |

**Questions go by themselves.** When a slide with a question is on the board (its "how pupils respond" pill: vote, type it, show me, talk, think, reactions), the question appears on every device a moment later, without tapping anything. Coming back to a slide brings back the same question with the answers already given. The pill shows how many have answered; tap it for the big view with a timer and Reveal (the answers so far are kept). Between questions, pupils' screens show **On the board now** and the slide's title. The Join screen has a switch to send questions only when the pill is tapped.

**Staying connected.** Pupils' screens stay awake during the lesson (where the browser allows it). If a line drops (Wi-Fi, a phone that slept, a tab in the background) it reconnects by itself, at once when the screen comes back on, and catches up on anything missed; a bar says "Reconnecting…" with a **Reconnect** button. The Join button's dot shows whether the latest slide reached pupils' devices (steady: yes; quick pulse: sending; amber: trying again). If a live lesson is still running after Present mode closes, the **Live** button at the top of the page opens its Join screen.

The teacher can **lock joining**, remove a name, and **End live lesson** (every device shows that it has ended). If the teacher's page reloads, the lesson carries on in that tab for up to 4 hours. One live lesson at a time for each teacher: starting one when another is running (another tab, or another device once the school relay is on) asks first, and **End it there and start here** moves it.

**Privacy.** Everything is locked on the device before it is sent. Pupils' answers are sealed to the teacher's screen (ECDH P-256, HKDF-SHA-256, AES-256-GCM), so neither the relay nor other pupils can read them; what the teacher sends to the class is locked with a key that only the join link carries (AES-128-GCM). Names and answers stay on the teacher's screen and are never saved or sent to Rabinder's reports.

**The relays.** Until the school relay is on, messages travel through the free public relay ntfy.sh (server-sent events, with a watchdog and reconnects), which only ever sees scrambled text and deletes it after 12 hours. Because it is free, it has limits for each network (each internet address): about 30 devices listening at once and about 250 messages a day, and it blocks a network for an hour if it keeps knocking after being told to slow down (the site always backs off). That is fine for online lessons, where pupils are at home; a whole class on one school Wi-Fi can reach those limits, and the Join screen says so plainly if it happens. Deploying `inbox/Code.gs` (Setup, step 4) turns on the school relay: the same Apps Script then carries live lessons in its short-term cache (6 hours at most), with no such limits, and the site uses it by itself.

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
- **One thing at a time** (`assets/js/activity.js`). While something is being made for a teacher, or her live lesson is running, her other Make buttons wait (“Making something else…”, “Live lesson running”), and a second live lesson cannot start: in all her tabs and, once the school relay is on, on her other devices (a short note in the Apps Script cache, under a scrambled id, renewed while the work goes on; if the relay does not answer in 2.5 seconds, teaching goes ahead). Presenting, Wonder Window, Symphony and small edits to the lesson being taught stay free.
- **Rabinder sees it.** Reaching a cap is noted in the activity log, and her dashboard lists who keeps hitting the limits (from teachers' own devices once the inbox is switched on, setup step 4; until then the notes wait on each device).

**How it works** (the header link, the button on the home page, the **?** next to Online / In class, and the Join screen) shows all of these rules in one place, with the numbers taken from the same settings, plus what Online and In class change, how live lessons and the relays work, Symphony, Wonder Window and privacy.

The numbers are in `index.html` (`"limits"` in the config). These rules live on each device; the hard ceiling is the monthly spend limit on the key itself (console.anthropic.com, Limits).

## Setup

1. **Connect once.** On the first device, press **Connect** and paste the engine key, or open the owner’s one-tap link. The key stays in that browser.
2. **Admin.** Rabinder signs in with her password (handed over privately; it is not stored in this repository). Only a salted PBKDF2 check and an encrypted key are in `index.html`. She then sets up a passkey on each device.
3. **Teachers.** Enrol each one on the dashboard and send them their personal link privately. Tell them their PIN yourself.
4. **Inbox and school relay (once).** Teachers’ activity reaches the dashboard through a small Google Apps Script web app (`inbox/Code.gs`), which is also the school relay for live lessons and keeps the “one thing at a time” notes across devices. In Apps Script: New project, paste `Code.gs`, then Deploy > New deployment > Web app, *Execute as: Me*, *Who has access: Anyone*. Put the web app address (it ends in `/exec`) in `index.html` as `"inbox"` in the config: that one address turns on the reports' activity, the school relay and the cross-device rule. The script only ever stores locked data and scrambled ids: it cannot read them. If an older copy is already deployed, paste the new file over it and choose Deploy > Manage deployments > Edit > New version.
5. **YouTube search inside the site (optional).** Without it, **Find a video on YouTube** opens YouTube in a new tab and the teacher pastes the link. To search from inside the slide editor: in Google Cloud Console create an API key for *YouTube Data API v3*, restrict it to that API and to the website `https://greenengine6.github.io/*`, then add `"youtubeKey": "…"` to the config in `index.html`. Searches use SafeSearch strict and embeddable videos only.

## Privacy and protection

- The site is hidden from search engines. The page’s security policy only allows requests to the engine API, Google Fonts, the Apps Script inbox and school relay, the public live-lesson relay (ntfy.sh), Wikipedia and Wikimedia (pictures), and YouTube's privacy-enhanced player (videos a teacher adds).
- Picture searches send only the search words to Wikipedia. Teachers' own pictures stay in their browser. Videos play from youtube-nocookie.com.
- Speaking to Symphony: the browser turns speech into text, on the device itself where Chrome can, otherwise with the browser's own speech service (Google for Chrome, Microsoft for Edge, Apple for Safari). Hey Symphony is off until switched on, shows a pill while the microphone is on, and throws away everything not said to her.
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
assets/js/play.js        Wonder Window's frame: the picker, top bar, caption, sound, voice words
assets/js/wonder/        Wonder Window's windows (loaded the first time it opens): data.js (all the facts, quizzes and
                         sources), windows.js (cards, postcard, quiz, sources, controls), map.js (World Explorer and its
                         flights), stage.js (the full-screen photo stage), festive.js (the 16 live festival scenes), wonders.js (the 14 wonders drawn live), scenery.js (hills, houses, glows and particles they share), fauna.js (every animal, bird, fish and racer, drawn and animated),
                         scale.js (How tall?, How big? and the speed race), music.js (the festivals' and wonders' music and sound effects),
                         biomes.js (habitats), weather.js, seasons.js, nature.js (planets, lights, starlings, fireflies)
assets/js/fx/earth.js    the landing Earth (three.js, real Sun position, tilt and drag, space sound)
assets/js/fx/beam.js     Symphony's voice glow
assets/js/fx/audio.js    the one sound engine: effects, sound switch, quiet while Symphony speaks
assets/earth/            Earth textures, 2K for phones and 4K for laptops
assets/vendor/           three.js
assets/js/security.js    protection deterrents
assets/js/guard.js       the engine guard: real presses only, rests, caps, one at a time
assets/js/activity.js    one thing at a time for each teacher: making and live lessons, across tabs and devices
assets/js/howto.js       How it works: every rule in one place
assets/js/fractions.js   fractions stacked (numerator over denominator) on screen, in files, in copies and in speech
assets/js/lkie/          lkie.like: curriculum map and matcher, prompts, data checks, drawing, exports, example, page
assets/css/lkie.css      lkie.like styles
assets/js/live/          live lessons: relay.js (locking, the two relays, the 6-digit code), session.js (the teacher's
                         side), panel.js (the Join screen), qr.js (QR codes), pupil.js (the pupils' page)
join/index.html          the pupils' page (no sign-in), with assets/css/join.css
assets/js/moments.js     class moments: reactions, votes, answers, mini whiteboards, talk and think time
assets/js/presentkit.js  Present-mode tools: Draw, Join, timer
assets/js/draw.js        pen, highlighter and rubber strokes (slides and pupils' whiteboards)
assets/css/live.css      Join screen, class moments, drawing tray
assets/js/pics.js        pictures (Wikipedia search and credits, quality, own uploads) and YouTube links
assets/js/lkie/looks.js  lkie.like backgrounds, on screen and in the PowerPoint
assets/js/shelf.js       Your lessons on the home page (covers, Keep on dashboard)
assets/js/ear.js         Symphony's ear: patient listening, Hey Symphony, follow-ups
assets/js/commands.js    what Symphony does herself (pages, windows, slides, timer, our class)
assets/js/context.js     what is on the screen, for Symphony's answers
assets/js/pupils.js      our class's first names and fair picking
assets/js/crypto.js, idb.js, settings.js, theme.js, slides.js, engines/, fx/
```

## Credits

- The Earth: [three.js](https://threejs.org) r185, MIT licence (`assets/vendor/three-r185/LICENSE.txt`). Earth textures by [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0), based on NASA imagery, as resized and packed by three.js. Shading after the three.js Earth example (Three.js Journey).
- Voice glow: written for this site, after the idea of Libraries.dev's Voice (voice-glow).
- Other visual effects are vanilla re-implementations (no libraries), inspired by CardSwap and Ribbons (React Bits), MagnificationDock and Interactive Waves.
- PowerPoint export: [PptxGenJS](https://github.com/gitbrent/PptxGenJS) 4.0.1, MIT licence (`assets/PPTXGENJS-LICENSE.txt`).
- Pictures: from [Wikipedia](https://en.wikipedia.org) and [Wikimedia Commons](https://commons.wikimedia.org), each shown with its author and licence.
- Wonder Window's World Explorer map uses the same Solar System Scope Earth textures (CC BY 4.0, based on NASA imagery). Day and night, the Sun's position and day lengths are worked out on the device from the date and time; local times come from the browser's time zone data. Animals and icons are the device's own emoji.
- QR codes: [QR Code generator library](https://www.nayuki.io/page/qr-code-generator-library) by Project Nayuki, MIT licence, compiled from its TypeScript source (`assets/vendor/qrcodegen-3c6d0b3/`).
- lkie.like curriculum map: statutory statements from the National Curriculum in England (2014) and the Relationships and Health Education guidance, lightly shortened (Crown copyright, Open Government Licence v3.0); RE after the RE Council's national framework (2013); Bahasa Melayu after the KSSR skill areas (Malaysia), paraphrased. The objective codes are this site's own.
- Slide fonts: TeX Gyre Adventor and Schola, GUST Font Licence. Interface fonts: Plus Jakarta Sans, DM Sans and JetBrains Mono from Google Fonts.
