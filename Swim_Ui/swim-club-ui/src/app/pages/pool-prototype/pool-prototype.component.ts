import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-pool-prototype',
  standalone: true,
  imports: [],
  templateUrl: './pool-prototype.component.html',
  styleUrl: './pool-prototype.component.css'
})
export class PoolPrototypeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('threeContainer', { static: false }) container!: ElementRef;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animationId = 0;
  private water!: THREE.Mesh;
  private poolGroup!: THREE.Group;
  private clock = new THREE.Clock();
  private envMap!: THREE.Texture;

  ngAfterViewInit() { this.initThreeJs(); }
  ngOnDestroy() { cancelAnimationFrame(this.animationId); this.renderer?.dispose(); }

  // High-res pool tile texture with noise
  private makeTileTexture(): THREE.Texture {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    // Base color with noise
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#38bdf8' : '#0284c7';
      ctx.fillRect(Math.random() * size, Math.random() * size, 4, 4);
    }
    
    // Grout lines
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 4;
    const tileCount = 16;
    const step = size / tileCount;
    for (let i = 0; i <= tileCount; i++) {
      ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * step); ctx.lineTo(size, i * step); ctx.stroke();
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(25, 12.5);
    tex.anisotropy = 16;
    return tex;
  }

  // Realistic glossy indoor deck tile
  private makeDeckTexture(): THREE.Texture {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    // Warm beige with subtle noise
    ctx.fillStyle = '#e5daba';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for(let i=0; i<10000; i++) {
      ctx.fillRect(Math.random()*size, Math.random()*size, 2, 2);
    }

    // Larger square tiles
    ctx.strokeStyle = '#c4b595';
    ctx.lineWidth = 6;
    const tileCount = 8;
    const step = size / tileCount;
    for (let i = 0; i <= tileCount; i++) {
      ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * step); ctx.lineTo(size, i * step); ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(15, 10);
    tex.anisotropy = 16;
    return tex;
  }

  private initThreeJs() {
    const W = this.container.nativeElement.clientWidth;
    const H = this.container.nativeElement.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(W, H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.nativeElement.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a); 
    this.scene.fog = new THREE.FogExp2(0x0f172a, 0.003);

    this.camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    this.camera.position.set(0, 25, 75); 
    this.camera.lookAt(0, 0, 0);

    // ── Lighting ────────────────────────────────────────────────────────
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(10, 60, 20);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(2048, 2048);
    mainLight.shadow.camera.left = -60; mainLight.shadow.camera.right = 60;
    mainLight.shadow.camera.top  =  60; mainLight.shadow.camera.bottom = -60;
    mainLight.shadow.camera.far  = 200;
    mainLight.shadow.bias = -0.0005;
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.6);
    fillLight.position.set(-20, 40, -20);
    this.scene.add(fillLight);

    const PL = 50, PW = 25, PD = 2.5, WT = 0.6;
    const numLanes = 10;
    const laneW = PW / numLanes;

    this.poolGroup = new THREE.Group();

    // ── Indoor Architecture (Arched Roof) ───────────────────────────────────
    const roomL = 120, roomW = 80, wallH = 20;

    // Arched Ceiling
    const archMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8, side: THREE.BackSide });
    const archGeo = new THREE.CylinderGeometry(roomW/2, roomW/2, roomL, 32, 1, true, 0, Math.PI);
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.rotation.z = Math.PI / 2;
    arch.rotation.x = Math.PI / 2;
    arch.position.set(0, wallH, 0);
    this.poolGroup.add(arch);

    // Ceiling Light Panels
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.0 });
    for (let z = -45; z <= 45; z += 15) {
      for (let angle = 0.2; angle < Math.PI - 0.1; angle += 0.3) {
        const lx = Math.cos(angle) * (roomW/2 - 0.5);
        const ly = wallH + Math.sin(angle) * (roomW/2 - 0.5);
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), lightMat);
        panel.position.set(lx, ly, z);
        panel.rotation.x = Math.PI/2;
        panel.rotation.y = -angle + Math.PI/2;
        this.poolGroup.add(panel);
      }
    }

    // ── Generate Environment Map for Realistic Reflections ───────────────────
    // We render the empty room to an environment map BEFORE adding the glossy pool/deck
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    this.scene.add(this.poolGroup); // Temporarily add just walls/lights
    this.envMap = pmremGenerator.fromScene(this.scene).texture;

    // ── Deck (Glossy tile with reflections) ──────────────────────────────────
    const deckMat = new THREE.MeshStandardMaterial({ 
      map: this.makeDeckTexture(), 
      roughness: 0.15, // Very glossy
      metalness: 0.1,
      envMap: this.envMap,
      envMapIntensity: 0.8
    });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(roomW, 0.4, roomL), deckMat);
    deck.position.y = -0.2;
    deck.receiveShadow = true;
    this.poolGroup.add(deck);

    // ── Pool Basin ───────────────────────────────────────────────────────────
    const tileTex = this.makeTileTexture();
    const pWallMat = new THREE.MeshStandardMaterial({ 
      map: tileTex, roughness: 0.3, metalness: 0.1, envMap: this.envMap 
    });
    [
      { geo: new THREE.BoxGeometry(PL + WT * 2, PD + 0.5, WT), pos: [0, -PD/2+0.25, PW/2+WT/2] },
      { geo: new THREE.BoxGeometry(PL + WT * 2, PD + 0.5, WT), pos: [0, -PD/2+0.25, -PW/2-WT/2] },
      { geo: new THREE.BoxGeometry(WT, PD + 0.5, PW),          pos: [ PL/2+WT/2, -PD/2+0.25, 0] },
      { geo: new THREE.BoxGeometry(WT, PD + 0.5, PW),          pos: [-PL/2-WT/2, -PD/2+0.25, 0] },
    ].forEach(({ geo, pos }) => {
      const m = new THREE.Mesh(geo, pWallMat);
      m.position.set(pos[0], pos[1], pos[2]);
      m.receiveShadow = true;
      this.poolGroup.add(m);
    });

    const floorMat = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.4 });
    const poolFloor = new THREE.Mesh(new THREE.BoxGeometry(PL, 0.3, PW), floorMat);
    poolFloor.position.y = -PD - 0.15;
    poolFloor.receiveShadow = true;
    this.poolGroup.add(poolFloor);

    // ── Ultra-Realistic Water ────────────────────────────────────────────────
    const waterGeo = new THREE.PlaneGeometry(PL - 0.05, PW - 0.05, 150, 75);
    waterGeo.rotateX(-Math.PI / 2);
    
    // MeshPhysicalMaterial for glass-like water with IOR and Transmission
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      transmission: 0.9,     // Light passes through
      opacity: 1.0,          // Must be 1 for transmission to work properly
      transparent: true,
      metalness: 0.1,
      roughness: 0.05,       // Smooth surface for clear reflections
      ior: 1.333,            // Real Index of Refraction for water
      thickness: PD,         // Volume thickness for refraction distortion
      envMap: this.envMap,   // Reflect the arched ceiling and lights!
      envMapIntensity: 1.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      side: THREE.FrontSide
    });
    this.water = new THREE.Mesh(waterGeo, waterMat);
    this.water.position.y = 0.35;
    this.poolGroup.add(this.water);

    const posAttr = this.water.geometry.attributes['position'];
    const originY: number[] = [];
    for (let i = 0; i < posAttr.count; i++) originY.push(posAttr.getY(i));
    (this.water as any).__originY = originY;

    // ── Lane lines ───────────────────────────────────────────────────────────
    const laneLineMat = new THREE.MeshStandardMaterial({ color: 0x020617 });
    for (let i = 0; i <= numLanes; i++) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(PL - 1.5, 0.02, 0.15), laneLineMat);
      l.position.set(0, -PD + 0.02, -PW/2 + i * laneW);
      this.poolGroup.add(l);
    }

    // ── Lane Ropes ───────────────────────────────────────────────────────────
    const ropeColors = [0x16a34a, 0x2563eb, 0x2563eb, 0xeab308, 0xeab308, 0xeab308, 0x2563eb, 0x2563eb, 0x16a34a];
    for (let i = 1; i < numLanes; i++) {
      const rZ = -PW/2 + i * laneW;
      const col = ropeColors[i-1] ?? 0xeab308;
      const numBuoys = 100;
      for (let b = 0; b < numBuoys; b++) {
        const isEdge = b < 10 || b > numBuoys - 11;
        const bMat = new THREE.MeshStandardMaterial({ color: isEdge ? 0xdc2626 : col, roughness: 0.2, metalness: 0.1 });
        const buoy = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.18, 16), bMat);
        buoy.rotation.z = Math.PI / 2;
        buoy.position.set(-PL/2 + 0.3 + (b/(numBuoys-1))*(PL-0.6), 0.48, rZ);
        buoy.castShadow = true;
        this.poolGroup.add(buoy);
      }
    }

    // ── Starting Blocks (Red) ────────────────────────────────────────────────
    const blockMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.1 });
    const gripMat  = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.9 });
    [-PL/2 - WT - 0.6, PL/2 + WT + 0.6].forEach((bx, idx) => {
        for (let i = 0; i < numLanes; i++) {
            const cZ = -PW/2 + (i + 0.5) * laneW;
            const plat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, laneW * 0.7), blockMat);
            plat.position.set(bx, 0.25, cZ);
            plat.rotation.z = idx === 0 ? 0.15 : -0.15;
            plat.castShadow = true;
            this.poolGroup.add(plat);
            const grip = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.05, laneW * 0.68), gripMat);
            grip.position.set(bx, 0.42, cZ);
            grip.rotation.z = idx === 0 ? 0.15 : -0.15;
            this.poolGroup.add(grip);
          }
    });

    // ── Spectator Stands ─────────────────────────────────────────────────────
    this.buildStands(PW/2 + WT + 10,  1, PL + 20);
    this.buildStands(-PW/2 - WT - 10, -1, PL + 20);

    // ── Scoreboard ───────────────────────────────────────────────────────────
    const sb = new THREE.Mesh(new THREE.BoxGeometry(16, 6, 1), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    sb.position.set(0, 15, -roomL/2 + 0.5);
    this.poolGroup.add(sb);
    const scr = new THREE.Mesh(new THREE.BoxGeometry(15, 5, 0.2), new THREE.MeshStandardMaterial({ color: 0x991b1b, emissive: 0xef4444, emissiveIntensity: 0.5 }));
    scr.position.set(0, 15, -roomL/2 + 1);
    this.poolGroup.add(scr);

    // ── Controls ─────────────────────────────────────────────────────────────
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    const el = this.container.nativeElement;
    el.addEventListener('mousedown', (e: MouseEvent) => { isDragging = true; prevMouse = { x: e.offsetX, y: e.offsetY }; });
    el.addEventListener('mousemove', (e: MouseEvent) => {
      if (!isDragging) return;
      this.poolGroup.rotation.y += (e.offsetX - prevMouse.x) * 0.004;
      const nx = this.poolGroup.rotation.x + (e.offsetY - prevMouse.y) * 0.003;
      this.poolGroup.rotation.x = Math.max(-0.4, Math.min(0.4, nx));
      prevMouse = { x: e.offsetX, y: e.offsetY };
    });
    el.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      this.camera.position.addScaledVector(dir, -e.deltaY * 0.02);
    }, { passive: false });
    window.addEventListener('mouseup', () => { isDragging = false; });

    new ResizeObserver(() => {
      const w = el.clientWidth; const h = el.clientHeight;
      this.renderer.setSize(w, h);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }).observe(el);

    // ── Animation ─────────────────────────────────────────────────────────────
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      const t = this.clock.getElapsedTime();

      // Fluid, natural wave calculation
      const pos = this.water.geometry.attributes['position'];
      const origY = (this.water as any).__originY as number[];
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        // Mix of sine waves for complex water surface
        const wave = Math.sin(v.x * 0.8 + t * 1.5) * 0.03
                   + Math.sin(v.z * 0.6 - t * 1.2) * 0.03
                   + Math.sin(v.x * 2.5 + v.z * 2.0 + t * 2.8) * 0.01;
        pos.setY(i, origY[i] + wave);
      }
      pos.needsUpdate = true;
      this.water.geometry.computeVertexNormals();

      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  private buildStands(zCenter: number, zSign: number, length: number) {
    const rows = 12, rowDepth = 1.0, rowH = 0.6;
    const cMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.9 }); 
    
    for (let r = 0; r < rows; r++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(length, rowH, rowDepth), cMat);
      step.position.set(0, r * rowH, zCenter + zSign * r * rowDepth);
      step.castShadow = true; step.receiveShadow = true;
      this.poolGroup.add(step);
      
      const seatColor = (r % 3 === 0) ? 0x1e3a8a : (r % 3 === 1) ? 0xb91c1c : 0xf8fafc;
      const sMat = new THREE.MeshStandardMaterial({ color: seatColor, roughness: 0.6 });
      const seat = new THREE.Mesh(new THREE.BoxGeometry(length - 0.3, 0.06, rowDepth * 0.7), sMat);
      seat.position.set(0, r * rowH + rowH / 2 + 0.03, zCenter + zSign * r * rowDepth);
      seat.castShadow = true;
      this.poolGroup.add(seat);
    }
  }
}
