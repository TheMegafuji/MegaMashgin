import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { chromium } from '@playwright/test';
const mapping = JSON.parse(await readFile('scripts/data/open-art.json', 'utf8'));
const html = `<!doctype html><html><head><style>body{margin:0;background:transparent}canvas{display:block}</style><script type="importmap">{"imports":{"three":"/three/three.module.js","three/addons/":"/addons/"}}</script></head><body><script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
renderer.setSize(480,360); renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff,0xb1a89a,2.5));
const key = new THREE.DirectionalLight(0xffffff,3.2); key.position.set(-3,6,7); scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff,1.5); rim.position.set(4,2,-4); scene.add(rim);
const camera = new THREE.OrthographicCamera(-1.75,1.75,1.3125,-1.3125,0.01,100);
camera.position.set(4,3.2,5); camera.lookAt(0,0,0);
let current;
window.renderModel = async name => {
 if(current){scene.remove(current); current.traverse(o=>{o.geometry?.dispose(); if(o.material){for(const m of [].concat(o.material)){m.map?.dispose();m.dispose();}}});}
 const gltf=await new GLTFLoader().loadAsync('/models/'+name+'.glb');
 current=gltf.scene; current.traverse(o=>{if(o.isMesh && !o.material.map) throw Error('Missing source texture for '+name);});
 const box=new THREE.Box3().setFromObject(current),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
 current.position.sub(center);
 const group=new THREE.Group(); group.add(current);
 const scale=2.0/Math.max(size.x,size.y,size.z);group.scale.setScalar(scale);
 current=group; scene.add(current);
 renderer.render(scene,camera);
 return renderer.domElement.toDataURL('image/png').split(',')[1];
};
window.ready=true;
</script></body></html>`;
const roots = {
  '/three/': 'node_modules/three/build',
  '/addons/': 'node_modules/three/examples/jsm',
  '/models/': 'scripts/assets/kenney-food-kit',
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost').pathname;
    if (url === '/') {
      res.setHeader('content-type', 'text/html');
      return res.end(html);
    }
    for (const [prefix, dir] of Object.entries(roots))
      if (url.startsWith(prefix)) {
        const root = resolve(dir),
          file = resolve(root, decodeURIComponent(url.slice(prefix.length)));
        if (!file.startsWith(root + sep)) {
          res.writeHead(403);
          return res.end();
        }
        res.setHeader(
          'content-type',
          file.endsWith('.js') ? 'text/javascript' : 'application/octet-stream',
        );
        return res.end(await readFile(file));
      }
    res.writeHead(404);
    res.end();
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
let browser;
try {
  browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 480, height: 360 } });
  await page.goto('http://127.0.0.1:' + server.address().port);
  await page.waitForFunction(() => window.ready);
  await mkdir('public/food-kit', { recursive: true });
  for (const model of new Set(Object.values(mapping))) {
    const bytes = await page.evaluate((name) => window.renderModel(name), model);
    await writeFile('public/food-kit/' + model + '.png', Buffer.from(bytes, 'base64'));
  }
  console.log(
    'Rendered ' +
      new Set(Object.values(mapping)).size +
      ' Kenney CC0 assets; Three.js stays outside the customer bundle.',
  );
} finally {
  await browser?.close();
  server.close();
}
