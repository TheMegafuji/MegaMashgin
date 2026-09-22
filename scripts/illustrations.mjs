import { mkdir, writeFile } from 'node:fs/promises';
const wrap = (bg, food) =>
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280"><defs><filter id="s" x="-50%" y="-50%" width="200%" height="220%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#514629" flood-opacity=".13"/></filter><linearGradient id="glass" x1="0" x2="1"><stop stop-color="#ffffff" stop-opacity=".75"/><stop offset=".35" stop-color="#ffffff" stop-opacity=".13"/><stop offset="1" stop-color="#ffffff" stop-opacity=".45"/></linearGradient></defs><rect width="400" height="280" fill="' +
  bg +
  '"/><ellipse cx="200" cy="232" rx="109" ry="16" fill="#65552a" opacity=".06"/>' +
  food +
  '</svg>';
const leaf = (x, y, rotation, color = '#517945', scale = 1) =>
  '<path d="M0 0 Q-22 -30 0 -49 Q22 -30 0 0 M0 -4 V-40" transform="translate(' +
  x +
  ' ' +
  y +
  ') rotate(' +
  rotation +
  ') scale(' +
  scale +
  ')" fill="' +
  color +
  '" stroke="#fff" stroke-opacity=".18" stroke-width="1"/>';
const plate =
  '<ellipse cx="200" cy="155" rx="138" ry="100" fill="#fffdfa" filter="url(#s)"/><ellipse cx="200" cy="155" rx="120" ry="83" fill="#f3f1e7"/><ellipse cx="200" cy="155" rx="109" ry="75" fill="#f9f8ee"/>';
const seed = (n, cx, cy, rx, ry, color) =>
  Array.from({ length: n }, (_, i) => {
    const angle = i * 2.399963;
    const radius = Math.sqrt((i + 0.5) / n);
    return (
      '<ellipse cx="' +
      (cx + Math.cos(angle) * radius * rx).toFixed(1) +
      '" cy="' +
      (cy + Math.sin(angle) * radius * ry).toFixed(1) +
      '" rx="2" ry="1" transform="rotate(' +
      ((i * 27) % 180) +
      ' ' +
      cx +
      ' ' +
      cy +
      ')" fill="' +
      color +
      '" opacity=".6"/>'
    );
  }).join('');
const images = {};
images.focaccia = wrap(
  '#e9eadc',
  plate +
    '<g transform="rotate(-13 200 150)" filter="url(#s)"><path d="M105 109 Q105 95 126 94 L278 101 Q297 105 296 125 L291 188 Q283 205 261 201 L116 188 Q99 184 102 167Z" fill="#b77534"/><path d="M105 151 L294 160 L292 180 Q242 199 108 179Z" fill="#689143"/><path d="M110 143 Q180 160 292 150 L287 176 Q176 169 109 175Z" fill="#f8ead1"/><path d="M101 109 Q106 88 130 89 L277 97 Q306 102 297 136 L291 157 Q208 174 103 148Z" fill="#deb26b"/><path d="M113 110 Q205 99 285 116" stroke="#edcf94" stroke-width="8" fill="none" stroke-linecap="round"/>' +
    seed(34, 201, 127, 82, 26, '#976132') +
    leaf(168, 116, 45, '#4f7440', 0.48) +
    leaf(225, 140, 100, '#607b42', 0.42) +
    '<circle cx="168" cy="169" r="12" fill="#b84831"/><circle cx="242" cy="173" r="11" fill="#c55233"/></g>' +
    leaf(99, 209, -35, '#70855b', 0.7),
);
images.club = wrap(
  '#eee3d0',
  plate +
    '<g transform="rotate(8 200 160)" filter="url(#s)"><path d="M102 105 L283 146 L154 214Z" fill="#9e6739"/><path d="M103 95 L285 137 L154 204Z" fill="#d7a056"/><path d="M106 115 L155 194 L282 136 L155 180Z" fill="#557a3c"/><path d="M109 119 L155 186 L267 141 L159 177Z" fill="#eec878"/><path d="M111 121 L154 170 L273 133 L159 160Z" fill="#f1dcba"/><path d="M107 96 L279 134 L153 174Z" fill="#e8c893"/><path d="M113 99 L270 135 L157 167Z" fill="#f4dfb5"/>' +
    seed(30, 170, 126, 42, 18, '#c18b49') +
    '<path d="M213 77 L309 98 L261 174Z" fill="#a7733c"/><path d="M213 69 L309 90 L259 163Z" fill="#eed3a3"/><path d="M218 78 L300 95 L259 153Z" fill="#f4e0b7"/><path d="M215 103 L257 166 L302 109" fill="none" stroke="#648448" stroke-width="10"/></g>' +
    leaf(113, 209, -42, '#6e8e59', 0.6),
);
images.avocado = wrap(
  '#e0e8d4',
  plate +
    '<g transform="rotate(-14 200 150)" filter="url(#s)"><path d="M127 83 Q196 60 267 93 Q287 117 263 205 Q202 229 133 201 Q106 155 127 83Z" fill="#976333"/><path d="M138 94 Q198 78 255 101 Q269 134 253 194 Q200 215 142 192 Q121 146 138 94Z" fill="#debd7d"/><path d="M143 111 Q198 86 250 113 L247 181 Q200 204 143 182Z" fill="#87a756"/>' +
    Array.from(
      { length: 7 },
      (_, i) =>
        '<path d="M' +
        (139 + i * 16) +
        ' 174 Q' +
        (112 + i * 17) +
        ' 130 ' +
        (151 + i * 15) +
        ' 107" fill="none" stroke="' +
        (i % 2 ? '#bbcb79' : '#a6bd67') +
        '" stroke-width="13" stroke-linecap="round"/>',
    ).join('') +
    '<path d="M161 135 Q180 111 202 132 M195 171 Q218 144 237 161" fill="none" stroke="#bd6971" stroke-width="4" stroke-linecap="round"/>' +
    seed(25, 200, 150, 57, 35, '#4e542a') +
    '</g>' +
    leaf(279, 207, 53, '#4f794e', 0.72),
);
const bowl = (harvest = false) => {
  let parts =
    '<circle cx="200" cy="148" r="102" fill="#fffdf7" filter="url(#s)"/><circle cx="200" cy="148" r="88" fill="#e9e5cf"/>';
  for (let i = 0; i < 16; i++) {
    let a = i * 2.4;
    parts += leaf(
      200 + Math.cos(a) * 62,
      167 + Math.sin(a) * 47,
      i * 43,
      ['#789b52', '#9db274', '#4f793b', '#a9ba75'][i % 4],
      0.85,
    );
  }
  parts += '<path d="M153 102 Q188 85 229 104 Q236 122 219 132 Q188 113 160 140Z" fill="#c9cc82"/>';
  for (let i = 0; i < 9; i++) {
    let a = i * 2.4;
    let x = 205 + Math.cos(a) * 59,
      y = 150 + Math.sin(a) * 51;
    parts += harvest
      ? '<rect x="' +
        x.toFixed(1) +
        '" y="' +
        y.toFixed(1) +
        '" width="24" height="21" rx="4" fill="#d99948" transform="rotate(' +
        i * 30 +
        ' ' +
        x +
        ' ' +
        y +
        ')"/>'
      : '<circle cx="' +
        x.toFixed(1) +
        '" cy="' +
        y.toFixed(1) +
        '" r="12" fill="#bb4d3e"/><circle cx="' +
        x.toFixed(1) +
        '" cy="' +
        y.toFixed(1) +
        '" r="8" fill="#d27250"/>';
  }
  parts += seed(40, 199, 158, 65, 51, harvest ? '#fff5d8' : '#e5d6ad');
  parts +=
    '<path d="M161 136 Q195 166 225 128 M163 173 Q205 185 242 161" stroke="#f7ebcc" stroke-width="4" fill="none" stroke-linecap="round"/>';
  return parts;
};
images.salad = wrap('#e7eadb', bowl(false));
images.harvest = wrap('#f0e1c9', bowl(true));
images.croissant = wrap(
  '#eee6d9',
  plate +
    '<g transform="rotate(-12 200 157)" filter="url(#s)"><path d="M86 140 Q120 89 163 125 Q200 81 239 117 Q289 101 315 151 Q298 177 277 178 Q284 155 264 149 Q250 193 220 193 Q198 222 170 185 Q132 196 120 155 Q102 155 111 181 Q88 169 86 140Z" fill="#c28a42"/><path d="M96 134 Q124 105 157 132 Q195 100 234 128 Q280 119 300 147 Q271 134 255 154 Q238 184 215 177 Q194 204 177 174 Q149 188 133 147 Q111 127 96 134Z" fill="#e5b86c"/><path d="M157 131 Q144 162 169 186 M179 117 Q166 158 189 194 M207 116 Q231 151 216 183 M235 127 Q258 142 249 169" stroke="#ab6d33" stroke-width="5" fill="none"/><path d="M169 132 Q181 123 190 126 M211 132 Q225 131 231 139 M134 135 L141 139" stroke="#f6d995" stroke-width="6" stroke-linecap="round" fill="none"/></g>',
);
images.cookie = wrap(
  '#e9dfd1',
  plate +
    '<g filter="url(#s)"><ellipse cx="210" cy="154" rx="80" ry="66" fill="#ad713e"/><ellipse cx="207" cy="147" rx="81" ry="65" fill="#d8a064"/>' +
    seed(80, 207, 147, 77, 61, '#b37d48') +
    Array.from({ length: 16 }, (_, i) => {
      let a = i * 2.399;
      let r = Math.sqrt((i + 0.6) / 16);
      let x = 207 + Math.cos(a) * 64 * r,
        y = 147 + Math.sin(a) * 48 * r;
      return (
        '<rect x="' +
        x.toFixed(1) +
        '" y="' +
        y.toFixed(1) +
        '" width="' +
        (9 + (i % 4)) +
        '" height="' +
        (8 + (i % 3)) +
        '" rx="2" transform="rotate(' +
        i * 37 +
        ' ' +
        x +
        ' ' +
        y +
        ')" fill="' +
        (i % 2 ? '#5e3a27' : '#75452c') +
        '"/>'
      );
    }).join('') +
    '</g><path d="M286 202 l7 2 -3 5Z M118 176l-7 4 4 5Z" fill="#c59457"/>',
);
images.yogurt = wrap(
  '#e9e0e2',
  '<g filter="url(#s)"><ellipse cx="200" cy="223" rx="58" ry="13" fill="#ccc4b7"/><path d="M143 79H257L245 216Q200 241 155 216Z" fill="#eee8df" stroke="#d6d0c3" stroke-width="2"/><path d="M151 105H249L240 208Q198 225 161 208Z" fill="#fcf8e9"/><path d="M154 145Q200 133 247 145L244 166Q200 153 157 169Z" fill="#c77377"/><ellipse cx="200" cy="84" rx="57" ry="20" fill="#faf4de"/>' +
    seed(90, 200, 83, 51, 15, '#b38954') +
    '<g fill="#74667f"><circle cx="177" cy="76" r="10"/><circle cx="208" cy="79" r="11"/><circle cx="218" cy="65" r="9"/></g><path d="M227 88 Q218 54 244 61 Q261 77 227 88Z" fill="#bf5053"/>' +
    leaf(169, 81, -38, '#6b8752', 0.55) +
    '<path d="M160 100 L167 192" stroke="#fff" stroke-opacity=".8" stroke-width="6" stroke-linecap="round"/></g>',
);
function drink(fill, top, bg, kind) {
  let decoration = '';
  if (kind === 'citrus')
    decoration =
      '<g transform="translate(237 102) rotate(20)"><circle r="28" fill="#eab262"/><circle r="23" fill="#fbe3a2"/><circle r="19" fill="#edc079"/><path d="M-18 0H18M0-18V18M-13-13L13 13M13-13L-13 13" stroke="#fff0ba" stroke-width="2"/></g>';
  if (kind === 'latte')
    decoration =
      '<path d="M159 129Q192 115 240 138V158Q199 142 162 158Z" fill="#c79664"/><path d="M165 163Q195 148 238 170" fill="none" stroke="#e7d1a1" stroke-width="9"/>';
  return wrap(
    bg,
    '<g filter="url(#s)"><path d="M148 76H252L239 215Q200 235 161 215Z" fill="' +
      fill +
      '" stroke="#d2cab3" stroke-width="2"/><ellipse cx="200" cy="77" rx="52" ry="15" fill="' +
      top +
      '"/>' +
      decoration +
      '<g fill="#fff" fill-opacity=".36" stroke="#fff" stroke-opacity=".4"><rect x="166" y="89" width="23" height="21" rx="4" transform="rotate(-9 176 98)"/><rect x="203" y="97" width="25" height="20" rx="4" transform="rotate(14 213 107)"/><rect x="188" y="76" width="22" height="20" rx="4"/></g><path d="M148 76H252L239 215Q200 235 161 215Z" fill="url(#glass)"/><path d="M219 110 L232 42 L256 35" stroke="#71876c" stroke-width="7" fill="none" stroke-linejoin="round"/><path d="M159 96L170 204" stroke="#fff" stroke-opacity=".65" stroke-width="5" stroke-linecap="round"/></g>' +
      (kind === 'citrus' ? leaf(117, 205, -31, '#6b8b58', 0.85) : ''),
  );
}
images.latte = drink('#d6b586', '#9b6b47', '#e6dfd1', 'latte');
images.citrus = drink('#eacb80', '#eddbaa', '#f0e8cb', 'citrus');
images.matcha = drink('#a9ba7a', '#9bae72', '#e5e9d8', 'matcha');
images.water = wrap(
  '#dfe8e7',
  '<g filter="url(#s)"><path d="M181 63H219V78Q242 87 242 111V218Q200 238 158 218V111Q158 87 181 78Z" fill="#b6d0ca" stroke="#a5beba" stroke-width="2"/><path d="M166 118H234V215Q200 230 166 215Z" fill="#d5e3dc"/><rect x="178" y="47" width="44" height="24" rx="6" fill="#6e958b"/><path d="M185 51V64M194 51V64M203 51V64M212 51V64" stroke="#95b4a8" stroke-width="2"/><path d="M158 130Q200 144 242 130V183Q200 197 158 183Z" fill="#f3f2e7"/><path d="M184 162Q197 144 204 155T222 157" stroke="#618979" stroke-width="3" fill="none"/><circle cx="180" cy="160" r="3" fill="#618979"/><path d="M170 109V121M170 194V214" stroke="#fff" stroke-opacity=".7" stroke-width="5" stroke-linecap="round"/></g>',
);
await mkdir('public/food', { recursive: true });
for (const [name, svg] of Object.entries(images))
  await writeFile('public/food/' + name + '.svg', svg + '\n');
console.log('12 original, deterministic SVG menu illustrations generated.');
