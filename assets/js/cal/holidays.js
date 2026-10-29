/* Malaysian public holidays for Perak (Ipoh is in Perak): the federal holidays plus Perak's own state holidays.
   Only dates checked against official lists are here. Dates marked `change: true` are "Tertakluk kepada perubahan"
   (subject to change) in the official list: Islamic holidays can move by a day when the new moon is sighted.
   Replacement days are not in the official tables; they come from the law itself and are worked out below: Holidays
   Act 1951 (Act 369), section 3 — when a public holiday falls on the weekly holiday (Sunday in Perak), the next day is
   a public holiday, and if that day is already one, the day after it.

   Sources (checked 29 October 2026):
   - Akta Hari Kelepasan 1951 (Akta 369), seksyen 3 (Jabatan Tenaga Kerja Semenanjung Malaysia):
     https://jtksm.mohr.gov.my/sites/default/files/2023-06/Akta%20369%20-%20Akta%20Hari%20Kelepasan%201951.pdf
     (an example in practice, RTM: Federal Territory Day on Sunday 1 February 2026, replacement on 2 February:
     https://berita.rtm.gov.my/?p=316676)
   - Federal 2026: Bahagian Kabinet, Perlembagaan dan Perhubungan Antara Kerajaan (JPM), "Jadual Hari Kelepasan Am
     Persekutuan 2026": https://www.kabinet.gov.my/storage/2025/08/HKA-2026.pdf
   - 20 March 2026, an extra holiday for Peninsular Malaysia because Hari Raya Puasa fell on 21 March: Warta Kerajaan
     P.U. (B) 111, 18 March 2026: https://www.kabinet.gov.my/storage/2026/03/PUB-111_2026.pdf ; Hari Raya Puasa on
     Saturday 21 March 2026 (RTM): https://berita.rtm.gov.my/nasional/senarai-berita-nasional/senarai-artikel/umat-islam-di-malaysia-sambut-aidilfitri-pada-sabtu-21-mac/
   - Perak's state holidays 2026 (Majlis Daerah Kerian, Perak): https://mdkerian.gov.my/index.php/warga-kerian/info-umum/hari-kelepasan-am-negeri-perak
   - Federal and state 2027: "Jadual Hari Kelepasan Am Persekutuan 2027": https://www.kabinet.gov.my/storage/2026/08/HKA_2027.pdf
     (Perak's four state holidays, the same four as in its 2026 list, on their 2027 dates from that table.) */
export const HOLIDAY_YEARS = [2026, 2027];
export const PUBLIC_HOLIDAYS = [
  // 2026: Perak state holidays
  { date: '2026-01-01', name: 'New Year’s Day', ms: 'Tahun Baharu', state: true },
  { date: '2026-02-01', name: 'Thaipusam', ms: 'Hari Thaipusam', state: true },
  { date: '2026-03-07', name: 'Nuzul Al-Quran', ms: 'Hari Nuzul Al-Quran', state: true },
  { date: '2026-11-06', name: 'Birthday of the Sultan of Perak', ms: 'Hari Keputeraan Sultan Perak', state: true },
  // 2026: federal
  { date: '2026-02-17', name: 'Chinese New Year', ms: 'Tahun Baharu Cina' },
  { date: '2026-02-18', name: 'Chinese New Year (second day)', ms: 'Tahun Baharu Cina (Hari Kedua)' },
  { date: '2026-03-20', name: 'Hari Raya Puasa holiday', ms: 'Cuti tambahan Hari Raya Puasa' },
  { date: '2026-03-21', name: 'Hari Raya Puasa', ms: 'Hari Raya Puasa', change: true },
  { date: '2026-03-22', name: 'Hari Raya Puasa (second day)', ms: 'Hari Raya Puasa (Hari Kedua)', change: true },
  { date: '2026-05-01', name: 'Labour Day', ms: 'Hari Pekerja' },
  { date: '2026-05-27', name: 'Hari Raya Haji', ms: 'Hari Raya Qurban', change: true },
  { date: '2026-05-28', name: 'Hari Raya Haji (second day)', ms: 'Hari Raya Qurban (Hari Kedua)', change: true },
  { date: '2026-05-31', name: 'Wesak Day', ms: 'Hari Wesak' },
  { date: '2026-06-01', name: 'Birthday of the Yang di-Pertuan Agong', ms: 'Hari Keputeraan Seri Paduka Baginda Yang di-Pertuan Agong' },
  { date: '2026-06-17', name: 'Awal Muharram (Maal Hijrah)', ms: 'Awal Muharam (Maal Hijrah)' },
  { date: '2026-08-25', name: 'Prophet Muhammad’s Birthday', ms: 'Maulidur Rasul' },
  { date: '2026-08-31', name: 'National Day', ms: 'Hari Kebangsaan' },
  { date: '2026-09-16', name: 'Malaysia Day', ms: 'Hari Malaysia' },
  { date: '2026-11-08', name: 'Deepavali', ms: 'Hari Deepavali', change: true },
  { date: '2026-12-25', name: 'Christmas Day', ms: 'Hari Krismas' },
  // 2027: Perak state holidays
  { date: '2027-01-01', name: 'New Year’s Day', ms: 'Tahun Baharu', state: true },
  { date: '2027-01-22', name: 'Thaipusam', ms: 'Hari Thaipusam', state: true },
  { date: '2027-02-24', name: 'Nuzul Al-Quran', ms: 'Hari Nuzul Al-Quran', state: true },
  { date: '2027-11-05', name: 'Birthday of the Sultan of Perak', ms: 'Hari Keputeraan Sultan Perak', state: true },
  // 2027: federal
  { date: '2027-02-06', name: 'Chinese New Year', ms: 'Tahun Baharu Cina' },
  { date: '2027-02-07', name: 'Chinese New Year (second day)', ms: 'Tahun Baharu Cina (Hari Kedua)' },
  { date: '2027-03-10', name: 'Hari Raya Puasa', ms: 'Hari Raya Puasa', change: true },
  { date: '2027-03-11', name: 'Hari Raya Puasa (second day)', ms: 'Hari Raya Puasa (Hari Kedua)', change: true },
  { date: '2027-05-01', name: 'Labour Day', ms: 'Hari Pekerja' },
  { date: '2027-05-17', name: 'Hari Raya Haji', ms: 'Hari Raya Qurban', change: true },
  { date: '2027-05-18', name: 'Hari Raya Haji (second day)', ms: 'Hari Raya Qurban (Hari Kedua)', change: true },
  { date: '2027-05-20', name: 'Wesak Day', ms: 'Hari Wesak' },
  { date: '2027-06-06', name: 'Awal Muharram (Maal Hijrah)', ms: 'Awal Muharam (Maal Hijrah)' },
  { date: '2027-06-07', name: 'Birthday of the Yang di-Pertuan Agong', ms: 'Hari Keputeraan Seri Paduka Baginda Yang di-Pertuan Agong' },
  { date: '2027-08-15', name: 'Prophet Muhammad’s Birthday', ms: 'Maulidur Rasul' },
  { date: '2027-08-31', name: 'National Day', ms: 'Hari Kebangsaan' },
  { date: '2027-09-16', name: 'Malaysia Day', ms: 'Hari Malaysia' },
  { date: '2027-10-28', name: 'Deepavali', ms: 'Hari Deepavali', change: true },
  { date: '2027-12-25', name: 'Christmas Day', ms: 'Hari Krismas' }
].sort((a, b) => (a.date < b.date ? -1 : 1));
/* Act 369, s. 3, for Perak (weekly holiday: Sunday). */
const nextDay = (s) => { const t = new Date(s + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + 1); return t.toISOString().slice(0, 10); };
const base = (s) => s.replace(/\s*\([^)]*\)$/, '');
(function addReplacements() {
  const taken = new Set(PUBLIC_HOLIDAYS.map((h) => h.date)), extra = [];
  PUBLIC_HOLIDAYS.forEach((h) => {
    if (new Date(h.date + 'T12:00:00Z').getUTCDay() !== 0) return;
    let d = nextDay(h.date);
    while (taken.has(d)) d = nextDay(d);
    taken.add(d);
    extra.push({ date: d, name: base(h.name) + ' (replacement holiday)', ms: 'Cuti gantian ' + base(h.ms), state: !!h.state, change: !!h.change, replacement: true, for: h.date });
  });
  PUBLIC_HOLIDAYS.push(...extra);
  PUBLIC_HOLIDAYS.sort((a, b) => (a.date < b.date ? -1 : 1));
})();
const BY_DATE = new Map();
PUBLIC_HOLIDAYS.forEach((h) => { const l = BY_DATE.get(h.date) || []; l.push(h); BY_DATE.set(h.date, l); });
export const publicHolidaysOn = (date) => BY_DATE.get(date) || [];
