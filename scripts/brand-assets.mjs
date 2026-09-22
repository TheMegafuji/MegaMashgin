import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const dir = 'public/brand';
await mkdir(dir, { recursive: true });
const mark =
  '<rect width="96" height="96" rx="24" fill="#e4f222"/><g fill="none" stroke="#171717" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M23 34V23h13M60 23h13v11M73 61v12H60M36 73H23V61"/><path d="M34 59V38l14 14 14-14v21"/></g>';
const symbol =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><title>Mashgin Market concept monogram</title>' +
  mark +
  '</svg>';
await writeFile(dir + '/symbol.svg', symbol);
await writeFile('public/favicon.svg', symbol);
for (const [name, ink, bg] of [
  ['wordmark', '#171717', 'none'],
  ['wordmark-light', '#f4f2f0', '#171717'],
]) {
  await writeFile(
    dir + '/' + name + '.svg',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 160"><title>Mashgin Market — concept by Megafuji</title><rect width="720" height="160" rx="18" fill="' +
      bg +
      '"/><g transform="translate(24 32)">' +
      mark +
      '</g><g fill="' +
      ink +
      '" font-family="Arial,sans-serif"><text x="148" y="89" font-size="54" font-weight="800" letter-spacing="-2">mashgin market</text><text x="150" y="123" font-size="11" font-weight="600" letter-spacing="2">INDEPENDENT CONCEPT / MEGAFUJI</text></g></svg>',
  );
}
const data = async (path) =>
  'data:' +
  (path.endsWith('.svg') ? 'image/svg+xml' : 'image/png') +
  ';base64,' +
  (await readFile(path)).toString('base64');
const coffee = await data('public/drinks/oat-latte.svg'),
  burger = await data('public/food-kit/burger-cheese.png'),
  snack = await data('public/market/sea-salt-chips.svg');
function squarePoster(width) {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    width +
    '" height="' +
    width +
    '" viewBox="0 0 1200 1200"><title>Mashgin Market concept by Megafuji</title>' +
    '<rect width="1200" height="1200" fill="#f4f2f0"/>' +
    '<g transform="translate(64 48) scale(.68)">' +
    mark +
    '</g>' +
    '<text x="151" y="92" fill="#171717" font-family="Arial,sans-serif" font-size="34" font-weight="800" letter-spacing="-1">mashgin market</text>' +
    '<text x="66" y="196" fill="#65694f" font-family="Arial,sans-serif" font-size="15" font-weight="600" letter-spacing="2.8">A MEGAFUJI CHECKOUT CONCEPT</text>' +
    '<g fill="#171717" font-family="Arial,sans-serif" font-size="99" font-weight="800" letter-spacing="-5"><text x="60" y="314">Good things.</text><text x="60" y="418">On the go.</text></g>' +
    '<text x="67" y="474" fill="#53564b" font-family="Arial,sans-serif" font-size="26">Your favorites. A smoother checkout.</text>' +
    '<rect x="64" y="527" width="1072" height="570" rx="48" fill="#e4f222"/>' +
    '<ellipse cx="605" cy="990" rx="370" ry="42" fill="#c5d52b"/>' +
    '<image href="' +
    snack +
    '" x="126" y="646" width="340" height="348" transform="rotate(-9 296 820)"/>' +
    '<image href="' +
    coffee +
    '" x="399" y="558" width="474" height="418"/>' +
    '<image href="' +
    burger +
    '" x="708" y="794" width="350" height="269"/>' +
    '<circle cx="999" cy="635" r="70" fill="#171717"/><text x="999" y="630" text-anchor="middle" fill="#e4f222" font-family="Arial" font-size="18" font-weight="700">PICK.</text><text x="999" y="655" text-anchor="middle" fill="#e4f222" font-family="Arial" font-size="18" font-weight="700">PAY. GO.</text>' +
    '<text x="66" y="1155" fill="#65694f" font-family="Arial,sans-serif" font-size="15">Independent concept · Synthetic payments · Built by Megafuji</text></svg>'
  );
}
function poster(width, height) {
  if (width === height) return squarePoster(width);
  const square = width === height,
    scale = width / 1200,
    h = height / scale;
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    width +
    '" height="' +
    height +
    '" viewBox="0 0 1200 ' +
    h +
    '"><title>Mashgin Market concept by Megafuji</title><rect width="1200" height="' +
    h +
    '" fill="#f4f2f0"/><rect x="600" width="600" height="' +
    h +
    '" fill="#e4f222"/><g transform="translate(55 43) scale(.6)">' +
    mark +
    '</g><text x="128" y="81" fill="#171717" font-family="Arial,sans-serif" font-size="29" font-weight="800" letter-spacing="-1">mashgin market</text><text x="58" y="' +
    (square ? 230 : 185) +
    '" fill="#575b4a" font-family="Arial,sans-serif" font-size="13" font-weight="600" letter-spacing="2.3">A CHECKOUT CONCEPT BY MEGAFUJI</text><g fill="#171717" font-family="Arial,sans-serif" font-size="76" font-weight="750" letter-spacing="-4"><text x="54" y="' +
    (square ? 343 : 284) +
    '">Good things.</text><text x="54" y="' +
    (square ? 428 : 370) +
    '">On the go.</text></g><text x="58" y="' +
    (square ? 495 : 430) +
    '" fill="#53564b" font-family="Arial,sans-serif" font-size="21">Pick a favorite. Keep moving.</text><rect x="58" y="' +
    (square ? 536 : 465) +
    '" width="286" height="46" rx="23" fill="#171717"/><text x="81" y="' +
    (square ? 565 : 494) +
    '" fill="#f5f5ef" font-family="Arial,sans-serif" font-size="14">76 PRODUCTS / ONE LITTLE MARKET</text><g transform="translate(605 ' +
    (square ? 195 : 48) +
    ')"><rect x="32" y="95" width="472" height="370" rx="72" fill="none" stroke="#bbc930" stroke-width="2" transform="rotate(-12 260 270)"/><image href="' +
    coffee +
    '" x="115" y="-3" width="370" height="322"/><image href="' +
    snack +
    '" x="-55" y="92" width="300" height="290" transform="rotate(-15 100 237)"/><image href="' +
    burger +
    '" x="120" y="240" width="410" height="307"/><circle cx="89" cy="424" r="49" fill="#171717"/><text x="89" y="420" text-anchor="middle" fill="#e4f222" font-family="Arial" font-weight="700" font-size="15">PICK.</text><text x="89" y="439" text-anchor="middle" fill="#e4f222" font-family="Arial" font-weight="700" font-size="15">PAY. GO.</text></g><text x="58" y="' +
    (h - 36) +
    '" fill="#575b4a" font-family="Arial,sans-serif" font-size="12">Independent take-home project. Fictional products and payments.</text></svg>'
  );
}
for (const [name, w, h] of [
  ['social-card', 1200, 630],
  ['social-square', 1080, 1080],
  ['presentation-cover', 1600, 900],
])
  await writeFile(dir + '/' + name + '.svg', poster(w, h));
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const name of [
    'wordmark',
    'wordmark-light',
    'social-card',
    'social-square',
    'presentation-cover',
  ]) {
    const source = await readFile(dir + '/' + name + '.svg', 'utf8');
    await page.setContent(source);
    const overflow = await page.locator('svg').evaluate((svg) => {
      const vb = svg.viewBox.baseVal;
      return [...svg.querySelectorAll('text')]
        .map((text) => ({ text: text.textContent, b: text.getBBox() }))
        .filter(
          ({ b }) => b.x < 0 || b.y < 0 || b.x + b.width > vb.width || b.y + b.height > vb.height,
        )
        .map(({ text }) => text);
    });
    if (overflow.length) throw new Error(name + ' text overflow: ' + overflow.join(', '));
  }

  for (const [name, w, h] of [
    ['social-card', 1200, 630],
    ['social-square', 1080, 1080],
    ['presentation-cover', 1600, 900],
    ['apple-touch-icon', 180, 180],
    ['icon-192', 192, 192],
    ['icon-512', 512, 512],
  ]) {
    const svg =
      name.startsWith('icon-') || name === 'apple-touch-icon'
        ? symbol
        : await readFile(dir + '/' + name + '.svg', 'utf8');
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(
      '<html><body style="margin:0"><img style="display:block;width:100vw;height:100vh" src="data:image/svg+xml;base64,' +
        Buffer.from(svg).toString('base64') +
        '"></body></html>',
    );
    await page.locator('img').evaluate(async (img) => {
      await img.decode();
    });
    await page.screenshot({ path: dir + '/' + name + '.png' });
  }
} finally {
  await browser.close();
}
console.log('Generated editable wordmarks, social/press graphics, favicon and app icons.');
