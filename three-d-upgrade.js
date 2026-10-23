/* Coin Rush WebGL upgrade: real 3D ship, spinning coins and deep-space lighting.
   Gracefully falls back to the existing canvas game if WebGL/CDN is unavailable. */
(function () {
  'use strict';
  const stage = document.querySelector('.stage');
  const game = document.getElementById('game');
  if (!stage || !game || !window.THREE) return;

  const style = document.createElement('style');
  style.textContent = `
    .cr3d-layer{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}
    #game{position:relative;z-index:0}
    .stage:after{z-index:2}
    .cr-vfx{z-index:3!important}
    .overlay{z-index:4}
    .rewardoffer{z-index:8}
    @media(prefers-reduced-motion:reduce){.cr3d-layer{opacity:.8}}
  `;
  document.head.appendChild(style);

  let renderer, scene, camera, ship, coinGroup, stars, resizeObserver;
  const layer = document.createElement('canvas');
  layer.className = 'cr3d-layer';
  layer.setAttribute('aria-hidden', 'true');
  stage.appendChild(layer);

  try {
    renderer = new THREE.WebGLRenderer({ canvas: layer, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    layer.remove();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
  if (THREE.ACESFilmicToneMapping) renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, 420 / 600, 0.1, 150);
  camera.position.set(0, 0, 17);
  scene.add(new THREE.AmbientLight(0x8bbcff, 1.8));
  const key = new THREE.DirectionalLight(0xffe6ad, 3.2); key.position.set(-4, 6, 10); scene.add(key);
  const rim = new THREE.PointLight(0x00dfff, 22, 35); rim.position.set(5, 3, 5); scene.add(rim);
  const magenta = new THREE.PointLight(0x9a4dff, 15, 30); magenta.position.set(-6, -2, 4); scene.add(magenta);

  const metal = new THREE.MeshStandardMaterial({ color: 0x9fb7d2, metalness: .92, roughness: .22 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x162941, metalness: .85, roughness: .27 });
  const cyan = new THREE.MeshStandardMaterial({ color: 0x42eaff, emissive: 0x00aaff, emissiveIntensity: 2.1, metalness: .35, roughness: .2 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x4bd8ff, emissive: 0x063d67, metalness: .65, roughness: .08, clearcoat: 1, clearcoatRoughness: .05 });
  ship = new THREE.Group();
  // Forward-pointing faceted nose and armored central hull
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.44, 2.1, 6), metal);
  nose.rotation.x = Math.PI / 2; nose.position.z = .35; ship.add(nose);
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(.3, .43, 1.7, 8), darkMetal);
  fuselage.rotation.x = Math.PI / 2; fuselage.position.z = -.25; ship.add(fuselage);
  const wingGeo = new THREE.BufferGeometry();
  wingGeo.setAttribute('position', new THREE.Float32BufferAttribute([
    0,.18,.4, 2.0,-.35,-.45, 1.25,-.62,-.5,
    0,.18,.4, 1.25,-.62,-.5, .3,-.48,-.5,
    0,.18,.4, -2.0,-.35,-.45, -1.25,-.62,-.5,
    0,.18,.4, -1.25,-.62,-.5, -.3,-.48,-.5
  ], 3));
  wingGeo.computeVertexNormals();
  const wings = new THREE.Mesh(wingGeo, new THREE.MeshStandardMaterial({ color: 0x4e7799, metalness: .88, roughness: .26, side: THREE.DoubleSide, flatShading: true }));
  ship.add(wings);
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(.31, 16, 12), glass);
  cockpit.scale.set(.72, .65, 1.45); cockpit.position.set(0, .13, .32); ship.add(cockpit);
  for (const s of [-1, 1]) {
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(.13, .22, .75, 10), darkMetal);
    engine.rotation.x = Math.PI / 2; engine.position.set(s * .86, -.28, -.48); ship.add(engine);
    const core = new THREE.Mesh(new THREE.ConeGeometry(.16, 1.05, 12), new THREE.MeshBasicMaterial({ color: 0x33dfff, transparent: true, opacity: .8 }));
    core.rotation.x = -Math.PI / 2; core.position.set(s * .86, -.28, -.95); ship.add(core);
    const nozzle = new THREE.Mesh(new THREE.TorusGeometry(.16, .045, 8, 18), cyan);
    nozzle.position.set(s * .86, -.28, -.51); ship.add(nozzle);
  }
  ship.scale.set(.7, .7, .7);
  scene.add(ship);

  // Physically lit gold coins with a beveled rim and raised center medallion
  coinGroup = new THREE.Group(); scene.add(coinGroup);
  const coinMat = new THREE.MeshStandardMaterial({ color: 0xffbf35, metalness: 1, roughness: .2, emissive: 0x6b3000, emissiveIntensity: .24 });
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xffe89a, metalness: 1, roughness: .18 });
  const coins = [];
  for (let i = 0; i < 8; i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.33, .33, .095, 32, 1), coinMat);
    body.rotation.x = Math.PI / 2; g.add(body);
    const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(.285, .035, 8, 32), edgeMat);
    g.add(rimMesh);
    const center = new THREE.Mesh(new THREE.TorusGeometry(.19, .018, 6, 24), edgeMat);
    center.position.z = .057; g.add(center);
    const glint = new THREE.PointLight(0xffc34d, 1.4, 2); glint.position.set(-.15,.2,.4);g.add(glint);
    g.position.set(-4.5 + (i % 4) * 3, 6 - Math.floor(i / 4) * 7, -1.5 - (i % 3) * .3);
    g.userData.baseY = g.position.y; g.userData.phase = i * .9;
    coinGroup.add(g); coins.push(g);
  }

  // Deep-space particles at several depths create parallax.
  const starPositions = [], starColors = [];
  for (let i = 0; i < 520; i++) {
    starPositions.push((Math.random() - .5) * 25, (Math.random() - .5) * 32, -3 - Math.random() * 28);
    const c = Math.random() > .82 ? new THREE.Color(0x66eaff) : new THREE.Color(0xb8ccff);
    starColors.push(c.r,c.g,c.b);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions,3));
  starGeo.setAttribute('color', new THREE.Float32BufferAttribute(starColors,3));
  stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: .045, vertexColors: true, transparent: true, opacity: .8, sizeAttenuation: true }));
  scene.add(stars);

  let width = 420, height = 600, tick = 0;
  function resize() {
    const r = game.getBoundingClientRect();
    if (!r.width || !r.height) return;
    width = r.width; height = r.height;
    renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix();
  }
  resizeObserver = new ResizeObserver(resize); resizeObserver.observe(game); window.addEventListener('resize', resize, { passive: true });

  function animate() {
    requestAnimationFrame(animate);
    tick += .016;
    const w = width / 420, h = height / 600;
    // Keep the 3D craft aligned with the existing game's player position.
    if (typeof player !== 'undefined') {
      ship.position.x = ((player.x / 420) - .5) * 12 * w;
      ship.position.y = (0.5 - (player.y + player.h / 2) / 600) * 17 * h;
      ship.rotation.z = (typeof move !== 'undefined' ? -move * .12 : 0) + Math.sin(tick * 1.4) * .018;
      ship.rotation.y = Math.sin(tick * 1.1) * .1;
      const skin = typeof save !== 'undefined' && typeof skins !== 'undefined' ? skins.find(s => s.id === save.selected) : null;
      if (skin) { cyan.color.set(skin.color); cyan.emissive.set(skin.color); }
    } else {
      ship.position.y = -6.8;
    }
    ship.position.z = 1;
    ship.children.forEach((obj) => { if (obj.geometry && obj.geometry.type === 'ConeGeometry' && obj.material && obj.material.transparent) obj.scale.y = .8 + .25 * Math.sin(tick * 10); });
    // Render actual falling game items in 3D, rather than showing only a decorative coin row.
    // The original gameplay loop still owns movement, scoring and collision detection.
    const liveItems = typeof items !== 'undefined' && typeof running !== 'undefined' && running ? items : null;
    coins.forEach((coin, i) => {
      const item = liveItems && liveItems[i];
      coin.visible = !liveItems || !!item;
      if (item) {
        coin.position.x = ((item.x / 420) - .5) * 12 * w;
        coin.position.y = (0.5 - item.y / 600) * 17 * h;
        coin.position.z = -1.2;
        coin.scale.setScalar(Math.max(.45, Math.min(1.45, (item.r || 12) / 12)));
        coin.rotation.y = tick * (1.1 + i * .08);
        coin.rotation.x = Math.sin(tick * .8 + coin.userData.phase) * .18;
        coin.rotation.z = Math.sin(tick + i) * .08;
        // Recolor the 3D pickup to match its real gameplay type.
        const color = item.bomb ? 0xff397e : item.reward ? 0xc56bff : item.special ? 0x35eaff : 0xffbf35;
        coin.children.forEach((part) => {
          if (part.material && part.material.color && part.geometry && part.geometry.type !== 'TorusGeometry') {
            part.material.color.setHex(color);
            if (part.material.emissive) part.material.emissive.setHex(item.bomb ? 0x650020 : item.reward ? 0x401060 : item.special ? 0x004060 : 0x6b3000);
          }
        });
      } else if (!liveItems) {
        coin.position.y = coin.userData.baseY + Math.sin(tick * 1.5 + coin.userData.phase) * .22;
        coin.position.z = -1.5 - (i % 3) * .3;
        coin.scale.setScalar(1);
      }
      coin.rotation.y = tick * (1.1 + i * .08);
    });
    stars.rotation.y = Math.sin(tick * .04) * .035;
    stars.position.y = (tick * .08) % 2;
    renderer.render(scene, camera);
  }
  animate();
})();