/* Wonder Window's content: cities, festivals, wonders, record-breaking animals, Malaysia's wonders, the living
   world's biomes, extreme weather and the seasons. Written for Key Stage 2 (ages 7 to 11), in short sentences.
   Every window lists its sources for teachers. Numbers are rounded the way a child would say them; "about" means
   the experts' figures differ a little. Malaysia's windows also come in Bahasa Melayu (bm). */

/* ---------------- World Explorer: 24 cities ----------------
   tz: the city's time zone (for the time there now). hello: the greeting, how to say it, and the language for
   Symphony's voice. famous / food: what to see and eat, with the Wikipedia article whose picture shows it. */
export const CITIES = [
  { id: 'kl', name: 'Kuala Lumpur', country: 'Malaysia', flag: '🇲🇾', lat: 3.139, lon: 101.687, tz: 'Asia/Kuala_Lumpur',
    hello: { text: 'Apa khabar?', say: 'ah-pah kah-bar', means: 'How are you?', lang: 'ms-MY' },
    famous: { name: 'Petronas Twin Towers', wiki: 'Petronas Towers', text: 'The tallest twin towers in the world, 452 metres high, joined by a sky bridge.' },
    food: { name: 'Nasi lemak', wiki: 'Nasi lemak', text: 'Rice cooked in coconut milk, with spicy sambal, peanuts, anchovies and egg.' },
    fact: 'Kuala Lumpur means “muddy meeting of rivers”: the city began where two rivers join.' },
  { id: 'london', name: 'London', country: 'United Kingdom', flag: '🇬🇧', lat: 51.507, lon: -0.128, tz: 'Europe/London',
    hello: { text: 'Hello!', say: 'heh-loh', means: 'Hello', lang: 'en-GB' },
    famous: { name: 'Big Ben', wiki: 'Big Ben', text: 'Big Ben is really the name of the giant bell inside the clock tower.' },
    food: { name: 'Fish and chips', wiki: 'Fish and chips', text: 'Fish fried in crispy batter, with thick chips.' },
    fact: 'The London Underground opened in 1863. It was the first underground railway in the world.' },
  { id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷', lat: 48.857, lon: 2.352, tz: 'Europe/Paris',
    hello: { text: 'Bonjour!', say: 'bon-zhoor', means: 'Good day', lang: 'fr-FR' },
    famous: { name: 'Eiffel Tower', wiki: 'Eiffel Tower', text: 'Built in 1889 for a great fair, it is about 330 metres tall.' },
    food: { name: 'Croissant', wiki: 'Croissant', text: 'A flaky, buttery pastry shaped like a crescent moon.' },
    fact: 'The Louvre in Paris is the most visited art museum in the world. The Mona Lisa lives there.' },
  { id: 'rome', name: 'Rome', country: 'Italy', flag: '🇮🇹', lat: 41.903, lon: 12.496, tz: 'Europe/Rome',
    hello: { text: 'Ciao!', say: 'chow', means: 'Hello', lang: 'it-IT' },
    famous: { name: 'Colosseum', wiki: 'Colosseum', text: 'A huge arena almost 2,000 years old, where crowds once watched shows.' },
    food: { name: 'Gelato', wiki: 'Gelato', text: 'Italian ice cream, smooth and full of flavour.' },
    fact: 'People throw coins into the Trevi Fountain. The coins are collected and given to charity.' },
  { id: 'cairo', name: 'Cairo', country: 'Egypt', flag: '🇪🇬', lat: 30.044, lon: 31.236, tz: 'Africa/Cairo',
    hello: { text: 'Marhaban!', say: 'mar-ha-ban', means: 'Hello', lang: 'ar-EG' },
    famous: { name: 'The Pyramids of Giza', wiki: 'Giza pyramid complex', text: 'Built more than 4,500 years ago, just outside the city.' },
    food: { name: 'Koshari', wiki: 'Koshary', text: 'Rice, lentils and pasta with tomato sauce and crispy onions.' },
    fact: 'The River Nile flows through Cairo. It is one of the longest rivers in the world.' },
  { id: 'nairobi', name: 'Nairobi', country: 'Kenya', flag: '🇰🇪', lat: -1.292, lon: 36.822, tz: 'Africa/Nairobi',
    hello: { text: 'Jambo!', say: 'jam-boh', means: 'Hello (Swahili)', lang: 'sw-KE' },
    famous: { name: 'Nairobi National Park', wiki: 'Nairobi National Park', text: 'Lions, giraffes and rhinos live in a national park right next to the city.' },
    food: { name: 'Ugali', wiki: 'Ugali', text: 'A firm maize porridge, eaten with stews and green vegetables.' },
    fact: 'Kenya’s runners are famous for winning long-distance races all over the world.' },
  { id: 'capetown', name: 'Cape Town', country: 'South Africa', flag: '🇿🇦', lat: -33.925, lon: 18.424, tz: 'Africa/Johannesburg',
    hello: { text: 'Molo!', say: 'maw-law', means: 'Hello (isiXhosa)', lang: 'xh-ZA' },
    famous: { name: 'Table Mountain', wiki: 'Table Mountain', text: 'A flat-topped mountain. Clouds often cover it like a tablecloth.' },
    food: { name: 'Bobotie', wiki: 'Bobotie', text: 'Spiced minced meat baked with a golden egg topping.' },
    fact: 'African penguins live on a beach near Cape Town called Boulders Beach.' },
  { id: 'lagos', name: 'Lagos', country: 'Nigeria', flag: '🇳🇬', lat: 6.524, lon: 3.379, tz: 'Africa/Lagos',
    hello: { text: 'Báwo ni?', say: 'bah-woh nee', means: 'How are you? (Yoruba)', lang: 'yo-NG' },
    famous: { name: 'Lekki canopy walkway', wiki: 'Lekki Conservation Centre', text: 'A long walkway high in the treetops of a nature reserve.' },
    food: { name: 'Jollof rice', wiki: 'Jollof rice', text: 'Rice cooked in a rich, spicy tomato sauce.' },
    fact: 'Nigeria’s film industry, Nollywood, makes thousands of films every year.' },
  { id: 'mumbai', name: 'Mumbai', country: 'India', flag: '🇮🇳', lat: 19.076, lon: 72.878, tz: 'Asia/Kolkata',
    hello: { text: 'Namaste!', say: 'nuh-muh-stay', means: 'Greetings to you (Hindi)', lang: 'hi-IN' },
    famous: { name: 'Gateway of India', wiki: 'Gateway of India', text: 'A grand stone arch by the sea, finished in 1924.' },
    food: { name: 'Vada pav', wiki: 'Vada pav', text: 'A spicy potato fritter in a soft bread roll.' },
    fact: 'Mumbai is home to Bollywood, one of the biggest film industries in the world.' },
  { id: 'beijing', name: 'Beijing', country: 'China', flag: '🇨🇳', lat: 39.904, lon: 116.407, tz: 'Asia/Shanghai',
    hello: { text: '你好 Nǐ hǎo!', say: 'nee how', means: 'Hello (Mandarin)', lang: 'zh-CN' },
    famous: { name: 'The Forbidden City', wiki: 'Forbidden City', text: 'The emperors’ palace, with almost 9,000 rooms.' },
    food: { name: 'Peking duck', wiki: 'Peking duck', text: 'Roast duck with crispy skin, wrapped in thin pancakes.' },
    fact: 'Parts of the Great Wall of China are about an hour’s drive from Beijing.' },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', flag: '🇯🇵', lat: 35.676, lon: 139.65, tz: 'Asia/Tokyo',
    hello: { text: 'こんにちは Konnichiwa!', say: 'kon-nee-chee-wah', means: 'Hello', lang: 'ja-JP' },
    famous: { name: 'Tokyo Skytree', wiki: 'Tokyo Skytree', text: 'The tallest tower in the world, 634 metres high.' },
    food: { name: 'Sushi', wiki: 'Sushi', text: 'Small rolls of vinegared rice with fish or vegetables.' },
    fact: 'Shinjuku station in Tokyo is one of the busiest railway stations in the world.' },
  { id: 'seoul', name: 'Seoul', country: 'South Korea', flag: '🇰🇷', lat: 37.566, lon: 126.978, tz: 'Asia/Seoul',
    hello: { text: '안녕하세요 Annyeonghaseyo!', say: 'ahn-nyong-ha-say-yo', means: 'Hello', lang: 'ko-KR' },
    famous: { name: 'Gyeongbokgung Palace', wiki: 'Gyeongbokgung', text: 'A royal palace first built in 1395.' },
    food: { name: 'Kimchi', wiki: 'Kimchi', text: 'Spicy pickled cabbage, eaten with almost every meal.' },
    fact: 'Korean writing, Hangul, was invented by King Sejong in the 1440s so that everyone could learn to read.' },
  { id: 'bangkok', name: 'Bangkok', country: 'Thailand', flag: '🇹🇭', lat: 13.756, lon: 100.502, tz: 'Asia/Bangkok',
    hello: { text: 'สวัสดี Sawasdee!', say: 'sah-wah-dee', means: 'Hello', lang: 'th-TH' },
    famous: { name: 'Wat Arun', wiki: 'Wat Arun', text: 'The Temple of Dawn, sparkling with pieces of coloured china.' },
    food: { name: 'Pad thai', wiki: 'Pad thai', text: 'Stir-fried rice noodles with egg, peanuts and lime.' },
    fact: 'Bangkok’s full name in Thai is one of the longest place names in the world.' },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', flag: '🇸🇬', lat: 1.352, lon: 103.82, tz: 'Asia/Singapore',
    hello: { text: 'Hello! Selamat pagi! Nǐ hǎo! Vanakkam!', say: 'heh-loh · suh-lah-mat pah-gee · nee how · vah-nuh-kum', means: 'Greetings in English, Malay, Mandarin and Tamil', lang: 'en-GB' },
    famous: { name: 'Gardens by the Bay', wiki: 'Gardens by the Bay', text: 'Giant metal “Supertrees” covered in plants, lit up at night.' },
    food: { name: 'Chicken rice', wiki: 'Hainanese chicken rice', text: 'Tender chicken with rice cooked in chicken stock.' },
    fact: 'Singapore has four official languages: English, Malay, Mandarin and Tamil.' },
  { id: 'jakarta', name: 'Jakarta', country: 'Indonesia', flag: '🇮🇩', lat: -6.208, lon: 106.846, tz: 'Asia/Jakarta',
    hello: { text: 'Selamat pagi!', say: 'suh-lah-mat pah-gee', means: 'Good morning', lang: 'id-ID' },
    famous: { name: 'National Monument (Monas)', wiki: 'National Monument (Indonesia)', text: 'A 132-metre tower topped with a flame covered in gold.' },
    food: { name: 'Nasi goreng', wiki: 'Nasi goreng', text: 'Fried rice with sweet soy sauce, often with a fried egg on top.' },
    fact: 'Indonesia is made of more than 17,000 islands.' },
  { id: 'sydney', name: 'Sydney', country: 'Australia', flag: '🇦🇺', lat: -33.869, lon: 151.209, tz: 'Australia/Sydney',
    hello: { text: 'G’day!', say: 'guh-day', means: 'Good day', lang: 'en-AU' },
    famous: { name: 'Sydney Opera House', wiki: 'Sydney Opera House', text: 'Its white roofs look like the sails of a ship.' },
    food: { name: 'Lamingtons', wiki: 'Lamington', text: 'Squares of sponge cake dipped in chocolate and rolled in coconut.' },
    fact: 'Sydney Harbour Bridge is nicknamed “the Coathanger” because of its shape.' },
  { id: 'auckland', name: 'Auckland', country: 'New Zealand', flag: '🇳🇿', lat: -36.848, lon: 174.763, tz: 'Pacific/Auckland',
    hello: { text: 'Kia ora!', say: 'kee-ah or-ah', means: 'Hello (Māori)', lang: 'mi-NZ' },
    famous: { name: 'Sky Tower', wiki: 'Sky Tower (Auckland)', text: 'A tower 328 metres tall, with a glass floor near the top.' },
    food: { name: 'Hāngī', wiki: 'Hāngī', text: 'A Māori feast cooked in an earth oven with hot stones.' },
    fact: 'Auckland is built on a field of about 50 volcanoes.' },
  { id: 'newyork', name: 'New York', country: 'United States', flag: '🇺🇸', lat: 40.713, lon: -74.006, tz: 'America/New_York',
    hello: { text: 'Hi there!', say: 'hi there', means: 'Hello', lang: 'en-US' },
    famous: { name: 'Statue of Liberty', wiki: 'Statue of Liberty', text: 'A gift from the people of France in 1886.' },
    food: { name: 'Bagels', wiki: 'Bagel', text: 'Chewy bread rings, boiled and then baked.' },
    fact: 'Central Park in New York is bigger than the whole country of Monaco.' },
  { id: 'mexico', name: 'Mexico City', country: 'Mexico', flag: '🇲🇽', lat: 19.433, lon: -99.133, tz: 'America/Mexico_City',
    hello: { text: '¡Hola!', say: 'oh-la', means: 'Hello', lang: 'es-MX' },
    famous: { name: 'Templo Mayor', wiki: 'Templo Mayor', text: 'The ruins of the great Aztec temple, in the middle of the city.' },
    food: { name: 'Tacos', wiki: 'Taco', text: 'Soft corn tortillas wrapped around tasty fillings.' },
    fact: 'Mexico City was built on a lake, where the Aztec city of Tenochtitlan once stood.' },
  { id: 'rio', name: 'Rio de Janeiro', country: 'Brazil', flag: '🇧🇷', lat: -22.907, lon: -43.173, tz: 'America/Sao_Paulo',
    hello: { text: 'Olá!', say: 'oh-lah', means: 'Hello (Portuguese)', lang: 'pt-BR' },
    famous: { name: 'Christ the Redeemer', wiki: 'Christ the Redeemer (statue)', text: 'A huge statue with open arms, high on a mountain above the city.' },
    food: { name: 'Feijoada', wiki: 'Feijoada', text: 'A slow-cooked stew of black beans and meat.' },
    fact: 'Rio’s Carnival is one of the biggest parties in the world, with amazing samba parades.' },
  { id: 'lima', name: 'Lima', country: 'Peru', flag: '🇵🇪', lat: -12.046, lon: -77.043, tz: 'America/Lima',
    hello: { text: '¡Hola!', say: 'oh-la', means: 'Hello', lang: 'es-PE' },
    famous: { name: 'Huaca Pucllana', wiki: 'Huaca Pucllana', text: 'An ancient pyramid made of mud bricks, right in the city.' },
    food: { name: 'Ceviche', wiki: 'Ceviche', text: 'Fresh fish “cooked” in lime juice, with onion and chilli.' },
    fact: 'Lima is one of the driest capital cities in the world: it hardly ever rains there.' },
  { id: 'reykjavik', name: 'Reykjavík', country: 'Iceland', flag: '🇮🇸', lat: 64.147, lon: -21.942, tz: 'Atlantic/Reykjavik',
    hello: { text: 'Halló!', say: 'hah-loh', means: 'Hello', lang: 'is-IS' },
    famous: { name: 'Hallgrímskirkja', wiki: 'Hallgrímskirkja', text: 'A tall church shaped like the rock columns made by cooling lava.' },
    food: { name: 'Skyr', wiki: 'Skyr', text: 'A thick, creamy dairy food a bit like yoghurt.' },
    fact: 'Hot water from deep underground heats many of Reykjavík’s homes and swimming pools.' },
  { id: 'dubai', name: 'Dubai', country: 'United Arab Emirates', flag: '🇦🇪', lat: 25.205, lon: 55.271, tz: 'Asia/Dubai',
    hello: { text: 'Marhaba!', say: 'mar-ha-bah', means: 'Hello', lang: 'ar-AE' },
    famous: { name: 'Burj Khalifa', wiki: 'Burj Khalifa', text: 'The tallest building in the world, 828 metres high.' },
    food: { name: 'Luqaimat', wiki: 'Luqaimat', text: 'Little sweet dumplings drizzled with date syrup.' },
    fact: 'In summer it can be hotter than 45 °C in Dubai.' },
  { id: 'istanbul', name: 'Istanbul', country: 'Türkiye', flag: '🇹🇷', lat: 41.008, lon: 28.978, tz: 'Europe/Istanbul',
    hello: { text: 'Merhaba!', say: 'mair-ha-bah', means: 'Hello', lang: 'tr-TR' },
    famous: { name: 'Hagia Sophia', wiki: 'Hagia Sophia', text: 'A huge domed building, nearly 1,500 years old.' },
    food: { name: 'Simit', wiki: 'Simit', text: 'A crunchy bread ring covered in sesame seeds.' },
    fact: 'Istanbul is in two continents, Europe and Asia, with the Bosphorus sea strait between them.' }
];

/* ---------------- Cultures and festivals ---------------- */
export const FESTIVALS = [
  { id: 'raya', name: 'Hari Raya Aidilfitri', icon: '🌙', where: 'Malaysia and Muslims around the world', when: 'At the end of Ramadan (about 11 days earlier each year)', wiki: 'Eid al-Fitr',
    what: 'Muslims celebrate the end of a month of fasting. Families ask each other for forgiveness, visit relatives and hold open houses for everyone.', food: 'Ketupat, rendang and lemang', hello: 'Selamat Hari Raya! Maaf zahir dan batin.', hl: 'ms' },
  { id: 'cny', name: 'Chinese New Year', icon: '🧧', where: 'Malaysia, China and Chinese communities everywhere', when: 'January or February', wiki: 'Chinese New Year',
    what: 'The first day of the lunar year. Families share a reunion dinner, children receive red packets, and lion dancers bring good luck.', food: 'Mandarin oranges and yee sang', hello: 'Gong Xi Fa Cai!' },
  { id: 'deepavali', name: 'Deepavali', icon: '🪔', where: 'Malaysia, India and Hindu communities everywhere', when: 'October or November', wiki: 'Diwali',
    what: 'The festival of lights. Homes glow with oil lamps, and families draw colourful kolam patterns at their doors.', food: 'Murukku and other sweets', hello: 'Happy Deepavali!' },
  { id: 'christmas', name: 'Christmas', icon: '🎄', where: 'Christians around the world', when: '25 December', wiki: 'Christmas',
    what: 'Christians celebrate the birth of Jesus. People sing carols, decorate trees and give presents.', food: 'Roast dinner and mince pies in the UK', hello: 'Merry Christmas! Selamat Hari Krismas!' },
  { id: 'gawai', name: 'Gawai Dayak', icon: '🌾', where: 'Sarawak, Malaysia', when: '1 June', wiki: 'Gawai Dayak',
    what: 'The harvest festival of Sarawak’s Dayak peoples. Longhouses are full of music, dancing and visitors.', food: 'Pansuh: chicken cooked inside bamboo', hello: 'Selamat Hari Gawai! Gayu guru gerai nyamai!', hl: 'ms' },
  { id: 'kaamatan', name: 'Kaamatan', icon: '🌾', where: 'Sabah, Malaysia', when: 'May (the big days are 30 and 31 May)', wiki: 'Kaamatan',
    what: 'The Kadazandusun harvest festival gives thanks for the rice harvest, with the Sumazau dance and traditional games.', food: 'Hinava: fresh fish with lime and ginger', hello: 'Kopivosian Tadau Kaamatan!', hl: 'ms' },
  { id: 'thaipusam', name: 'Thaipusam', icon: '🛕', where: 'Malaysia, India and Tamil communities', when: 'January or February', wiki: 'Batu Caves',
    what: 'A Tamil Hindu festival honouring Lord Murugan. At Batu Caves, people climb 272 steps carrying offerings.', food: 'Many families eat only vegetarian food in the days before', hello: 'Happy Thaipusam!' },
  { id: 'wesak', name: 'Wesak', icon: '🪷', where: 'Buddhists around the world', when: 'May, at the full moon', wiki: 'Vesak',
    what: 'Buddhists remember the birth, enlightenment and passing of the Buddha, with lanterns, candlelit processions and kindness to others.', food: 'Simple vegetarian meals, often shared', hello: 'Happy Wesak!' },
  { id: 'holi', name: 'Holi', icon: '🎨', where: 'India and Hindu communities everywhere', when: 'March', wiki: 'Holi',
    what: 'The Hindu festival of colours welcomes spring. People throw bright coloured powder and water at each other.', food: 'Gujiya: sweet filled dumplings', hello: 'Happy Holi!' },
  { id: 'hanukkah', name: 'Hanukkah', icon: '🕎', where: 'Jewish communities around the world', when: 'November or December, for eight nights', wiki: 'Hanukkah',
    what: 'The Jewish festival of lights. One more candle is lit each night on a special candlestick, and children play the dreidel game.', food: 'Potato latkes and jam doughnuts', hello: 'Happy Hanukkah! Chag sameach!' },
  { id: 'vaisakhi', name: 'Vaisakhi', icon: '🌾', where: 'Sikhs around the world and the Punjab', when: '13 or 14 April', wiki: 'Vaisakhi',
    what: 'Sikhs remember the start of the Khalsa in 1699, with colourful processions. In the Punjab it is also a harvest festival.', food: 'Langar: a free meal shared by everyone at the gurdwara', hello: 'Happy Vaisakhi!' },
  { id: 'muertos', name: 'Day of the Dead', icon: '🌼', where: 'Mexico', when: '1 and 2 November', wiki: 'Day of the Dead',
    what: 'A happy time when families remember loved ones who have died, with colourful altars, marigold flowers and music.', food: 'Pan de muerto: a sweet bread', hello: '¡Feliz Día de Muertos!', hl: 'es-MX' },
  { id: 'carnival', name: 'Carnival in Rio', icon: '🎭', where: 'Rio de Janeiro, Brazil', when: 'February or March', wiki: 'Sambadrome Marquês de Sapucaí',
    what: 'Samba schools dance through the city with huge floats and sparkling costumes they have made all year.', food: 'Pastel: crispy filled pastries', hello: 'Feliz Carnaval!', hl: 'pt-BR' },
  { id: 'songkran', name: 'Songkran', icon: '💦', where: 'Thailand', when: '13 to 15 April', wiki: 'Songkran (Thailand)',
    what: 'The Thai New Year. People pour water gently on elders’ hands for a blessing, and have huge, happy water fights.', food: 'Mango sticky rice', hello: 'Sawasdee Pi Mai!' },
  { id: 'midautumn', name: 'Mid-Autumn Festival', icon: '🥮', where: 'China, Malaysia and East Asia', when: 'September or October, at the full moon', wiki: 'Mid-Autumn Festival',
    what: 'Families admire the full moon, carry glowing lanterns and tell the story of Chang’e, the lady in the moon.', food: 'Mooncakes', hello: 'Happy Mid-Autumn Festival!' },
  { id: 'bonfire', name: 'Bonfire Night', icon: '🎆', where: 'United Kingdom', when: '5 November', wiki: 'Guy Fawkes Night',
    what: 'People remember the failed Gunpowder Plot of 1605, when Guy Fawkes tried to blow up Parliament, with bonfires and fireworks.', food: 'Toffee apples and parkin', hello: 'Remember, remember the fifth of November!' }
];

/* The festivals that fall in the same month every year (0 = January), for the "This month" badge. Festivals that
   follow the Moon move each year, so they never get the badge. */
export const FESTIVAL_MONTHS = { christmas: 11, bonfire: 10, muertos: 10, songkran: 3, vaisakhi: 3, gawai: 5, kaamatan: 4 };

/* ---------------- The Seven Wonders, ancient and new ----------------
   h: height in metres (about), for the size comparison; null when nobody knows. */
export const WONDERS = [
  { id: 'giza', icon: '🔺', set: 'ancient', name: 'Great Pyramid of Giza', where: 'Egypt', built: 'About 2560 BC', standing: true, h: 139, wiki: 'Great Pyramid of Giza',
    text: 'The oldest of the ancient wonders, and the only one still standing. It was the tallest building in the world for about 3,800 years.' },
  { id: 'babylon', icon: '🌿', set: 'ancient', name: 'Hanging Gardens of Babylon', where: 'Iraq', built: 'About 600 BC', standing: false, h: null, wiki: 'Hanging Gardens of Babylon',
    text: 'Stories tell of terraces of trees and flowers. Nobody has ever found them, so some experts think they were never real.' },
  { id: 'artemis', icon: '🏛️', set: 'ancient', name: 'Temple of Artemis', where: 'Türkiye', built: 'About 550 BC', standing: false, h: null, wiki: 'Temple of Artemis',
    text: 'A huge marble temple with 127 columns. Today only one column stands, rebuilt from broken pieces.' },
  { id: 'zeus', icon: '⚡', set: 'ancient', name: 'Statue of Zeus at Olympia', where: 'Greece', built: 'About 435 BC', standing: false, h: 12, wiki: 'Statue of Zeus at Olympia',
    text: 'A giant seated statue made of ivory and gold, about as tall as a four-storey building.' },
  { id: 'mausoleum', icon: '⚱️', set: 'ancient', name: 'Mausoleum at Halicarnassus', where: 'Türkiye', built: 'About 350 BC', standing: false, h: 45, wiki: 'Mausoleum at Halicarnassus',
    text: 'A grand tomb for King Mausolus. It gave us the word “mausoleum” for a large tomb.' },
  { id: 'colossus', icon: '☀️', set: 'ancient', name: 'Colossus of Rhodes', where: 'Greece', built: '280 BC', standing: false, h: 33, wiki: 'Colossus of Rhodes',
    text: 'A bronze statue of the sun god Helios. An earthquake knocked it down after only about 54 years.' },
  { id: 'pharos', icon: '🔥', set: 'ancient', name: 'Lighthouse of Alexandria', where: 'Egypt', built: 'About 280 BC', standing: false, h: 100, wiki: 'Lighthouse of Alexandria',
    text: 'One of the tallest buildings of its time, with a fire at the top to guide ships. Earthquakes later knocked it down.' },
  { id: 'wall', icon: '🧱', set: 'new', name: 'Great Wall of China', where: 'China', built: 'Over 2,000 years', standing: true, h: 8, wiki: 'Great Wall of China',
    text: 'All its walls together are more than 20,000 kilometres long. You cannot see it from space with your eyes alone: that is a myth.' },
  { id: 'petra', icon: '🏜️', set: 'new', name: 'Petra', where: 'Jordan', built: 'More than 2,000 years ago', standing: true, h: 40, wiki: 'Petra',
    text: 'A city carved into rose-red rock cliffs. Its famous Treasury is about 40 metres tall.' },
  { id: 'christ', icon: '⛰️', set: 'new', name: 'Christ the Redeemer', where: 'Brazil', built: '1931', standing: true, h: 38, wiki: 'Christ the Redeemer (statue)',
    text: 'The statue is 30 metres tall and stands on an 8-metre base. Its arms stretch 28 metres wide.' },
  { id: 'machu', icon: '🦙', set: 'new', name: 'Machu Picchu', where: 'Peru', built: 'About 1450', standing: true, h: null, wiki: 'Machu Picchu',
    text: 'An Inca city high in the Andes mountains, about 2,430 metres above the sea, built without mortar between the stones.' },
  { id: 'chichen', icon: '🪜', set: 'new', name: 'Chichén Itzá', where: 'Mexico', built: 'About AD 600 to 1200', standing: true, h: 30, wiki: 'Chichen Itza',
    text: 'A great Maya city. Its pyramid has 365 steps, one for each day of the year.' },
  { id: 'colosseum', icon: '🏟️', set: 'new', name: 'Colosseum', where: 'Italy', built: 'AD 80', standing: true, h: 48, wiki: 'Colosseum',
    text: 'A giant stone arena in Rome that could hold about 50,000 people.' },
  { id: 'taj', icon: '🕌', set: 'new', name: 'Taj Mahal', where: 'India', built: '1653', standing: true, h: 73, wiki: 'Taj Mahal',
    text: 'Built by Emperor Shah Jahan in memory of his wife. Its white marble looks pink at dawn and golden at sunset.' }
];
export const SIZE_REFS = [{ name: 'A Year 4 pupil', h: 1.3, icon: '🧒' }, { name: 'A double-decker bus', h: 4.4, icon: '🚌' }, { name: 'Big Ben’s tower', h: 96, icon: '🕰️' }];

/* ---------------- Animal record breakers ---------------- */
export const RECORDS = [
  { id: 'cheetah', title: 'Fastest on land', name: 'Cheetah', icon: '🐆', value: 'About 100 km/h', n: 100, unit: 'km/h', wiki: 'Cheetah', text: 'A cheetah can go from standing still to almost 100 km/h in about three seconds, but only for short sprints.' },
  { id: 'falcon', title: 'Fastest of all', name: 'Peregrine falcon', icon: '🦅', value: 'Over 300 km/h', n: 300, unit: 'km/h', wiki: 'Peregrine falcon', text: 'When it dives to catch its food, a peregrine falcon goes about three times faster than a car on a motorway.' },
  { id: 'whale', title: 'Biggest animal ever', name: 'Blue whale', icon: '🐋', value: 'Up to about 30 metres', n: 30, unit: 'm long', wiki: 'Blue whale', text: 'A blue whale is longer than two buses, and its tongue can weigh as much as an elephant.' },
  { id: 'giraffe', title: 'Tallest', name: 'Giraffe', icon: '🦒', value: 'Up to about 5.5 metres', n: 5.5, unit: 'm tall', wiki: 'Giraffe', text: 'A giraffe could look through an upstairs window. Its neck has seven bones, the same as yours.' },
  { id: 'elephant', title: 'Heaviest on land', name: 'African elephant', icon: '🐘', value: 'About 6 tonnes', n: 6, unit: 'tonnes', wiki: 'African bush elephant', text: 'As heavy as about 80 grown-ups. Elephants talk to each other with rumbles too low for us to hear.' },
  { id: 'python', title: 'Longest snake', name: 'Reticulated python', icon: '🐍', value: 'Over 6 metres', n: 6, unit: 'm long', wiki: 'Reticulated python', text: 'It lives in the forests of Malaysia and South East Asia, and it is a very good swimmer.' },
  { id: 'croc', title: 'Biggest reptile', name: 'Saltwater crocodile', icon: '🐊', value: 'Up to about 6 metres', n: 6, unit: 'm long', wiki: 'Saltwater crocodile', text: 'It lives in rivers and coasts, including Sarawak and Sabah, and can swim far out to sea.' },
  { id: 'ostrich', title: 'Biggest bird', name: 'Ostrich', icon: '🪶', value: 'Up to about 2.7 metres tall', n: 2.7, unit: 'm tall', wiki: 'Common ostrich', text: 'It cannot fly, but it can run at about 70 km/h, and it lays the biggest eggs of any living bird.' },
  { id: 'hummingbird', title: 'Smallest bird', name: 'Bee hummingbird', icon: '🐦', value: 'About 5 centimetres', n: 0.05, unit: 'm long', wiki: 'Bee hummingbird', text: 'It lives in Cuba and is about the size of a bee. Its heart beats hundreds of times a minute.' },
  { id: 'shrew', title: 'Lightest mammal', name: 'Etruscan shrew', icon: '🐭', value: 'About 2 grams', n: 2, unit: 'grams', wiki: 'Etruscan shrew', text: 'It weighs less than a ping-pong ball, and it must eat all the time to stay alive.' },
  { id: 'shark', title: 'Longest-living animal with a backbone', name: 'Greenland shark', icon: '🦈', value: 'More than 250 years', n: 250, unit: 'years', wiki: 'Greenland shark', text: 'Scientists think some Greenland sharks alive today were born before Queen Victoria.' },
  { id: 'beetle', title: 'Strongest for its size', name: 'Dung beetle', icon: '🪲', value: 'Over 1,000 times its weight', n: 1000, unit: 'times its weight', wiki: 'Onthophagus taurus', text: 'That is like a person pulling six double-decker buses full of people!' }
];

/* ---------------- Wonders of Malaysia (English and Bahasa Melayu) ---------------- */
export const MALAYSIA = [
  { id: 'kinabalu', name: 'Mount Kinabalu', bmName: 'Gunung Kinabalu', icon: '⛰️', wiki: 'Mount Kinabalu',
    text: 'Malaysia’s highest mountain, 4,095 metres tall, in Sabah. The world’s biggest pitcher plants grow on it.',
    bm: 'Gunung tertinggi di Malaysia, setinggi 4,095 meter, di Sabah. Periuk kera yang terbesar di dunia tumbuh di sana.' },
  { id: 'tamannegara', name: 'Taman Negara', bmName: 'Taman Negara', icon: '🌳', wiki: 'Taman Negara',
    text: 'One of the oldest rainforests in the world, about 130 million years old. Its canopy walkway takes you high into the trees.',
    bm: 'Salah satu hutan hujan tertua di dunia, kira-kira 130 juta tahun usianya. Jambatan kanopinya membawa anda tinggi di atas pokok.' },
  { id: 'rafflesia', name: 'Rafflesia', bmName: 'Rafflesia', icon: '🌺', wiki: 'Rafflesia arnoldii',
    text: 'The biggest single flower in the world, up to about a metre across. It smells like rotten meat to attract flies.',
    bm: 'Bunga tunggal terbesar di dunia, lebarnya sehingga kira-kira satu meter. Baunya seperti daging busuk untuk menarik lalat.' },
  { id: 'orangutan', name: 'Orangutans', bmName: 'Orang utan', icon: '🦧', wiki: 'Bornean orangutan',
    text: '“Orang hutan” means “person of the forest” in Malay. They live in Sabah and Sarawak and build a new leafy nest every night.',
    bm: '“Orang hutan” bermaksud manusia hutan. Mereka tinggal di Sabah dan Sarawak dan membina sarang daun baharu setiap malam.' },
  { id: 'proboscis', name: 'Proboscis monkeys', bmName: 'Monyet belanda', icon: '🐒', wiki: 'Proboscis monkey',
    text: 'They live only on the island of Borneo. The males have big noses, and they are great swimmers.',
    bm: 'Mereka hanya tinggal di pulau Borneo. Monyet jantan berhidung besar, dan mereka perenang yang hebat.' },
  { id: 'tiger', name: 'The Malayan tiger', bmName: 'Harimau Malaya', icon: '🐅', wiki: 'Malayan tiger',
    text: 'Malaysia’s national animal, on its coat of arms. It is critically endangered: a national survey (2016 to 2020) found fewer than 150 left in the wild.',
    bm: 'Haiwan kebangsaan Malaysia, pada jata negara. Ia sangat terancam: tinjauan kebangsaan (2016 hingga 2020) mendapati kurang daripada 150 ekor yang tinggal di hutan.' },
  { id: 'mulu', name: 'Mulu caves', bmName: 'Gua Mulu', icon: '🦇', wiki: 'Gunung Mulu National Park',
    text: 'In Sarawak. Sarawak Chamber is one of the biggest cave rooms in the world, and millions of bats fly out of Deer Cave at dusk.',
    bm: 'Di Sarawak. Ruang Sarawak ialah salah satu ruang gua terbesar di dunia, dan berjuta-juta kelawar terbang keluar dari Gua Rusa pada waktu senja.' },
  { id: 'fireflies', name: 'Fireflies of Kuala Selangor', bmName: 'Kelip-kelip Kuala Selangor', icon: '✨', wiki: 'Kuala Selangor',
    text: 'In the mangrove trees along the Selangor River, thousands of fireflies flash together at night like Christmas lights.',
    bm: 'Di pokok bakau di tepi Sungai Selangor, beribu-ribu kelip-kelip berkelip serentak pada waktu malam.' },
  { id: 'turtle', name: 'Leatherback turtles', bmName: 'Penyu belimbing', icon: '🐢', wiki: 'Leatherback sea turtle',
    text: 'The biggest turtles in the world, up to about 2 metres long. They once nested in their thousands on the beaches of Terengganu; now they are very rare there.',
    bm: 'Penyu terbesar di dunia, panjangnya sehingga kira-kira 2 meter. Dahulu beribu-ribu ekor bertelur di pantai Terengganu; kini ia sangat jarang di sana.' },
  { id: 'hornbill', name: 'Hornbills', bmName: 'Burung enggang', icon: '🐦', wiki: 'Rhinoceros hornbill',
    text: 'Sarawak is called the Land of the Hornbills. The rhinoceros hornbill, with its orange horn, is Sarawak’s state bird.',
    bm: 'Sarawak digelar Bumi Kenyalang. Burung enggang badak, dengan tanduk jingganya, ialah burung negeri Sarawak.' },
  { id: 'monsoon', name: 'Two monsoons', bmName: 'Dua monsun', icon: '🌧️', wiki: 'Monsoon',
    text: 'Malaysia is hot and wet all year, with no winter. From about November to March, the northeast monsoon brings heavy rain to the east coast.',
    bm: 'Malaysia panas dan lembap sepanjang tahun, tanpa musim sejuk. Dari kira-kira November hingga Mac, monsun timur laut membawa hujan lebat ke pantai timur.' },
  { id: 'kancil', name: 'The mouse-deer', bmName: 'Kancil', icon: '🦌', wiki: 'Lesser mouse-deer',
    text: 'One of the smallest hoofed animals in the world, no bigger than a rabbit. Sang Kancil is the clever hero of many Malay folk tales.',
    bm: 'Salah satu haiwan berkuku terkecil di dunia, tidak lebih besar daripada arnab. Sang Kancil ialah wira bijak dalam banyak cerita rakyat Melayu.' }
];

/* ---------------- The living world: scenes drawn on screen ----------------
   Each biome: colours, the land, what moves (rain, snow, sand, bubbles), and animals to tap. Animals are drawn
   from emoji, so they look friendly on every device. */
export const BIOMES = {
  rainforest: {
    name: 'Malaysia’s rainforest', bmName: 'Hutan hujan Malaysia', label: 'Taman Negara and Borneo', wiki: 'Taman Negara',
    sky: ['#0E3B2E', '#1F6B4A'], fog: 'rgba(210,235,220,0.10)', particles: 'rain', sound: 'rain',
    layers: [
      { name: 'Emergent layer', bm: 'Lapisan tinggi', y: 0.16, text: 'The tallest trees poke out above the rest. The tualang tree can grow taller than 80 metres.', textBm: 'Pokok paling tinggi menjulang di atas yang lain. Pokok tualang boleh tumbuh lebih tinggi daripada 80 meter.' },
      { name: 'Canopy', bm: 'Kanopi', y: 0.36, text: 'A thick green roof of leaves where most rainforest animals live.', textBm: 'Bumbung daun hijau yang tebal tempat kebanyakan haiwan hutan hujan tinggal.' },
      { name: 'Understorey', bm: 'Lapisan bawah', y: 0.6, text: 'Dark and warm, with young trees, vines and big leaves that catch the little light that gets through.', textBm: 'Gelap dan panas, dengan pokok muda, akar menjalar dan daun besar yang menangkap sedikit cahaya.' },
      { name: 'Forest floor', bm: 'Lantai hutan', y: 0.84, text: 'Very little sunlight reaches the ground. Fallen leaves rot quickly and feed the soil.', textBm: 'Sangat sedikit cahaya matahari sampai ke tanah. Daun yang gugur cepat reput dan menyuburkan tanah.' }
    ],
    animals: [
      { e: '🐦', name: 'Rhinoceros hornbill', bm: 'Burung enggang badak', wiki: 'Rhinoceros hornbill', layer: 0, move: 'fly', text: 'Its loud honking call can be heard far across the forest.', textBm: 'Bunyinya yang kuat boleh didengar jauh merentasi hutan.' },
      { e: '🦧', name: 'Orangutan', bm: 'Orang utan', wiki: 'Bornean orangutan', layer: 1, move: 'swing', text: 'Orangutans spend most of their lives in the trees and build a new nest every night.', textBm: 'Orang utan menghabiskan kebanyakan hidup di atas pokok dan membina sarang baharu setiap malam.' },
      { e: '🐸', name: 'Wallace’s flying frog', bm: 'Katak terbang Wallace', wiki: 'Wallace\'s flying frog', layer: 1, move: 'glide', text: 'It glides from tree to tree, using its huge webbed feet like parachutes.', textBm: 'Ia meluncur dari pokok ke pokok, menggunakan kakinya yang besar dan berselaput seperti payung terjun.' },
      { e: '🦋', name: 'Rajah Brooke’s birdwing', bm: 'Kupu-kupu Raja Brooke', wiki: 'Rajah Brooke\'s birdwing', layer: 2, move: 'flutter', text: 'A big black and green butterfly. It is Malaysia’s national butterfly.', textBm: 'Kupu-kupu besar berwarna hitam dan hijau. Ia kupu-kupu kebangsaan Malaysia.' },
      { e: '🐅', name: 'Malayan tiger', bm: 'Harimau Malaya', wiki: 'Malayan tiger', layer: 3, move: 'walk', text: 'Malaysia’s national animal. Its stripes help it hide in the shadows.', textBm: 'Haiwan kebangsaan Malaysia. Belangnya membantu ia bersembunyi dalam bayang-bayang.' },
      { e: '🐘', name: 'Asian elephant', bm: 'Gajah Asia', wiki: 'Asian elephant', layer: 3, move: 'walk', text: 'Smaller than African elephants, with smaller ears. They can live for about 60 years.', textBm: 'Lebih kecil daripada gajah Afrika, dengan telinga yang lebih kecil. Ia boleh hidup kira-kira 60 tahun.' },
      { e: '🐗', name: 'Bearded pig', bm: 'Babi hutan berjanggut', wiki: 'Bornean bearded pig', layer: 3, move: 'walk', text: 'Bearded pigs travel long distances when the forest fruits are ripe.', textBm: 'Babi hutan berjanggut bergerak jauh apabila buah-buahan hutan masak.' }
    ],
    facts: [
      { text: 'Rainforests cover only a small part of the Earth, but about half of all kinds of plants and animals live in them.', bm: 'Hutan hujan meliputi sebahagian kecil Bumi, tetapi kira-kira separuh daripada semua jenis tumbuhan dan haiwan tinggal di dalamnya.' },
      { text: 'Malaysia’s rainforest gets rain almost every day: more than 2,000 millimetres a year.', bm: 'Hutan hujan Malaysia menerima hujan hampir setiap hari: lebih daripada 2,000 milimeter setahun.' },
      { text: 'Rainforest plants give us foods and medicines, and they help to clean the air we breathe.', bm: 'Tumbuhan hutan hujan memberi kita makanan dan ubat, dan membantu membersihkan udara yang kita sedut.' }
    ],
    wonders: [{ text: 'Why do you think so many animals live high up in the canopy?', bm: 'Mengapa agaknya begitu banyak haiwan tinggal tinggi di kanopi?' }, { text: 'How could we help to protect the rainforest?', bm: 'Bagaimanakah kita boleh membantu melindungi hutan hujan?' }]
  },
  savannah: {
    name: 'The savannah', label: 'Grasslands of Africa', wiki: 'Serengeti', sky: ['#F59E5B', '#FCD9A4'], ground: '#C9A35A', particles: 'dust', sound: 'wind', sun: true,
    deco: 'acacia',
    animals: [
      { e: '🦓', name: 'Zebra', wiki: 'Plains zebra', move: 'walk', text: 'Every zebra’s stripes are different, like a fingerprint.' },
      { e: '🦒', name: 'Giraffe', wiki: 'Giraffe', move: 'walk', text: 'Giraffes eat leaves from tall acacia trees, using tongues about 50 centimetres long.' },
      { e: '🐘', name: 'African elephant', wiki: 'African bush elephant', move: 'walk', text: 'The biggest land animal. Its big ears help it keep cool.' },
      { e: '🦁', name: 'Lion', wiki: 'Lion', move: 'still', text: 'Lions live in family groups called prides and can sleep for up to 20 hours a day.' },
      { e: '🦬', name: 'Wildebeest', wiki: 'Blue wildebeest', move: 'herd', text: 'Every year more than a million wildebeest walk in a huge circle following the rain and fresh grass.' }
    ],
    facts: [
      { text: 'A savannah is a hot grassland with a few trees. It has a wet season and a long dry season.' },
      { text: 'The Serengeti in Tanzania is famous for the great migration of wildebeest, zebras and gazelles.' },
      { text: 'Acacia trees have sharp thorns, but giraffes’ tough tongues can reach around them.' }
    ],
    wonders: [{ text: 'Why do you think the animals travel when the dry season comes?' }, { text: 'How do stripes help a zebra in a big herd?' }]
  },
  tundra: {
    name: 'The tundra', label: 'The frozen lands of the far north', wiki: 'Tundra', sky: ['#6F8FB8', '#D6E3F2'], ground: '#E9EEF5', particles: 'snow', sound: 'wind',
    deco: 'tundra',
    animals: [
      { e: '🦊', name: 'Arctic fox', wiki: 'Arctic fox', tint: 'white', move: 'walk', text: 'Its fur is white in winter and brown in summer, so it is always hard to see.' },
      { e: '🦌', name: 'Reindeer', wiki: 'Reindeer', move: 'herd', text: 'Reindeer, called caribou in North America, travel thousands of kilometres every year.' },
      { e: '🦉', name: 'Snowy owl', wiki: 'Snowy owl', tint: 'white', move: 'fly', text: 'Snowy owls hunt in the daytime too, because summer days in the Arctic never get dark.' },
      { e: '🐇', name: 'Arctic hare', wiki: 'Arctic hare', tint: 'white', move: 'hop', text: 'Arctic hares can stand on their back legs and hop like kangaroos.' }
    ],
    facts: [
      { text: 'Under the tundra the ground stays frozen all year round. It is called permafrost.' },
      { text: 'Hardly any trees grow on the tundra: it is too cold and windy. Mosses, lichens and tiny flowers grow instead.' },
      { text: 'In summer the sun does not set for weeks, and in winter it hardly rises at all.' }
    ],
    wonders: [{ text: 'How do you think animals keep warm on the tundra?' }]
  },
  desert: {
    name: 'The desert', label: 'Hot, dry and full of surprises', wiki: 'Sahara', sky: ['#FFB25C', '#FFE6B0'], ground: '#E8B86B', particles: 'sand', sound: 'wind', sun: true,
    deco: 'dunes',
    animals: [
      { e: '🐪', name: 'Camel', wiki: 'Dromedary', move: 'walk', text: 'A camel’s hump stores fat, not water. Camels can go for days without drinking.' },
      { e: '🦊', name: 'Fennec fox', wiki: 'Fennec fox', tint: 'sand', move: 'hop', text: 'The fennec fox’s huge ears let heat escape from its body and help it hear insects underground.' },
      { e: '🦂', name: 'Scorpion', wiki: 'Scorpion', move: 'walk', text: 'Scorpions glow blue-green under ultraviolet light!' },
      { e: '🦎', name: 'Lizard', wiki: 'Lizard', move: 'walk', text: 'Some desert lizards lift their feet in turns so they do not burn on the hot sand.' }
    ],
    facts: [
      { text: 'A desert is any place that gets very little rain. The Sahara is the biggest hot desert in the world.' },
      { text: 'Deserts can be boiling hot in the day and freezing cold at night, because there are no clouds to keep the heat in.' },
      { text: 'The biggest desert of all is Antarctica, a cold desert.' }
    ],
    wonders: [{ text: 'Why do you think many desert animals come out only at night?' }]
  },
  reef: {
    name: 'The coral reef', label: 'A city under the sea', wiki: 'Coral reef', sky: ['#0B6FA4', '#063A5E'], ground: '#E6D3A3', particles: 'bubbles', sound: 'ocean', water: true,
    deco: 'coral',
    animals: [
      { e: '🐠', name: 'Reef fish', wiki: 'Amphiprioninae', move: 'swim', text: 'Reef fish come in amazing colours. Clownfish even live safely among the stinging arms of sea anemones.' },
      { e: '🐢', name: 'Green sea turtle', wiki: 'Green sea turtle', move: 'swim', text: 'Sea turtles come back to the beach where they hatched to lay their own eggs. Sipadan in Sabah is famous for them.' },
      { e: '🐙', name: 'Octopus', wiki: 'Octopus', move: 'swim', text: 'An octopus has three hearts and can change colour in a flash.' },
      { e: '🦈', name: 'Reef shark', wiki: 'Blacktip reef shark', move: 'swim', text: 'Reef sharks keep the reef healthy by eating weak and sick fish.' },
      { e: '🐡', name: 'Pufferfish', wiki: 'Tetraodontidae', move: 'swim', text: 'When it is scared, a pufferfish gulps water and blows up like a spiky ball.' }
    ],
    facts: [
      { text: 'Coral looks like a plant, but it is made of tiny animals called polyps.' },
      { text: 'The Great Barrier Reef in Australia is the biggest coral reef system in the world.' },
      { text: 'When the sea gets too warm, corals turn white. This is called coral bleaching.' }
    ],
    wonders: [{ text: 'Why do you think so many fish are brightly coloured?' }]
  },
  polar: {
    name: 'Polar lands', label: 'The Arctic and Antarctica', wiki: 'Antarctica', sky: ['#14284D', '#5E7FB5'], ground: '#F2F6FB', particles: 'snow', sound: 'wind', stars: true,
    deco: 'ice', zones: ['The Arctic (north)', 'Antarctica (south)'],
    animals: [
      { e: '🐧', name: 'Emperor penguin', wiki: 'Emperor penguin', zone: 1, move: 'waddle', text: 'Emperor penguin dads keep the egg warm on their feet for about two months in the coldest winter.' },
      { e: '🐻‍❄️', name: 'Polar bear', wiki: 'Polar bear', zone: 0, move: 'walk', text: 'Polar bears live in the Arctic. Their skin is black under their white fur.' },
      { e: '🦭', name: 'Seal', wiki: 'Ringed seal', zone: 0, move: 'still', text: 'Seals keep warm with a thick layer of fat called blubber.' },
      { e: '🐋', name: 'Humpback whale', wiki: 'Humpback whale', zone: 1, move: 'swim', text: 'Humpback whales sing long songs that can travel for many kilometres under the sea.' }
    ],
    facts: [
      { text: 'Polar bears live in the Arctic (north) and penguins in Antarctica (south), so they never meet in the wild.' },
      { text: 'The coldest temperature ever measured on Earth was minus 89 °C, in Antarctica.' },
      { text: 'Antarctica is covered by ice that is more than 2 kilometres thick in places.' }
    ],
    wonders: [{ text: 'Why do you think polar animals are often white?' }]
  }
};

/* ---------------- Extreme weather ---------------- */
export const WEATHER = {
  hurricane: { name: 'Hurricane', icon: '🌀', facts: [
    'A hurricane is a giant spinning storm that forms over warm seas. Winds blow faster than 119 km/h.',
    'In Asia these storms are called typhoons, and in the Indian Ocean they are called cyclones.',
    'In the middle is the eye: a calm, clear circle where the wind is gentle.',
    'North of the equator, hurricanes spin anticlockwise; south of the equator they spin clockwise.'] },
  storm: { name: 'Thunderstorm', icon: '⚡', facts: [
    'Count the seconds between the flash and the thunder. Every 3 seconds means the storm is about 1 kilometre away.',
    'A bolt of lightning is hotter than the surface of the Sun.',
    'You see lightning before you hear thunder because light travels much faster than sound.',
    'When thunder roars, go indoors.'] },
  monsoon: { name: 'Monsoon', icon: '🌧️', facts: [
    'A monsoon is a change in the wind that brings a long rainy season.',
    'In Malaysia, the northeast monsoon from about November to March brings heavy rain and floods to the east coast.',
    'The southwest monsoon, from about May to September, is usually drier for Malaysia.',
    'Monsoon rain fills rivers and helps rice grow in paddy fields.'] },
  blizzard: { name: 'Blizzard', icon: '❄️', facts: [
    'A blizzard is a snowstorm with strong winds that blow the snow so you can hardly see.',
    'Snowflakes have six sides, and no two seem to be exactly alike.',
    'In a blizzard, snow can pile up into deep drifts against walls and fences.',
    'Wind makes it feel much colder than the real temperature. This is called wind chill.'] }
};

/* ---------------- Seasons ---------------- */
export const SEASON_FACTS = [
  'Seasons happen because the Earth is tilted. For half the year your part of the world leans towards the Sun.',
  'It is not because we get closer to the Sun: the Earth is actually closest to the Sun in early January!',
  'When it is summer in the UK, it is winter in Australia.',
  'Near the equator, in places like Malaysia, days are about 12 hours long all year, and there is no winter.',
  'The longest day in the UK is in June, with more than 16 hours of daylight in London.'
];

/* ---------------- Quizzes (a = the right option) ---------------- */
export const QUIZ = {
  world: [
    { q: 'Which city has the Petronas Twin Towers?', opts: ['Singapore', 'Kuala Lumpur', 'Jakarta', 'Bangkok'], a: 1 },
    { q: 'How do you say hello in Japanese?', opts: ['Ciao', 'Jambo', 'Konnichiwa', 'Olá'], a: 2 },
    { q: 'Which city is in two continents?', opts: ['Istanbul', 'Paris', 'Lima', 'Sydney'], a: 0 },
    { q: 'Where does nasi lemak come from?', opts: ['Mexico', 'Malaysia', 'Iceland', 'Kenya'], a: 1 }
  ],
  festivals: [
    { q: 'Which festival is called the festival of lights?', opts: ['Holi', 'Deepavali', 'Songkran', 'Carnival'], a: 1 },
    { q: 'At which festival do children get red packets?', opts: ['Chinese New Year', 'Christmas', 'Wesak', 'Vaisakhi'], a: 0 },
    { q: 'Gawai Dayak is a harvest festival in which state?', opts: ['Johor', 'Penang', 'Sarawak', 'Perlis'], a: 2 },
    { q: 'How many steps do people climb at Batu Caves for Thaipusam?', opts: ['72', '172', '272', '1,000'], a: 2 }
  ],
  wonders: [
    { q: 'Which ancient wonder is still standing?', opts: ['Colossus of Rhodes', 'Great Pyramid of Giza', 'Lighthouse of Alexandria', 'Statue of Zeus'], a: 1 },
    { q: 'Can you see the Great Wall of China from space with your eyes alone?', opts: ['Yes, easily', 'No, that is a myth'], a: 1 },
    { q: 'How many steps does the pyramid at Chichén Itzá have?', opts: ['100', '365', '1,000', '7'], a: 1 },
    { q: 'Which wonder was built in memory of an emperor’s wife?', opts: ['Taj Mahal', 'Colosseum', 'Petra', 'Machu Picchu'], a: 0 }
  ],
  records: [
    { q: 'Which is the fastest animal of all?', opts: ['Cheetah', 'Peregrine falcon', 'Ostrich', 'Blue whale'], a: 1 },
    { q: 'What is the biggest animal that has ever lived?', opts: ['African elephant', 'Dinosaur', 'Blue whale', 'Giraffe'], a: 2 },
    { q: 'How many bones are in a giraffe’s neck?', opts: ['Seven', 'Seventy', 'Two', 'A hundred'], a: 0 }
  ],
  malaysia: [
    { q: 'How tall is Mount Kinabalu?', opts: ['495 metres', '4,095 metres', '40,095 metres'], a: 1, bm: { q: 'Berapakah tinggi Gunung Kinabalu?', opts: ['495 meter', '4,095 meter', '40,095 meter'] } },
    { q: 'What does “orang hutan” mean?', opts: ['Red monkey', 'Person of the forest', 'Tree climber'], a: 1, bm: { q: 'Apakah maksud “orang hutan”?', opts: ['Monyet merah', 'Manusia hutan', 'Pemanjat pokok'] } },
    { q: 'Which is Malaysia’s national animal?', opts: ['Malayan tiger', 'Orangutan', 'Hornbill'], a: 0, bm: { q: 'Apakah haiwan kebangsaan Malaysia?', opts: ['Harimau Malaya', 'Orang utan', 'Burung enggang'] } },
    { q: 'Which state is the Land of the Hornbills?', opts: ['Sabah', 'Sarawak', 'Kedah'], a: 1, bm: { q: 'Negeri manakah Bumi Kenyalang?', opts: ['Sabah', 'Sarawak', 'Kedah'] } }
  ],
  seasons: [
    { q: 'Why do we have seasons?', opts: ['The Earth gets closer to the Sun', 'The Earth is tilted', 'The Sun gets hotter'], a: 1 },
    { q: 'When it is summer in the UK, what season is it in Australia?', opts: ['Summer', 'Winter', 'Spring'], a: 1 }
  ],
  weather: [
    { q: 'You see lightning and count 6 seconds before the thunder. How far away is the storm?', opts: ['About 1 km', 'About 2 km', 'About 6 km'], a: 1 },
    { q: 'What is the calm middle of a hurricane called?', opts: ['The eye', 'The heart', 'The nose'], a: 0 }
  ],
  biome: [
    { q: 'Which layer of the rainforest gets the least light?', opts: ['Emergent layer', 'Canopy', 'Forest floor'], a: 2 },
    { q: 'Where do penguins live in the wild?', opts: ['The Arctic', 'Antarctica and the southern seas', 'The Sahara'], a: 1 },
    { q: 'What is coral made of?', opts: ['Rock', 'Tiny animals', 'Seaweed'], a: 1 }
  ],
  rainforest: [
    { q: 'Which layer of the rainforest gets the least light?', opts: ['Emergent layer', 'Canopy', 'Forest floor'], a: 2, bm: { q: 'Lapisan hutan hujan yang manakah menerima cahaya paling sedikit?', opts: ['Lapisan tinggi', 'Kanopi', 'Lantai hutan'] } },
    { q: 'Where do most rainforest animals live?', opts: ['In the canopy', 'Under the ground', 'In the rivers'], a: 0, bm: { q: 'Di manakah kebanyakan haiwan hutan hujan tinggal?', opts: ['Di kanopi', 'Di bawah tanah', 'Di dalam sungai'] } },
    { q: 'Which is Malaysia’s national butterfly?', opts: ['Monarch', 'Rajah Brooke’s birdwing', 'Cabbage white'], a: 1, bm: { q: 'Apakah kupu-kupu kebangsaan Malaysia?', opts: ['Kupu-kupu raja', 'Kupu-kupu Raja Brooke', 'Kupu-kupu putih kubis'] } }
  ],
  skies: [
    { q: 'Which planet is closest to the Sun?', opts: ['Venus', 'Mercury', 'Mars'], a: 1 },
    { q: 'What colour are most northern lights?', opts: ['Green', 'Blue', 'Orange'], a: 0 },
    { q: 'Fireflies are really…', opts: ['Flies', 'Beetles', 'Moths'], a: 1 },
    { q: 'What is a big flock of starlings flying together called?', opts: ['A murmuration', 'A migration', 'A constellation'], a: 0 }
  ]
};

/* ---------------- For teachers: where the facts come from ---------------- */
export const SOURCES = {
  world: ['Wikipedia articles for each city, landmark and food (linked on each postcard)', 'Time zones: the IANA time zone database, as built into your browser',
    'The map: Earth pictures by Solar System Scope (CC BY 4.0), based on NASA imagery. Day and night are worked out from today’s date and the time now.'],
  festivals: ['Wikipedia articles for each festival', 'Tourism Malaysia: festivals calendar'],
  wonders: ['Wikipedia: Seven Wonders of the Ancient World; New 7 Wonders of the World', 'Heights are rounded; the Great Pyramid is 139 m today (147 m when built)'],
  records: ['Wikipedia articles for each animal', 'Guinness World Records', 'National Geographic Kids'],
  malaysia: ['Wikipedia articles for each place and animal', 'National Tiger Survey 2016 to 2020 (PERHILITAN), reported by WWF-Malaysia', 'Sabah Parks; Sarawak Forestry'],
  biome: ['Wikipedia articles for each biome and animal', 'National Geographic Kids; BBC Bitesize (KS2 geography and science)'],
  weather: ['Met Office: weather for schools', 'Malaysian Meteorological Department (MetMalaysia): monsoons', 'National Hurricane Center (USA): Saffir-Simpson scale'],
  seasons: ['Met Office and NASA Space Place: seasons', 'Day lengths are worked out from the Earth’s tilt for each date (to within a few minutes)'],
  skies: ['NASA Space Place and NASA Solar System Exploration', 'RSPB (starlings); National Geographic (fireflies); Met Office (the northern lights)']
};

/* ---------------- What each window says in the caption (facts, then wonder questions) ---------------- */
export const CAPTIONS = {
  explorer: {
    facts: ['The dark part of the map is having night time right now. The bright part is having day.', 'The Earth spins once every 24 hours, so night slides across the map from right to left.',
      'When it is lunchtime in Kuala Lumpur, it is early morning in London.', 'The little sun on the map shows where the Sun is right overhead. It is the middle of the day there.',
      'The map is flat but the Earth is round, so places near the poles look much bigger than they really are.'],
    wonders: ['Which city would you most like to visit? Why?', 'Where in the world are children asleep right now?', 'Which food would you like to try first?', 'Why do you think cities far apart have different times?']
  },
  festivals: {
    facts: ['Festivals bring families and friends together, often with special food, music and lights.', 'Malaysia has public holidays for festivals from many cultures, such as Hari Raya, Chinese New Year, Deepavali, Wesak and Christmas. Sarawak celebrates Gawai and Sabah celebrates Kaamatan.',
      'Many festivals follow the Moon, so their dates change from year to year.', 'Lots of festivals celebrate light: Deepavali, Hanukkah, Christmas and the Mid-Autumn Festival all have lamps, candles or lanterns.'],
    wonders: ['Which festival does your family celebrate? What is your favourite part?', 'Why do you think so many festivals have special food?', 'If you could invent a new festival, what would it celebrate?']
  },
  wonders: {
    facts: ['The Seven Wonders of the Ancient World were listed by travellers in ancient Greece more than 2,000 years ago.', 'Only one ancient wonder is still standing: the Great Pyramid of Giza. The others are drawn here as they may have looked when they were new.',
      'Tap the picture: the pyramid gets its shining white casing back, Zeus throws a lightning bolt, a beacon is lit on the Great Wall, and the Taj Mahal changes colour with the time of day.',
      'In 2007, millions of people around the world voted for the New Seven Wonders.', 'The tiny people in each picture are drawn to the right size, so you can see how big the wonders really are.', 'Tap “How tall?” to see the wonders next to Big Ben’s tower, a bus and you!'],
    wonders: ['If you could visit one wonder, which would it be?', 'How do you think people built the pyramids without machines?', 'What would you choose as a wonder of Malaysia?']
  },
  records: {
    facts: ['Record-breaking animals have bodies built for their way of life.', 'The blue whale is heavier than any dinosaur we know of.', 'The cheetah is the fastest on land, but it gets tired after a short sprint.',
      'Tap “Speed race” to race a falcon, a cheetah, a car, a snail and a fast runner from Year 5!'],
    wonders: ['Which record breaker would you like to be for a day?', 'Why do you think the cheetah can only run fast for a short time?', 'How could we measure how fast you can run?']
  },
  malaysia: {
    facts: [{ text: 'Malaysia is one of the world’s 17 “megadiverse” countries: it is home to a huge number of kinds of plants and animals.', bm: 'Malaysia ialah salah satu daripada 17 negara “megabiodiversiti” di dunia: ia menjadi rumah kepada sangat banyak jenis tumbuhan dan haiwan.' },
      { text: 'Malaysia has two parts: Peninsular Malaysia, and Sabah and Sarawak on the island of Borneo.', bm: 'Malaysia terdiri daripada dua bahagian: Semenanjung Malaysia, serta Sabah dan Sarawak di pulau Borneo.' },
      { text: 'Borneo is the third biggest island in the world.', bm: 'Borneo ialah pulau ketiga terbesar di dunia.' }],
    wonders: [{ text: 'Which wonder of Malaysia would you like to visit?', bm: 'Keajaiban Malaysia yang manakah ingin anda lawati?' }, { text: 'How can we help to protect Malaysia’s animals?', bm: 'Bagaimanakah kita boleh membantu melindungi haiwan Malaysia?' }]
  },
  seasons: {
    facts: SEASON_FACTS,
    wonders: ['What season is it in the UK today? And in Australia?', 'Why do you think Malaysia has no winter?', 'How would your day change if the Sun set at 4 o’clock?']
  },
  weather: {
    hurricane: ['Why do you think hurricanes only start over warm seas?', 'What do you think it is like inside the eye?'],
    storm: ['Count with me after the next flash! How far away is the storm?', 'Why do we see the lightning before we hear the thunder?'],
    monsoon: ['How do you think the monsoon changes life on the east coast?', 'What would you do on a very rainy day?'],
    blizzard: ['What would you wear to go out in a blizzard?', 'Why does the wind make it feel colder?']
  }
};

/* ---------------- Speed race and "How big?" ---------------- */
export const RACE = [
  { name: 'Peregrine falcon, diving', e: '🦅', kmh: 300, say: 'over 300 km/h' },
  { name: 'A car on the motorway', e: '🚗', kmh: 110, say: 'about 110 km/h' },
  { name: 'Cheetah', e: '🐆', kmh: 100, say: 'about 100 km/h' },
  { name: 'Ostrich', e: '🪶', kmh: 70, say: 'about 70 km/h' },
  { name: 'Usain Bolt, the fastest person ever', e: '🏃', kmh: 44, say: 'about 44 km/h' },
  { name: 'A fast runner in Year 5', e: '🧒', kmh: 20, say: 'about 20 km/h' },
  { name: 'Garden snail', e: '🐌', kmh: 0.05, say: 'less than 0.1 km/h' }
];
export const BIG_REFS = [{ name: 'A double-decker bus', e: '🚌', m: 11, how: 'long' }, { name: 'A Year 4 pupil', e: '🧒', m: 1.3, how: 'tall' }];

/* ---------------- The monsoon on Malaysia's east coast, month by month ----------------
   rain: how wet the month is compared with the wettest (about Kuala Terengganu's monthly rainfall). */
export const MONSOON = [
  { m: 'January', s: 'ne', rain: 0.42 }, { m: 'February', s: 'ne', rain: 0.18 }, { m: 'March', s: 'ne', rain: 0.2 }, { m: 'April', s: 'inter', rain: 0.18 },
  { m: 'May', s: 'sw', rain: 0.2 }, { m: 'June', s: 'sw', rain: 0.21 }, { m: 'July', s: 'sw', rain: 0.22 }, { m: 'August', s: 'sw', rain: 0.25 },
  { m: 'September', s: 'sw', rain: 0.3 }, { m: 'October', s: 'inter', rain: 0.45 }, { m: 'November', s: 'ne', rain: 1 }, { m: 'December', s: 'ne', rain: 0.95 }
];
export const MONSOON_SEASONS = {
  ne: { name: 'Northeast monsoon', wind: 'Wind from the northeast, over the South China Sea', text: 'Heavy rain and rough seas on the east coast. Rivers can flood.' },
  inter: { name: 'Between the monsoons', wind: 'Light winds that keep changing', text: 'Hot, sunny mornings and thunderstorms in the afternoon.' },
  sw: { name: 'Southwest monsoon', wind: 'Wind from the southwest', text: 'Usually the driest time of year on the east coast.' }
};
