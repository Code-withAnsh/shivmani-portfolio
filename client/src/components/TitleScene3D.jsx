import { useEffect, useRef } from 'react';
import { asset } from '../lib/asset.js';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { playWhoosh, playImpact } from '../lib/sound.js';

import { PLATES, START, STEP, DUR } from '../lib/titles.js';

// Within one plate's window (t 0..1)
const T_LAND = 0.3; // letters have landed
const T_SLASH = 0.55; // slash starts
const T_SLASH_END = 0.67;

const GAP = 30; // distance between titles along the camera path
const HOLD_D = 16; // camera distance while reading a title
const SLASH_ANGLES = [-0.5, 0.42, -0.3, 0];
const SPLIT_OPEN = 10;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t) => t * t * t;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// Bold extruded 3D title text, scrubbed by scroll (progressRef.current is 0..1).
export default function TitleScene3D({ progressRef }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    let width = mount.clientWidth;
    let height = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.localClippingEnabled = true;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x070d26, 22, 80);
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 140);
    scene.add(camera);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    // Lights ride on the camera, so every title is lit the same way when the camera arrives at it.
    const key = new THREE.DirectionalLight('#ffe9e4', 2.0);
    key.position.set(3, 5, -8);
    key.target.position.set(0, 0, -16);
    const rim = new THREE.DirectionalLight('#4f7dff', 2.6);
    rim.position.set(-6, -2, -20);
    rim.target.position.set(0, 0, -16);
    const glint = new THREE.PointLight('#e4ecff', 80, 40, 1.6);
    glint.position.set(0, 3, -9);
    camera.add(key, key.target, rim, rim.target, glint);

    const redMat = new THREE.MeshPhysicalMaterial({
      color: '#c1121f',
      metalness: 0.35,
      roughness: 0.38,
      clearcoat: 0.7,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.1,
      side: THREE.DoubleSide,
    });
    const shadowMat = new THREE.MeshBasicMaterial({
      color: '#081a52',
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });

    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 256;
    glowCanvas.height = 256;
    const gctx = glowCanvas.getContext('2d');
    const gg = gctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gg.addColorStop(0, 'rgba(12, 34, 110, 0.7)');
    gg.addColorStop(0.55, 'rgba(12, 34, 110, 0.3)');
    gg.addColorStop(1, 'rgba(12, 34, 110, 0)');
    gctx.fillStyle = gg;
    gctx.fillRect(0, 0, 256, 256);
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const glowMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, fog: false });

    // Slash streak: bright core fading to the ends, additive so it burns through the title
    const slashCanvas = document.createElement('canvas');
    slashCanvas.width = 256;
    slashCanvas.height = 32;
    const sctx = slashCanvas.getContext('2d');
    const sg = sctx.createLinearGradient(0, 0, 256, 0);
    sg.addColorStop(0, 'rgba(255,200,120,0)');
    sg.addColorStop(0.15, 'rgba(255,225,170,0.9)');
    sg.addColorStop(0.85, 'rgba(255,255,255,1)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    sctx.fillStyle = sg;
    sctx.fillRect(0, 0, 256, 32);
    const vg = sctx.createLinearGradient(0, 0, 0, 32);
    vg.addColorStop(0, 'rgba(0,0,0,1)');
    vg.addColorStop(0.5, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,1)');
    sctx.globalCompositeOperation = 'destination-out';
    sctx.fillStyle = vg;
    sctx.fillRect(0, 0, 256, 32);
    const slashTex = new THREE.CanvasTexture(slashCanvas);

    // ── Frozen-moment debris and sparks ──────────────────
    const lastIdx = PLATES.length - 1;
    const zOf = (i) => -i * GAP;
    const zMin = zOf(lastIdx) - 16;
    const zMax = HOLD_D + 14;

    const SHARDS = 520;
    const shardGeo = new THREE.TetrahedronGeometry(0.6);
    const shardMat = new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.75, roughness: 0.35 });
    const shards = new THREE.InstancedMesh(shardGeo, shardMat, SHARDS);
    shards.frustumCulled = false;
    const shardData = [];
    const palette = ['#2a1218', '#3a1a22', '#c1121f', '#1b2a52', '#e3b25a'];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < SHARDS; i++) {
      let x;
      let y;
      do {
        const a = Math.random() * Math.PI * 2;
        const r = 4 + Math.pow(Math.random(), 0.7) * 22;
        x = Math.cos(a) * r * 1.3;
        y = Math.sin(a) * r * 0.8;
        // Keep the strip the titles occupy clear, so the debris frames the text instead of covering it
      } while (Math.abs(x) < 11 && Math.abs(y) < 4.6);
      shardData.push({
        x,
        y,
        z: lerp(zMin, zMax, Math.random()),
        sx: 0.3 + Math.random() * 1.2,
        sy: 0.2 + Math.random() * 0.9,
        sz: 0.1 + Math.random() * 0.5,
        rx: Math.random() * 6,
        ry: Math.random() * 6,
        vx: (Math.random() - 0.5) * 2.4,
        vy: (Math.random() - 0.5) * 2.4,
        bob: Math.random() * 6,
      });
      shards.setColorAt(i, new THREE.Color(palette[Math.floor(Math.random() * palette.length)]));
    }
    shards.instanceColor.needsUpdate = true;
    scene.add(shards);

    const SPARKS = 700;
    const sparkPos = new Float32Array(SPARKS * 3);
    const sparkBase = [];
    for (let i = 0; i < SPARKS; i++) {
      sparkBase.push({
        x: (Math.random() - 0.5) * 50,
        y: Math.random() * 30 - 15,
        z: lerp(zMin, zMax, Math.random()),
        v: 0.4 + Math.random() * 1.2,
      });
    }
    const dotCanvas = document.createElement('canvas');
    dotCanvas.width = 64;
    dotCanvas.height = 64;
    const dctx = dotCanvas.getContext('2d');
    const dg = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    dg.addColorStop(0, 'rgba(255,230,170,1)');
    dg.addColorStop(0.3, 'rgba(255,150,60,0.7)');
    dg.addColorStop(1, 'rgba(255,100,20,0)');
    dctx.fillStyle = dg;
    dctx.fillRect(0, 0, 64, 64);
    const dotTex = new THREE.CanvasTexture(dotCanvas);
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({
      map: dotTex,
      size: 0.45,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    sparks.frustumCulled = false;
    scene.add(sparks);

    // ── Titles ───────────────────────────────────────────
    const plates = [];
    let visW = 20;

    const fit = () => {
      const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * HOLD_D;
      visW = visH * camera.aspect;
      plates.forEach((pl) => {
        const f = Math.min(1, (visW * 0.86) / pl.width);
        pl.fit = f;
        pl.halves.forEach((h) => h.group.scale.setScalar(f));
      });
    };

    new FontLoader().load(asset('fonts/helvetiker_bold.typeface.json'), (font) => {
      const SIZE = 1.7;
      const SPACING = SIZE * 0.05;
      const unit = SIZE / font.data.resolution;
      const geoCache = new Map();

      // One extruded geometry per character, origin at the middle of the glyph's advance,
      // so each letter can spin and scale around its own center.
      const letterGeo = (ch, ha) => {
        if (geoCache.has(ch)) return geoCache.get(ch);
        const geo = new TextGeometry(ch, {
          font,
          size: SIZE,
          depth: 0.7,
          curveSegments: 10,
          bevelEnabled: true,
          bevelThickness: SIZE * 0.05,
          bevelSize: SIZE * 0.035,
          bevelSegments: 5,
        });
        geo.translate(-ha / 2, -SIZE * 0.36, -0.35);
        geoCache.set(ch, geo);
        return geo;
      };

      PLATES.forEach(({ text }, pi) => {
        const isLast = pi === lastIdx;
        const angle = SLASH_ANGLES[pi];
        const dir = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
        const normal = new THREE.Vector3(-Math.sin(angle), Math.cos(angle), 0);
        const center = new THREE.Vector3(0, 0, zOf(pi));

        const root = new THREE.Group();
        root.position.copy(center);
        root.visible = false;
        scene.add(root);

        // Glyph layout, shared by both halves
        const glyphs = [];
        let cursor = 0;
        for (const ch of text) {
          const glyph = font.data.glyphs[ch] || font.data.glyphs['?'];
          const ha = glyph.ha * unit;
          if (ch !== ' ') glyphs.push({ ch, ha, x: cursor + ha / 2 });
          cursor += ha + SPACING;
        }
        const plateW = cursor - SPACING;

        // The last title is never cut: one group, no clipping. Every other title is two clipped halves.
        const halfDefs = isLast ? [{ sign: 0 }] : [{ sign: 1 }, { sign: -1 }];
        const halves = halfDefs.map(({ sign }) => {
          const group = new THREE.Group();
          group.position.copy(center);
          group.visible = false;
          scene.add(group);

          let plane = null;
          let mats = { red: redMat, shadow: shadowMat };
          if (sign !== 0) {
            plane = new THREE.Plane(normal.clone().multiplyScalar(sign), 0);
            const red = redMat.clone();
            const shadow = shadowMat.clone();
            red.clippingPlanes = [plane];
            shadow.clippingPlanes = [plane];
            mats = { red, shadow };
          }

          const letters = glyphs.map(({ ch, ha, x }) => {
            const geo = letterGeo(ch, ha);
            const holder = new THREE.Group();
            const main = new THREE.Mesh(geo, mats.red);
            const shadow = new THREE.Mesh(geo, mats.shadow);
            shadow.position.set(0.28, -0.28, -0.6);
            holder.add(shadow, main);
            holder.position.x = x - plateW / 2;
            group.add(holder);
            return holder;
          });
          return { group, letters, plane, sign, mats };
        });

        const glow = new THREE.Mesh(new THREE.PlaneGeometry(plateW * 1.35, 4.4), glowMat);
        glow.position.z = -1.4;
        root.add(glow);

        // Three claw slashes; the middle one is the cut
        const slashes = [];
        if (!isLast) {
          const slashGroup = new THREE.Group();
          slashGroup.rotation.z = angle;
          slashGroup.position.z = 1.2;
          [-0.55, 0, 0.55].forEach((off, k) => {
            const m = new THREE.Mesh(
              new THREE.PlaneGeometry(1, k === 1 ? 0.22 : 0.1),
              new THREE.MeshBasicMaterial({
                map: slashTex,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthTest: false,
                depthWrite: false,
                toneMapped: false,
                fog: false,
              })
            );
            m.position.y = off;
            m.renderOrder = 10;
            slashGroup.add(m);
            slashes.push(m);
          });
          root.add(slashGroup);
        }

        plates.push({ root, halves, glow, slashes, normal, dir, center, width: plateW, fit: 1, slashGroup: null, isLast });
      });
      fit();
    });

    // ── Per-frame loop ──────────────────────────────────
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointer = (e) => {
      tilt.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      tilt.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointer);

    let raf = 0;
    const whooshFired = PLATES.map(() => false);
    const impactFired = PLATES.map(() => false);
    let lastSoundAt = 0;
    const play = (fn) => {
      const now = performance.now();
      if (now - lastSoundAt < 350) return;
      lastSoundAt = now;
      fn();
    };

    const plateT = (smooth, i) => clamp((smooth - (START + i * STEP)) / DUR);

    // Camera position along the path, from whichever title is currently active
    const cameraZ = (smooth) => {
      let i = 0;
      for (let k = 0; k < PLATES.length; k++) if (plateT(smooth, k) > 0) i = k;
      const t = plateT(smooth, i);
      const hold = zOf(i) + HOLD_D;
      const from = i === 0 ? hold + 8 : zOf(i - 1) - 2;
      if (t < T_LAND) return lerp(from, hold, easeOutCubic(t / T_LAND));
      if (i === lastIdx) return hold - 2 * easeInOut(clamp((t - T_LAND) / (1 - T_LAND)));
      if (t < T_SLASH_END) return hold - 1.5 * clamp((t - T_LAND) / (T_SLASH_END - T_LAND));
      return lerp(hold - 1.5, zOf(i) - 2, easeInCubic((t - T_SLASH_END) / (1 - T_SLASH_END)));
    };

    const tmpV = new THREE.Vector3();
    const tick = (nowMs) => {
      const smooth = progressRef.current;
      tilt.x += (tilt.tx - tilt.x) * 0.05;
      tilt.y += (tilt.ty - tilt.y) * 0.05;

      let shake = 0;
      let flash = 0;
      let activeT = 0;
      let active = false;

      plates.forEach((pl, i) => {
        const t = plateT(smooth, i);
        const letterCount = pl.halves[0].letters.length;
        const visible = t > 0 && (pl.isLast || t < 1);
        pl.root.visible = visible;
        pl.halves.forEach((h) => (h.group.visible = visible));
        if (!visible) {
          whooshFired[i] = false;
          impactFired[i] = false;
          return;
        }

        // Letters tumble in one by one
        let presence = 0;
        pl.halves.forEach((h) => {
          h.letters.forEach((l, k) => {
            const stag = letterCount > 1 ? (k / (letterCount - 1)) * 0.35 : 0;
            const e = clamp((t / T_LAND - stag) / 0.65);
            const sc = Math.max(0.0001, easeOutBack(e));
            l.scale.setScalar(sc);
            l.position.y = -(1 - e) * 2.2;
            l.position.z = -(1 - e) * 9;
            l.rotation.x = (1 - e) * -1.7;
            l.rotation.y = (1 - e) * (k % 2 ? 0.9 : -0.9);
            presence = Math.max(presence, sc);
          });
        });

        // The cut: halves slide apart along the slash normal
        const open = pl.isLast ? 0 : easeInOut(clamp((t - T_SLASH_END + 0.05) / (1 - T_SLASH_END + 0.05)));
        const d = open * SPLIT_OPEN;
        pl.halves.forEach((h) => {
          if (h.sign === 0) return;
          const off = pl.normal.clone().multiplyScalar(h.sign * d);
          h.group.position.set(pl.center.x + off.x, pl.center.y + off.y, pl.center.z + h.sign * open * 0.8);
          // Visible side of the plane, in world space: n.(p - center) >= d (for the A half)
          h.plane.constant = h.sign * -pl.normal.dot(pl.center) - d;
        });
        pl.glow.scale.setScalar(Math.min(1, presence) * (1 - open));

        // Slash streaks: shoot across, then burn out
        if (pl.slashes.length) {
          const s = clamp((t - T_SLASH) / (T_SLASH_END - T_SLASH));
          const len = visW * 1.5;
          const grow = easeOutCubic(s);
          const fade = 1 - clamp((t - T_SLASH_END) / 0.12);
          pl.slashes.forEach((m, k) => {
            const l = len * grow * (k === 1 ? 1 : 0.8 - k * 0.05);
            m.scale.set(Math.max(l, 0.0001), 1, 1);
            m.position.x = -len / 2 + l / 2;
            m.material.opacity = s > 0 ? fade : 0;
          });
          const pulse = s > 0 && s < 1 ? Math.sin(s * Math.PI) : 0;
          flash = Math.max(flash, pulse * 0.55);
          shake = Math.max(shake, pulse);
        }

        // Sound: whoosh as the title starts, impact on the slash
        if (t > 0 && !whooshFired[i]) {
          whooshFired[i] = true;
          play(playWhoosh);
        }
        const impactAt = pl.isLast ? T_LAND : T_SLASH + 0.02;
        if (t >= impactAt && !impactFired[i]) {
          impactFired[i] = true;
          play(playImpact);
        } else if (t < impactAt - 0.05) {
          impactFired[i] = false;
        }

        active = true;
        activeT = t;
      });

      // Camera: fly along the path, lean toward the pointer, shake on the cut
      const cz = cameraZ(smooth);
      const sk = shake * 0.35;
      camera.position.set(
        tilt.x * 1.1 + (Math.random() - 0.5) * sk,
        -tilt.y * 0.6 + (Math.random() - 0.5) * sk,
        cz
      );
      camera.lookAt(tilt.x * 0.4, -tilt.y * 0.2, cz - 20);
      camera.rotateZ(tilt.x * 0.03 + Math.sin(smooth * 7) * 0.012);
      mount.style.setProperty('--flash', flash.toFixed(3));

      // Light sweep across the active title
      glint.position.set(active ? -9 + activeT * 18 : 0, 3, -9);

      // Debris hangs in the air: slow tumble driven by scroll (time), shoved outward by every cut
      const time = smooth * 60;
      for (let i = 0; i < SHARDS; i++) {
        const s = shardData[i];
        let push = 0;
        for (let p = 0; p < lastIdx; p++) {
          const at = START + p * STEP + (T_SLASH + 0.02) * DUR;
          const wave = easeOutCubic(clamp((smooth - at) / 0.05));
          push += wave * Math.max(0, 1 - Math.abs(s.z - zOf(p)) / 30);
        }
        const r = Math.hypot(s.x, s.y) || 1;
        dummy.position.set(
          s.x + s.vx * time * 0.1 + (s.x / r) * push * 9,
          s.y + s.vy * time * 0.1 + Math.sin(nowMs / 1800 + s.bob) * 0.25 + (s.y / r) * push * 9,
          s.z
        );
        dummy.rotation.set(s.rx + time * 0.05 * s.sx, s.ry + time * 0.04 * s.sy, time * 0.03);
        dummy.scale.set(s.sx, s.sy, s.sz);
        dummy.updateMatrix();
        shards.setMatrixAt(i, dummy.matrix);
      }
      shards.instanceMatrix.needsUpdate = true;

      for (let i = 0; i < SPARKS; i++) {
        const b = sparkBase[i];
        const y = ((b.y + smooth * 55 * b.v + 15) % 30) - 15;
        sparkPos[i * 3] = b.x + Math.sin(time * 0.1 * b.v + i) * 0.6;
        sparkPos[i * 3 + 1] = y;
        sparkPos[i * 3 + 2] = b.z;
      }
      sparkGeo.attributes.position.needsUpdate = true;

      // Skip the WebGL draw once the intro sequence is over and this canvas is hidden
      if (!document.documentElement.classList.contains('past-stage')) renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => {
      width = mount.clientWidth;
      height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      fit();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material && obj.material !== redMat && obj.material !== shadowMat && obj.material.dispose) {
          obj.material.dispose();
        }
      });
      redMat.dispose();
      shadowMat.dispose();
      glowMat.dispose();
      glowTex.dispose();
      slashTex.dispose();
      dotTex.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [progressRef]);

  return <div ref={mountRef} className="titles3d" aria-hidden="true" />;
}
