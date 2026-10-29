/* Drawn subject illustrations (Rabinder's point 6, "the graphic is too basic"): one small, bright, child-friendly
   scene for each KS2 subject, drawn by the site (no emoji, no picture files), used on Today, My subjects, folders
   and the calendar. subjectArt(id) returns an SVG string; every call gets its own gradient ids, so many can share
   a page. Scenes are 160 by 120 and scale to any size. */
let n = 0;
const lg = (id, a, b, x2, y2) => '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (x2 == null ? 0 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>';
const rg = (id, a, b) => '<radialGradient id="' + id + '" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></radialGradient>';
const spark = (x, y, s, o) => '<path d="M' + x + ' ' + (y - s) + 'q' + (s * 0.18) + ' ' + (s * 0.82) + ' ' + s + ' ' + s + 'q-' + (s * 0.82) + ' ' + (s * 0.18) + '-' + s + ' ' + s + 'q-' + (s * 0.18) + '-' + (s * 0.82) + '-' + s + '-' + s + 'q' + (s * 0.82) + '-' + (s * 0.18) + ' ' + s + '-' + s + 'z" fill="#fff" opacity="' + (o || 0.9) + '"/>';
const bg = (u, a, b) => '<rect width="160" height="120" rx="22" fill="url(#' + u + 'bg)"/><circle cx="128" cy="22" r="34" fill="#fff" opacity=".18"/><circle cx="22" cy="104" r="26" fill="#fff" opacity=".12"/>' +
  '<defs>' + lg(u + 'bg', a, b, 1, 1) + '</defs>';

const SCENES = {
  maths(u) {
    return bg(u, '#E7EAFF', '#C3CAFF') + '<defs>' + lg(u + 'a', '#FFB86B', '#F07B1F') + lg(u + 'b', '#7C86F2', '#4F5BD5') + rg(u + 'c', '#7FE3D8', '#1F9D93') + lg(u + 'd', '#FF8FB8', '#E2558A') + '</defs>' +
      '<path d="M44 30 72 80H16z" fill="url(#' + u + 'a)" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>' +
      '<rect x="86" y="50" width="44" height="44" rx="10" fill="url(#' + u + 'b)" stroke="#fff" stroke-width="3" transform="rotate(-8 108 72)"/>' +
      '<circle cx="104" cy="34" r="17" fill="url(#' + u + 'c)" stroke="#fff" stroke-width="3"/>' +
      '<path d="M30 94h22M41 83v22" stroke="url(#' + u + 'd)" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M134 22l12 12M146 22l-12 12" stroke="#4F5BD5" stroke-width="5" stroke-linecap="round" opacity=".8"/>' + spark(66, 18, 6) + spark(146, 96, 5, 0.8);
  },
  english(u) {
    return bg(u, '#FFE6EF', '#FBC1D5') + '<defs>' + lg(u + 'a', '#FFFFFF', '#F4F6FB') + lg(u + 'b', '#E55B8F', '#C7356F') + lg(u + 'c', '#FFD36B', '#F5A524') + '</defs>' +
      '<path d="M20 34c14-6 30-6 58 4v60c-28-10-44-10-58-4z" fill="url(#' + u + 'a)" stroke="#C7356F" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M136 34c-14-6-30-6-58 4v60c28-10 44-10 58-4z" fill="url(#' + u + 'a)" stroke="#C7356F" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M30 50c10-3 22-2 38 3M30 62c10-3 22-2 38 3M30 74c10-3 22-2 38 3M88 53c16-5 28-6 38-3M88 65c16-5 28-6 38-3M88 77c16-5 28-6 38-3" stroke="#F3A9C4" stroke-width="3" stroke-linecap="round" fill="none"/>' +
      '<g transform="rotate(38 128 40)"><rect x="121" y="8" width="14" height="56" rx="4" fill="url(#' + u + 'c)"/><path d="M121 64h14l-7 14z" fill="#FBE3B3"/><path d="M126 74h4l-2 4z" fill="#3D4852"/><rect x="121" y="8" width="14" height="9" rx="3" fill="url(#' + u + 'b)"/></g>' +
      '<text x="40" y="112" font-family="Lexend,Arial,sans-serif" font-weight="700" font-size="20" fill="#C7356F">Aa</text>' + spark(144, 104, 6) + spark(16, 18, 5, 0.8);
  },
  science(u) {
    return bg(u, '#E3F7EA', '#B5E8C8') + '<defs>' + lg(u + 'a', '#FFFFFF', '#E8F4FF') + lg(u + 'b', '#6EE7A8', '#2E9E62') + lg(u + 'c', '#7FB6FF', '#3584D6') + '</defs>' +
      '<path d="M58 18h26M64 18v26L40 92a8 8 0 0 0 7 12h48a8 8 0 0 0 7-12L78 44V18" fill="url(#' + u + 'a)" stroke="#2E7D4F" stroke-width="3.5" stroke-linejoin="round"/>' +
      '<path d="M50 74h42l11 20a5 5 0 0 1-4 7H43a5 5 0 0 1-4-7z" fill="url(#' + u + 'b)"/>' +
      '<circle cx="62" cy="86" r="4" fill="#fff" opacity=".8"/><circle cx="76" cy="80" r="2.6" fill="#fff" opacity=".8"/><circle cx="70" cy="62" r="3" fill="#6EE7A8"/><circle cx="74" cy="50" r="2" fill="#6EE7A8"/>' +
      '<g fill="none" stroke="url(#' + u + 'c)" stroke-width="3.2"><ellipse cx="122" cy="56" rx="24" ry="9"/><ellipse cx="122" cy="56" rx="24" ry="9" transform="rotate(60 122 56)"/><ellipse cx="122" cy="56" rx="24" ry="9" transform="rotate(-60 122 56)"/></g>' +
      '<circle cx="122" cy="56" r="6" fill="#F5A524"/>' +
      '<path d="M112 100c4-14 18-20 30-18-2 12-14 22-30 18z" fill="#3B9A62"/><path d="M114 98c8-6 14-9 24-13" stroke="#E3F7EA" stroke-width="2" fill="none"/>' + spark(30, 28, 6) + spark(146, 18, 5, 0.85);
  },
  computing(u) {
    return bg(u, '#FFEBDD', '#FFC9A3') + '<defs>' + lg(u + 'a', '#FFFFFF', '#E9EEF6') + lg(u + 'b', '#FF9F5A', '#C2581A') + lg(u + 'c', '#3B4A63', '#1F2937') + '</defs>' +
      '<rect x="40" y="26" width="80" height="62" rx="18" fill="url(#' + u + 'a)" stroke="#C2581A" stroke-width="3.5"/>' +
      '<rect x="52" y="38" width="56" height="34" rx="10" fill="url(#' + u + 'c)"/>' +
      '<circle cx="68" cy="54" r="5" fill="#5EEAD4"/><circle cx="92" cy="54" r="5" fill="#5EEAD4"/><path d="M70 64c6 4 14 4 20 0" stroke="#5EEAD4" stroke-width="3" stroke-linecap="round" fill="none"/>' +
      '<path d="M80 26V14" stroke="#C2581A" stroke-width="3.5" stroke-linecap="round"/><circle cx="80" cy="11" r="5" fill="url(#' + u + 'b)"/>' +
      '<rect x="30" y="48" width="10" height="22" rx="5" fill="url(#' + u + 'b)"/><rect x="120" y="48" width="10" height="22" rx="5" fill="url(#' + u + 'b)"/>' +
      '<rect x="56" y="88" width="48" height="16" rx="7" fill="url(#' + u + 'b)"/>' +
      '<text x="14" y="34" font-family="JetBrains Mono,monospace" font-weight="700" font-size="15" fill="#C2581A">&lt;/&gt;</text>' + spark(142, 96, 6) + spark(140, 20, 5, 0.85);
  },
  history(u) {
    return bg(u, '#FFF3D6', '#F8DC97') + '<defs>' + lg(u + 'a', '#E9D7B0', '#C9A86A') + lg(u + 'b', '#D9534A', '#A8322A') + lg(u + 'c', '#FFF8E6', '#F2E2B8') + '</defs>' +
      '<path d="M28 104V46h10v-10h10v10h10v-10h10v10h10v58z" fill="url(#' + u + 'a)" stroke="#9A6A00" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M48 104V80a8 8 0 0 1 16 0v24" fill="#7A5200"/><rect x="40" y="56" width="8" height="12" rx="3" fill="#7A5200"/><rect x="64" y="56" width="8" height="12" rx="3" fill="#7A5200"/>' +
      '<path d="M56 36V14" stroke="#7A5200" stroke-width="3" stroke-linecap="round"/><path d="M56 14h20l-6 6 6 6H56z" fill="url(#' + u + 'b)"/>' +
      '<g transform="rotate(-10 120 70)"><rect x="96" y="50" width="48" height="42" rx="6" fill="url(#' + u + 'c)" stroke="#9A6A00" stroke-width="3"/><circle cx="96" cy="50" r="7" fill="#E9D7B0" stroke="#9A6A00" stroke-width="3"/><circle cx="144" cy="92" r="7" fill="#E9D7B0" stroke="#9A6A00" stroke-width="3"/>' +
      '<path d="M106 62h28M106 70h28M106 78h20" stroke="#C9A86A" stroke-width="3" stroke-linecap="round"/></g>' + spark(140, 22, 6) + spark(18, 22, 5, 0.85);
  },
  geography(u) {
    return bg(u, '#E1F0FF', '#B4D6FA') + '<defs>' + rg(u + 'a', '#7FC8FF', '#2B76C6') + lg(u + 'b', '#7EDB8F', '#2E9E62') + lg(u + 'c', '#FFFFFF', '#E3ECF7') + '</defs>' +
      '<circle cx="62" cy="62" r="40" fill="url(#' + u + 'a)" stroke="#fff" stroke-width="3"/>' +
      '<path d="M40 40c8-4 18-2 22 4s-2 12 4 16 14 2 14 10-10 12-16 8-6-10-14-10-14-6-14-12 0-12 4-16z" fill="url(#' + u + 'b)"/>' +
      '<path d="M74 34c6 0 12 4 14 10s-4 6-8 4-8-4-10-8 0-6 4-6zM78 84c4-2 10 0 10 4s-6 6-10 4-4-6 0-8z" fill="url(#' + u + 'b)"/>' +
      '<ellipse cx="50" cy="44" rx="10" ry="5" fill="#fff" opacity=".35" transform="rotate(-25 50 44)"/>' +
      '<circle cx="122" cy="70" r="24" fill="url(#' + u + 'c)" stroke="#2B76C6" stroke-width="3"/><path d="M122 52l6 18-6 18-6-18z" fill="#D9534A"/><path d="M122 70l6 0-6 18-6-18z" fill="#2B76C6"/><circle cx="122" cy="70" r="3" fill="#fff"/>' +
      spark(140, 28, 6) + spark(24, 104, 5, 0.85);
  },
  art(u) {
    return bg(u, '#F3E6FF', '#DDC2F7') + '<defs>' + lg(u + 'a', '#FFF4DE', '#F2D9AE') + lg(u + 'b', '#B57A3F', '#7A4B1E') + '</defs>' +
      '<path d="M78 22c-34 0-58 20-58 44 0 18 14 30 28 30 8 0 10-6 10-10 0-6-4-8-4-12 0-5 4-8 9-8h14c19 0 31-12 31-27 0-10-12-17-30-17z" fill="url(#' + u + 'a)" stroke="#8B44C2" stroke-width="3"/>' +
      '<circle cx="46" cy="58" r="8" fill="#E2558A"/><circle cx="58" cy="38" r="8" fill="#F5A524"/><circle cx="82" cy="34" r="8" fill="#3B9A62"/><circle cx="102" cy="46" r="8" fill="#3584D6"/><circle cx="40" cy="78" r="6" fill="#8B44C2"/>' +
      '<g transform="rotate(-42 124 74)"><rect x="118" y="34" width="10" height="56" rx="4" fill="url(#' + u + 'b)"/><rect x="117" y="86" width="12" height="9" rx="2" fill="#C9CFD8"/><path d="M117 95h12c0 10-2 18-6 22-4-4-6-12-6-22z" fill="#E2558A"/></g>' +
      spark(140, 22, 6) + spark(138, 104, 5, 0.85);
  },
  dt(u) {
    return bg(u, '#E6EDF2', '#C6D3DD') + '<defs>' + lg(u + 'a', '#8FA3B4', '#4B6475') + lg(u + 'b', '#FFC46B', '#E08A1E') + '</defs>' +
      '<g transform="translate(58 58)"><path d="M-6-34h12l2 9 8 4 8-5 9 9-5 8 3 8 10 2v12l-10 2-3 8 5 8-9 9-8-5-8 4-2 9h-12l-2-9-8-4-8 5-9-9 5-8-3-8-10-2v-12l10-2 3-8-5-8 9-9 8 5 8-4z" fill="url(#' + u + 'a)"/><circle r="11" fill="#E6EDF2"/></g>' +
      '<g transform="translate(112 74) scale(.62)"><path d="M-6-34h12l2 9 8 4 8-5 9 9-5 8 3 8 10 2v12l-10 2-3 8 5 8-9 9-8-5-8 4-2 9h-12l-2-9-8-4-8 5-9-9 5-8-3-8-10-2v-12l10-2 3-8-5-8 9-9 8 5 8-4z" fill="url(#' + u + 'b)"/><circle r="11" fill="#E6EDF2"/></g>' +
      '<rect x="18" y="98" width="70" height="12" rx="3" fill="url(#' + u + 'b)"/><path d="M26 98v5M34 98v8M42 98v5M50 98v8M58 98v5M66 98v8M74 98v5" stroke="#7A4B1E" stroke-width="2"/>' +
      spark(142, 22, 6) + spark(20, 22, 5, 0.85);
  },
  music(u) {
    return bg(u, '#FBE3F4', '#F0BFE2') + '<defs>' + lg(u + 'a', '#C65BB4', '#8E2F7E') + lg(u + 'b', '#FFD36B', '#F5A524') + '</defs>' +
      '<path d="M52 82V30l52-10v52" stroke="url(#' + u + 'a)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M52 40l52-10" stroke="url(#' + u + 'a)" stroke-width="7" stroke-linecap="round"/>' +
      '<ellipse cx="42" cy="84" rx="13" ry="10" fill="url(#' + u + 'a)" transform="rotate(-18 42 84)"/><ellipse cx="94" cy="74" rx="13" ry="10" fill="url(#' + u + 'a)" transform="rotate(-18 94 74)"/>' +
      '<path d="M122 52v34" stroke="url(#' + u + 'b)" stroke-width="5" stroke-linecap="round"/><ellipse cx="114" cy="88" rx="10" ry="8" fill="url(#' + u + 'b)" transform="rotate(-18 114 88)"/><path d="M122 52c8 2 12 8 10 16" stroke="url(#' + u + 'b)" stroke-width="5" stroke-linecap="round" fill="none"/>' +
      '<path d="M20 30q6-6 12 0t12 0M120 24q6-6 12 0t12 0" stroke="#A63E91" stroke-width="3" stroke-linecap="round" fill="none" opacity=".6"/>' + spark(146, 100, 6) + spark(24, 104, 5, 0.85);
  },
  pe(u) {
    return bg(u, '#DDF6FA', '#AEE6EF') + '<defs>' + rg(u + 'a', '#FFFFFF', '#DDE3EA') + lg(u + 'b', '#FF9F5A', '#E8641A') + lg(u + 'c', '#FFD36B', '#E9A21B') + '</defs>' +
      '<circle cx="58" cy="64" r="34" fill="url(#' + u + 'a)" stroke="#0B7F99" stroke-width="3"/>' +
      '<path d="M58 46l14 10-5 16H49l-5-16z" fill="#1F2937"/><path d="M58 46V32M72 56l12-4M67 72l8 12M49 72l-8 12M44 56l-12-4" stroke="#1F2937" stroke-width="3"/>' +
      '<path d="M108 100l12-46 12 46z" fill="url(#' + u + 'b)"/><rect x="102" y="98" width="36" height="8" rx="3" fill="#C2581A"/><path d="M112 84h16M116 70h8" stroke="#fff" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M118 22h16l-3 14h-10z" fill="url(#' + u + 'c)"/><circle cx="126" cy="20" r="6" fill="url(#' + u + 'c)"/>' + spark(26, 24, 6) + spark(146, 54, 5, 0.85);
  },
  pshe(u) {
    return bg(u, '#FFE6EA', '#FBC2CC') + '<defs>' + lg(u + 'a', '#FF8FA3', '#E0457B') + lg(u + 'b', '#FFC1A1', '#F07B5A') + lg(u + 'c', '#FFFFFF', '#F2F4F8') + '</defs>' +
      '<path d="M52 98C26 80 18 66 18 52c0-12 9-20 19-20 7 0 12 4 15 9 3-5 8-9 15-9 10 0 19 8 19 20 0 14-8 28-34 46z" fill="url(#' + u + 'a)" stroke="#fff" stroke-width="3"/>' +
      '<path d="M92 84C74 72 68 62 68 52c0-8 6-14 13-14 5 0 9 3 11 7 2-4 6-7 11-7 7 0 13 6 13 14 0 10-6 20-24 32z" fill="url(#' + u + 'b)" stroke="#fff" stroke-width="3"/>' +
      '<rect x="108" y="18" width="40" height="30" rx="12" fill="url(#' + u + 'c)" stroke="#D4566F" stroke-width="3"/><path d="M118 48l-4 10 12-10" fill="url(#' + u + 'c)" stroke="#D4566F" stroke-width="3" stroke-linejoin="round"/>' +
      '<circle cx="120" cy="33" r="2.6" fill="#D4566F"/><circle cx="128" cy="33" r="2.6" fill="#D4566F"/><circle cx="136" cy="33" r="2.6" fill="#D4566F"/>' +
      '<ellipse cx="38" cy="50" rx="6" ry="4" fill="#fff" opacity=".45" transform="rotate(-30 38 50)"/>' + spark(146, 100, 6) + spark(118, 104, 4, 0.8);
  },
  re(u) {
    return bg(u, '#F4EFD9', '#E2D6A6') + '<defs>' + rg(u + 'a', '#FFF4B8', '#F5A524') + lg(u + 'b', '#B58A3C', '#6B5B2E') + lg(u + 'c', '#FFE08A', '#F5B324') + '</defs>' +
      '<circle cx="80" cy="56" r="40" fill="url(#' + u + 'a)" opacity=".45"/>' +
      '<path d="M66 40h28l6 10H60z" fill="url(#' + u + 'b)"/><rect x="62" y="50" width="36" height="42" rx="8" fill="url(#' + u + 'c)" stroke="#6B5B2E" stroke-width="3"/>' +
      '<path d="M80 60c6 6 6 14 0 18-6-4-6-12 0-18z" fill="#fff"/><path d="M80 65c3 3 3 8 0 10-3-2-3-7 0-10z" fill="#F07B1F"/>' +
      '<path d="M62 92h36l-4 10H66z" fill="url(#' + u + 'b)"/><path d="M80 40V28" stroke="#6B5B2E" stroke-width="3" stroke-linecap="round"/><circle cx="80" cy="26" r="4" fill="none" stroke="#6B5B2E" stroke-width="3"/>' +
      spark(28, 30, 7) + spark(132, 28, 6) + spark(140, 92, 5, 0.85) + spark(24, 92, 4, 0.8);
  },
  bm(u) {
    return bg(u, '#DDF3F1', '#A9DDD8') + '<defs>' + rg(u + 'a', '#FF7A8A', '#C8102E') + lg(u + 'b', '#3BA776', '#1F7A55') + '</defs>' +
      '<path d="M62 104c4-20 2-34-6-48" stroke="url(#' + u + 'b)" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M58 84c-14-2-22 4-26 12 12 2 22-2 26-12z" fill="url(#' + u + 'b)"/>' +
      '<g transform="translate(58 46)">' + [0, 72, 144, 216, 288].map((a) => '<path d="M0 0c-10-10-12-26-2-32 6-4 12 0 14 6 4 10-2 20-12 26z" fill="url(#' + u + 'a)" transform="rotate(' + a + ')"/>').join('') +
      '<circle r="6" fill="#FFD36B"/><path d="M0 0 18-18" stroke="#FFD36B" stroke-width="3" stroke-linecap="round"/><circle cx="18" cy="-18" r="3" fill="#FFD36B"/></g>' +
      '<text x="98" y="78" font-family="Lexend,Arial,sans-serif" font-weight="800" font-size="30" fill="#1F7A75">Aa</text><path d="M98 88h44" stroke="#1F7A75" stroke-width="4" stroke-linecap="round" opacity=".5"/>' +
      spark(140, 24, 6) + spark(20, 22, 5, 0.85);
  },
  mandarin(u) {
    return bg(u, '#FFE3E0', '#F9B8B0') + '<defs>' + rg(u + 'a', '#FF6B5B', '#B42020') + lg(u + 'b', '#FFD36B', '#E9A21B') + '</defs>' +
      '<path d="M60 14v10" stroke="#7A1F1F" stroke-width="3"/><rect x="50" y="22" width="20" height="8" rx="3" fill="url(#' + u + 'b)"/>' +
      '<ellipse cx="60" cy="58" rx="32" ry="28" fill="url(#' + u + 'a)"/><path d="M60 30c-12 8-12 48 0 56M60 30c12 8 12 48 0 56M38 40c-4 10-4 26 0 36M82 40c4 10 4 26 0 36" stroke="#FFB4A6" stroke-width="2" fill="none" opacity=".7"/>' +
      '<rect x="50" y="84" width="20" height="8" rx="3" fill="url(#' + u + 'b)"/><path d="M56 92v14M60 92v18M64 92v14" stroke="url(#' + u + 'b)" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M100 92a34 34 0 0 1 44-44l-22 44z" fill="url(#' + u + 'b)" stroke="#B42020" stroke-width="3" stroke-linejoin="round"/><path d="M122 92l-14-30M122 92l2-34M122 92l14-24" stroke="#B42020" stroke-width="2"/>' +
      spark(26, 24, 6) + spark(140, 22, 5, 0.85);
  },
  french(u) {
    return bg(u, '#E3E7FF', '#BFC7F4') + '<defs>' + lg(u + 'a', '#7C8BD9', '#3949AB') + lg(u + 'b', '#FFD9A0', '#E9A54B') + '</defs>' +
      '<path d="M62 14 54 60l-14 46h12l10-30h12l10 30h12L82 60 74 14z" fill="url(#' + u + 'a)"/><path d="M50 60h36M56 44h24M58 76h20" stroke="#fff" stroke-width="3" opacity=".7"/>' +
      '<path d="M98 86c4-14 18-22 30-20s20 12 18 22c-8-4-12 2-20 0s-10-8-18-6-8 6-10 4z" fill="url(#' + u + 'b)" stroke="#B7791F" stroke-width="3" stroke-linejoin="round"/><path d="M110 74l4 10M122 70l2 12M134 72l-2 12" stroke="#B7791F" stroke-width="2.5" stroke-linecap="round"/>' +
      '<rect x="18" y="20" width="10" height="20" fill="#3949AB"/><rect x="28" y="20" width="10" height="20" fill="#fff"/><rect x="38" y="20" width="10" height="20" fill="#D9534A"/>' + spark(144, 24, 6) + spark(24, 100, 5, 0.85);
  },
  spanish(u) {
    return bg(u, '#FFF1D6', '#FAD48C') + '<defs>' + rg(u + 'a', '#FFE48A', '#F5A524') + lg(u + 'b', '#FF8F6B', '#D9534A') + lg(u + 'c', '#7EDB8F', '#2E9E62') + '</defs>' +
      '<circle cx="118" cy="38" r="18" fill="url(#' + u + 'a)"/><path d="M118 10v6M118 60v6M90 38h6M140 38h6M98 18l4 4M134 54l4 4M98 58l4-4M134 22l4-4" stroke="#F5A524" stroke-width="3.5" stroke-linecap="round"/>' +
      '<g transform="rotate(-24 56 70)"><ellipse cx="50" cy="52" rx="16" ry="20" fill="url(#' + u + 'b)"/><path d="M40 46q10 6 20 0M40 58q10 6 20 0" stroke="#FFD36B" stroke-width="3" fill="none"/><rect x="47" y="70" width="6" height="30" rx="3" fill="#7A4B1E"/></g>' +
      '<g transform="rotate(18 88 80)"><ellipse cx="88" cy="66" rx="14" ry="18" fill="url(#' + u + 'c)"/><path d="M80 60q8 5 16 0M80 70q8 5 16 0" stroke="#FFD36B" stroke-width="3" fill="none"/><rect x="85" y="82" width="6" height="26" rx="3" fill="#7A4B1E"/></g>' +
      spark(24, 22, 6) + spark(144, 96, 5, 0.85);
  },
  general(u) {
    return bg(u, '#EAE8FF', '#CBC6FF') + '<defs>' + rg(u + 'a', '#FFF4B8', '#F5B324') + lg(u + 'b', '#9C95FF', '#5B52E6') + '</defs>' +
      '<circle cx="62" cy="54" r="30" fill="url(#' + u + 'a)" opacity=".35"/><path d="M62 26a22 22 0 0 0-12 40c3 2 4 5 4 8h16c0-3 1-6 4-8a22 22 0 0 0-12-40z" fill="url(#' + u + 'a)" stroke="#B26A00" stroke-width="3"/>' +
      '<rect x="54" y="78" width="16" height="6" rx="2" fill="#8E98A8"/><rect x="56" y="86" width="12" height="6" rx="2" fill="#8E98A8"/><path d="M56 48l6 8 6-8" stroke="#B26A00" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M118 40l7 14 15 2-11 10 3 15-14-8-14 8 3-15-11-10 15-2z" fill="url(#' + u + 'b)" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>' +
      spark(30, 98, 6) + spark(140, 100, 5, 0.85) + spark(22, 24, 4, 0.8);
  }
};
export const ART_IDS = Object.keys(SCENES);
/* The scene for a subject id (or 'general'). o: { label } adds an accessible name; otherwise it is decorative. */
export function subjectArt(id, o) {
  const draw = SCENES[id] || SCENES.general;
  const u = 'sa' + (++n) + '_';
  const label = o && o.label;
  return '<svg class="sart" viewBox="0 0 160 120" ' + (label ? 'role="img" aria-label="' + String(label).replace(/"/g, '&quot;') + '"' : 'aria-hidden="true" focusable="false"') + '>' + draw(u) + '</svg>';
}
