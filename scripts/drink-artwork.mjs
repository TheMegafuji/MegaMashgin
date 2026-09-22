import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('public/drinks', { recursive: true });
const cupHandle =
  '<path d="M261 114h19c40 0 39 60-8 64h-17" fill="none" stroke="#f4ebdc" stroke-width="15"/>';
const glass =
  '<path d="M146 48h108l-12 191h-84z" fill="#cde2df" fill-opacity=".4" stroke="#b3cbc6" stroke-width="3"/>';
const ice =
  '<g fill="#e9f4ef" fill-opacity=".65" stroke="#c9dcd5" stroke-width="2"><rect x="163" y="84" width="26" height="27" rx="4" transform="rotate(-15 176 97)"/><rect x="203" y="73" width="26" height="27" rx="4" transform="rotate(13 216 86)"/><rect x="190" y="123" width="27" height="24" rx="4" transform="rotate(-8 203 135)"/></g>';
const shapes = {
  'large-coffee':
    '<path d="M133 62h135l-20 182h-95z" fill="#282c2a"/><path d="M142 125h116l-6 65H149z" fill="#e4f222"/><text x="200" y="166" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="27" fill="#222">M/</text><path d="M126 58l12-22h124l13 22v17H126z" fill="#363e39"/><path d="M149 37h99" stroke="#59625b" stroke-width="6"/><path d="M142 84l14 144" stroke="#ffffff" opacity=".12" stroke-width="6"/>',
  cappuccino:
    '<ellipse cx="199" cy="228" rx="109" ry="21" fill="#d7cfc0"/><ellipse cx="199" cy="223" rx="103" ry="18" fill="#f2ece0"/>' +
    cupHandle +
    '<path d="M124 102h144v58q-2 60-70 60t-74-60z" fill="url(#porcelain)"/><ellipse cx="196" cy="103" rx="72" ry="28" fill="#e6d7c2"/><ellipse cx="196" cy="104" rx="63" ry="22" fill="#ad784a"/><path d="M195 117c-37-15-29-34-12-27l12 8 12-8c20-8 25 13-12 27z" fill="#fff6df"/><path d="M196 98v22" stroke="#fff6df" stroke-width="3"/>',
  'oat-latte':
    '<path d="M252 83h20q36 3 35 48t-44 47h-10" fill="none" stroke="#b9cfca" stroke-width="10"/>' +
    glass +
    '<path d="M151 100h98l-9 132h-80z" fill="#c19469"/><path d="M157 173h86l-3 59h-80z" fill="#e5c79e"/><path d="M153 100h94l-3 45h-88z" fill="#9b6c45"/><ellipse cx="200" cy="100" rx="48" ry="17" fill="#f6ebd4"/><ellipse cx="200" cy="97" rx="35" ry="9" fill="#fcf5e8"/><path d="M164 65l6 151" stroke="#fff" opacity=".5" stroke-width="8"/>',
  'hot-chocolate':
    '<path d="M259 99h19q40 0 36 45t-53 39" stroke="#b84f35" stroke-width="19" fill="none"/><path d="M128 98h137v117q-67 37-137 0z" fill="url(#cocoa)"/><ellipse cx="196" cy="100" rx="69" ry="26" fill="#ffb183"/><ellipse cx="196" cy="101" rx="59" ry="19" fill="#633e2d"/><g fill="#fff1d8" stroke="#e6d4b4"><rect x="155" y="87" width="29" height="20" rx="5" transform="rotate(-15 170 97)"/><rect x="193" y="78" width="28" height="21" rx="5" transform="rotate(10 207 88)"/><rect x="209" y="101" width="24" height="18" rx="5"/></g><path d="M145 120v82" stroke="#ffc0a0" opacity=".4" stroke-width="7"/><text x="196" y="175" text-anchor="middle" font-family="Arial" font-size="17" font-weight="bold" fill="#fff2dd">COCOA</text>',
  'iced-tea':
    glass +
    '<path d="M150 86h100l-10 147h-80z" fill="#ad6a27" opacity=".86"/>' +
    ice +
    '<ellipse cx="199" cy="85" rx="48" ry="12" fill="#d79a44"/><path d="M220 137l9-113 29-9" fill="none" stroke="#557a67" stroke-width="8"/><circle cx="158" cy="87" r="29" fill="#e9cc58"/><circle cx="158" cy="87" r="23" fill="#f8e994"/><path d="M158 64v46m-23-23h46m-39-16l32 32m-32 0l32-32" stroke="#d4b341" stroke-width="2"/><path d="M169 116l3 97" stroke="#fff" opacity=".32" stroke-width="7"/>',
  'fountain-lemonade':
    '<path d="M132 60h136l-19 182h-98z" fill="#f5eeca"/><path d="M141 137h117l-11 105h-93z" fill="#e5eb82"/><path d="M134 88l128 44m-127 1l124 43m-119 0l115 41" stroke="#fff9dc" stroke-width="15"/><ellipse cx="200" cy="60" rx="69" ry="17" fill="#e4e9d3" stroke="#b1baac" stroke-width="3"/><path d="M212 137V23l27-10" stroke="#bf7450" stroke-width="9" fill="none"/><circle cx="200" cy="170" r="27" fill="#fff9d0"/><circle cx="200" cy="170" r="19" fill="#edca50"/><path d="M182 170h36m-18-18v36" stroke="#fff6bd" stroke-width="3"/>',
  'iced-latte':
    glass +
    '<path d="M152 99h96l-8 134h-80z" fill="#d2ad83"/><path d="M153 99h94l-2 50q-20-15-44-1t-46-3z" fill="#855239"/>' +
    ice +
    '<ellipse cx="200" cy="91" rx="49" ry="11" fill="#b88052"/><path d="M218 134l10-115h22" fill="none" stroke="#54463d" stroke-width="7"/><path d="M165 118l6 100" stroke="#fff" opacity=".43" stroke-width="8"/>',
  'matcha-latte':
    glass +
    '<path d="M151 101h98l-9 132h-80z" fill="#adc173"/><path d="M157 172q22 10 43-3t43 0l-3 64h-80z" fill="#f2e5bd"/>' +
    ice +
    '<ellipse cx="200" cy="99" rx="48" ry="14" fill="#95af56"/><path d="M213 124l9-105h23" stroke="#506541" stroke-width="8" fill="none"/>',
};
for (const [id, shape] of Object.entries(shapes)) {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280"><title>' +
    id.replaceAll('-', ' ') +
    '</title><defs><linearGradient id="porcelain"><stop stop-color="#d8ddd5"/><stop offset=".42" stop-color="#fff9ed"/><stop offset="1" stop-color="#e4dfd0"/></linearGradient><linearGradient id="cocoa"><stop stop-color="#b8492f"/><stop offset=".45" stop-color="#ec8055"/><stop offset="1" stop-color="#c9633e"/></linearGradient></defs><ellipse cx="201" cy="247" rx="82" ry="12" fill="#191919" opacity=".06"/>' +
    shape +
    '</svg>\n';
  await writeFile('public/drinks/' + id + '.svg', svg);
}
console.log('Wrote 8 original drink silhouettes; no AI-generated raster art.');
