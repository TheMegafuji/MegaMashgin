import { readFile, writeFile, mkdir } from 'node:fs/promises';
const products = JSON.parse(await readFile('scripts/data/market.json', 'utf8'));
const escape = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
await mkdir('public/market', { recursive: true });
function shape(p) {
  const c = p.color,
    a = p.accent;
  const label =
    '<text x="200" y="130" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-weight="700" font-size="18">market</text><path d="M168 140h64" stroke="#fff" stroke-opacity=".6"/>';
  if (p.kind === 'bag')
    return (
      '<path d="M132 28h136l-9 32 18 173q-73 20-154 0l18-173z" fill="url(#pack)"/><path d="M132 28h136v12H132zm-9 193h154v12H123z" fill="' +
      a +
      '"/><path d="M141 46l-9 166" stroke="#fff" opacity=".35" stroke-width="5"/>' +
      label +
      '<ellipse cx="185" cy="181" rx="23" ry="13" transform="rotate(-24 185 181)" fill="#f1ce77"/><ellipse cx="216" cy="180" rx="23" ry="13" transform="rotate(20 216 180)" fill="#dfb654"/>'
    );
  if (p.kind === 'can')
    return (
      '<rect x="150" y="38" width="100" height="199" rx="25" fill="url(#pack)"/><ellipse cx="200" cy="42" rx="47" ry="12" fill="#dce0e0"/><ellipse cx="200" cy="42" rx="36" ry="7" fill="#aebbc0"/><rect x="194" y="35" width="15" height="10" rx="5" fill="#e7eeee"/><path d="M150 185q50-52 100-12v34q-50-33-100 4z" fill="' +
      a +
      '"/>' +
      label +
      '<path d="M163 66v138" stroke="#fff" opacity=".26" stroke-width="8"/>'
    );
  if (p.kind === 'bottle')
    return (
      '<rect x="180" y="22" width="40" height="25" rx="6" fill="' +
      c +
      '"/><path d="M178 45h44v27q0 9 20 20t15 24v109q0 14-17 14h-80q-17 0-17-14V116q0-15 15-24t20-20z" fill="' +
      a +
      '"/><rect x="144" y="109" width="112" height="82" rx="4" fill="' +
      c +
      '"/>' +
      label +
      '<path d="M159 106v114" stroke="#fff" opacity=".35" stroke-width="8"/>'
    );
  if (['cup', 'coldcup'].includes(p.kind))
    return (
      '<path d="M132 68h136l-21 164h-94z" fill="' +
      (p.kind === 'cup' ? '#efe4d0' : a) +
      '"/><path d="M142 112h116l-9 72h-97z" fill="' +
      c +
      '"/>' +
      label +
      '<rect x="125" y="53" width="150" height="22" rx="8" fill="#343b43"/><path d="M143 52l8-14h99l8 14z" fill="#48535c"/>' +
      (p.kind === 'coldcup'
        ? '<path d="M211 51l12-40h28" stroke="#e7a861" stroke-width="8" fill="none"/>'
        : '<path d="M180 25q-10-10 2-19m30 19q-10-10 2-19" stroke="#b0afa5" stroke-width="4" fill="none"/>')
    );
  if (p.kind === 'bar' || p.kind === 'box')
    return (
      '<rect x="95" y="73" width="210" height="126" rx="12" fill="url(#pack)"/><path d="M96 75h18v122H96zm191 0h18v122h-18z" fill="' +
      a +
      '"/>' +
      label +
      '<path d="M134 161h130" stroke="' +
      a +
      '" stroke-width="14" stroke-linecap="round"/>'
    );
  if (p.kind === 'sandwich' || p.kind === 'wrap')
    return (
      '<rect x="93" y="44" width="214" height="195" rx="25" fill="#edf1e7" stroke="#ccd5c9" stroke-width="3"/>' +
      (p.kind === 'wrap'
        ? '<g transform="rotate(-24 200 140)"><rect x="150" y="65" width="100" height="154" rx="36" fill="#e5c893"/><ellipse cx="200" cy="77" rx="46" ry="24" fill="#f1ddac"/><ellipse cx="200" cy="77" rx="35" ry="17" fill="#6d964e"/><path d="M180 74h40" stroke="#c87849" stroke-width="12"/><path d="M147 147h105v53q-50 30-105 0z" fill="' +
          c +
          '"/></g>'
        : '<path d="M122 194l150-98v99z" fill="#c59052"/><path d="M130 182l133-76v76z" fill="#71964b"/><path d="M126 166l141-77v83z" fill="#e7b968"/><path d="M119 153L277 70v91z" fill="#f1dfab"/>')
    );
  if (p.kind === 'pizza')
    return (
      '<path d="M112 74q88-45 176 0l-90 156z" fill="#f2c867"/><path d="M121 80q76-36 155 0l-78 131z" fill="#e69a48"/><path d="M112 74q88-45 176 0" stroke="#c78d43" stroke-width="19" stroke-linecap="round"/>' +
      [
        [161, 94],
        [218, 91],
        [198, 132],
        [186, 174],
        [237, 120],
      ]
        .map(
          ([x, y]) =>
            '<circle cx="' +
            x +
            '" cy="' +
            y +
            '" r="13" fill="' +
            (p.id.includes('pepperoni') ? '#b95842' : '#f7dfa0') +
            '"/>',
        )
        .join('')
    );
  if (p.kind === 'hotdog')
    return '<g transform="rotate(-20 200 140)"><rect x="94" y="95" width="212" height="87" rx="44" fill="#e6b969"/><rect x="103" y="112" width="195" height="50" rx="25" fill="#a85d3e"/><path d="M121 125q17 37 32 0t32 0t32 0t32 0t32 0" stroke="#e9c843" stroke-width="7" fill="none"/></g>';
  if (p.kind === 'burger')
    return '<path d="M104 124q6-87 96-87t96 87z" fill="#daa251"/><path d="M106 172h188q-5 64-94 64t-94-64z" fill="#d69d50"/><rect x="98" y="145" width="204" height="39" rx="18" fill="#684937"/><path d="M98 142l23-13 27 12 30-13 27 12 28-11 27 10 27-12 16 17-24 13-27-9-25 9-24-11-26 10-27-10-27 10z" fill="#73974a"/><path d="M107 174l38 23 41-21 48 23 59-25z" fill="#efc657"/><path d="M158 65l7 4m25-13l7 3m25 3l8 5m-49 25l6 4m42-9l5 4" stroke="#f6e1b7" stroke-width="5"/>';
  if (p.kind === 'donut' || p.kind === 'roll')
    return (
      '<ellipse cx="200" cy="143" rx="93" ry="82" fill="#bd7f3d"/><ellipse cx="200" cy="132" rx="91" ry="73" fill="#e9b974"/><ellipse cx="200" cy="121" rx="76" ry="56" fill="' +
      (p.id.includes('bagel') ? '#dfb572' : '#f0d7b2') +
      '"/>' +
      (p.kind === 'donut'
        ? '<ellipse cx="200" cy="129" rx="25" ry="21" fill="#b88c62"/>'
        : '<path d="M153 125q2-40 46-35t41 42q-6 28-36 25t-27-24q5-20 24-11" fill="none" stroke="#af743e" stroke-width="9"/>')
    );
  if (p.kind === 'muffin')
    return (
      '<path d="M133 125h134l-17 106H151z" fill="' +
      c +
      '"/><path d="M151 139l10 80m17-80l5 80m17-80v80m21-80l-5 80m31-80l-11 80" stroke="#fff" opacity=".25" stroke-width="5"/><path d="M117 127q-10-36 23-48-2-33 34-33 21-22 46-4 40-5 45 33 34 8 20 52z" fill="' +
      (p.id.includes('chocolate') ? '#87604b' : '#dbb270') +
      '"/><circle cx="162" cy="87" r="7" fill="#646177"/><circle cx="216" cy="66" r="7" fill="#646177"/><circle cx="241" cy="102" r="7" fill="#646177"/>'
    );
  if (p.kind === 'loaf')
    return '<path d="M103 101q0-30 32-36h129q36 4 34 37v116H103z" fill="#b4804b"/><path d="M116 105q0-28 26-28h112q29 0 29 28v100H116z" fill="#e5c28a"/><path d="M142 107l14 9m43-20l13 9m-8 50l16 9m-79 14l13 7m87-45l12 8" stroke="#a97945" stroke-width="8"/>';
  if (p.kind === 'sushi')
    return (
      '<rect x="79" y="66" width="242" height="158" rx="22" fill="#405149"/>' +
      [0, 1, 2, 3, 4, 5, 6, 7]
        .map(
          (i) =>
            '<g transform="translate(' +
            (109 + (i % 4) * 58) +
            ' ' +
            (106 + Math.floor(i / 4) * 71) +
            ')"><ellipse rx="23" ry="25" fill="#304b39"/><ellipse rx="18" ry="20" fill="#efeee3"/><rect x="-9" y="-10" width="18" height="20" rx="4" fill="' +
            (i % 2 ? '#8ea75a' : '#d69873') +
            '"/></g>',
        )
        .join('')
    );
  if (p.kind === 'apple' || p.kind === 'orange' || p.kind === 'pear')
    return (
      '<path d="M201 57q1-23 14-32" stroke="#7d6242" stroke-width="7" fill="none"/><path d="M204 49q35-41 50-11-30 24-50 11" fill="#789550"/>' +
      (p.kind === 'pear'
        ? '<path d="M177 55q24-13 44 4l17 58q52 61 28 92-34 43-91 17-43-23-25-62l24-51z" fill="#c5bd66"/>'
        : '<path d="M199 70q-42-32-74 14-30 45 0 100t73 41q43 20 77-33 34-61 6-100-27-46-82-22" fill="' +
          (p.kind === 'orange' ? '#e9a144' : p.id === 'green-apple' ? '#8ba955' : '#c66852') +
          '"/>') +
      '<path d="M153 108q-15 24-6 54" stroke="#fff" opacity=".3" stroke-width="12" stroke-linecap="round"/>'
    );
  if (p.kind === 'banana')
    return '<path d="M114 56q-20 133 169 82-48 139-148 62-48-42-28-120z" fill="#e7c65d"/><path d="M118 93q16 109 139 71" stroke="#cfa847" stroke-width="5" fill="none"/><path d="M106 57l9-13 13 11-9 22z" fill="#837446"/>';
  const colors =
    p.kind === 'fruitcup'
      ? ['#c97962', '#d2bc64', '#91a762', '#93677d']
      : p.kind === 'plate'
        ? ['#cb9554', '#e5bd63', '#d8aa55', '#edcb80']
        : ['#92ab6c', '#dcaf68', '#c87757', '#71935d'];
  return (
    '<ellipse cx="200" cy="151" rx="115" ry="84" fill="#e2e7dc" stroke="#c8d0c5" stroke-width="4"/><ellipse cx="200" cy="135" rx="107" ry="70" fill="#f8f8ef"/>' +
    Array.from({ length: 17 }, (_, i) => {
      const angle = i * 2.4,
        r = 14 + Math.sqrt(i) * 16,
        x = 200 + Math.cos(angle) * r,
        y = 135 + Math.sin(angle) * r * 0.62;
      return (
        '<ellipse cx="' +
        x.toFixed(1) +
        '" cy="' +
        y.toFixed(1) +
        '" rx="19" ry="14" fill="' +
        colors[i % 4] +
        '" transform="rotate(' +
        i * 37 +
        ' ' +
        x +
        ' ' +
        y +
        ')"/>'
      );
    }).join('') +
    '<path d="M105 132q6 61 95 66t95-64" stroke="#fff" fill="none" stroke-width="5" opacity=".5"/>'
  );
}
for (const p of products) {
  const art =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280"><defs><linearGradient id="pack" x1="0" x2="1"><stop stop-color="' +
    p.color +
    '"/><stop offset=".4" stop-color="' +
    p.color +
    '"/><stop offset="1" stop-color="' +
    p.accent +
    '"/></linearGradient><filter id="shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#383324" flood-opacity=".12"/></filter></defs><title>' +
    escape(p.name) +
    '</title><ellipse cx="200" cy="244" rx="85" ry="12" fill="#292929" opacity=".06"/><g filter="url(#shadow)">' +
    shape(p) +
    '</g></svg>';
  await writeFile('public/market/' + p.id + '.svg', art + '\n');
}
console.log('Wrote ' + products.length + ' original SVG market illustrations.');
