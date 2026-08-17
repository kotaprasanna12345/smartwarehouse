/**
 * SMARTSTOCK AI — 3D Cyber Digital Warehouse Twin (warehouse-3d.js)
 * Fully immersive Three.js spatial engine with dynamic cyber lighting,
 * high-detail industrial racks, animated AGVs, moving forklifts with lifting forks,
 * holographic laser picking simulations, and cinematic camera controls.
 */

class Warehouse3DEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.isSupported = this.checkWebGLSupport();
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.animationFrameId = null;
    this.isPaused = false;
    this.isCinematic = false;
    
    // Raycasting & Interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.interactiveObjects = [];
    this.hoveredZone = null;
    this.selectedZone = null;

    // Simulation Entities
    this.pickers = [];
    this.forklifts = [];
    this.conveyorBoxes = [];
    this.zoneMeshes = {};
    this.shelfLeds = [];
    this.activeRouteMesh = null;
    this.routePulseDot = null;
    this.routePulseProgress = 0;
    this.pickingLaserBeam = null;
    this.bottleneckBeacon = null;
    this.orderRunnerRobot = null;
  }

  checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  init(zonesData = []) {
    if (!this.isSupported || typeof THREE === 'undefined') {
      console.warn('WebGL or Three.js not supported. Falling back to 2D Schematic map.');
      if (window.switchWarehouseViewMode) {
        window.switchWarehouseViewMode('2D');
      }
      return false;
    }

    if (!this.container) return false;

    try {
      this.setupScene();
      this.setupLighting();
      this.setupEnvironment();
      this.setupWarehouseZones(zonesData);
      this.setupWorkstationModels();
      this.setupPickingFleet();
      this.setupEvents();
      this.setupVisibilityObserver();
      this.animate();
      return true;
    } catch (err) {
      console.error('3D Warehouse Initialization error:', err);
      if (window.switchWarehouseViewMode) {
        window.switchWarehouseViewMode('2D');
      }
      return false;
    }
  }

  setupScene() {
    this.scene = new THREE.Scene();
    
    // Deep Space Cyber Background with Atmospheric Fog
    this.scene.background = new THREE.Color(0x050811);
    this.scene.fog = new THREE.FogExp2(0x050811, 0.0075);

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 580;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 350);
    this.camera.position.set(45, 36, 54);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // OrbitControls with smooth damping
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
      this.controls.minDistance = 12;
      this.controls.maxDistance = 135;
      this.controls.target.set(0, 0, 0);
    }
  }

  setupLighting() {
    // 1. Cyber Blue Ambient Lighting
    this.ambientLight = new THREE.AmbientLight(0x0F172A, 1.8);
    this.scene.add(this.ambientLight);

    // 2. Main Directional Overhead Floodlight
    this.sunLight = new THREE.DirectionalLight(0xE2E8F0, 1.1);
    this.sunLight.position.set(35, 55, 35);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 160;
    this.sunLight.shadow.camera.left = -45;
    this.sunLight.shadow.camera.right = 45;
    this.sunLight.shadow.camera.top = 45;
    this.sunLight.shadow.camera.bottom = -45;
    this.scene.add(this.sunLight);

    // 3. Cyber Cyan Aisle Glow PointLight
    const cyanLight = new THREE.PointLight(0x00F0FF, 1.4, 85);
    cyanLight.position.set(-18, 14, -12);
    this.scene.add(cyanLight);

    // 4. Cyber Purple Electronics Bay PointLight
    const purpleLight = new THREE.PointLight(0xA855F7, 1.4, 85);
    purpleLight.position.set(0, 14, -12);
    this.scene.add(purpleLight);

    // 5. Golden Amber Staging Light
    const amberLight = new THREE.PointLight(0xF59E0B, 1.2, 70);
    amberLight.position.set(0, 12, 22);
    this.scene.add(amberLight);
  }

  setupEnvironment() {
    // 1. Dark Cyber Concrete Floor
    const floorGeo = new THREE.PlaneGeometry(88, 76);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090D1A,
      roughness: 0.75,
      metalness: 0.25
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    // 2. Luminous Cyber Grid Overlay
    const grid = new THREE.GridHelper(88, 44, 0x00F0FF, 0x1E293B);
    grid.position.y = 0.02;
    this.scene.add(grid);

    // 3. Glowing Floor Guide Tracks (AGV Navigation Paths)
    this.createFloorGuideTrack(-32, 0, 32, 0, 0x00F0FF);   // Main East-West Highway
    this.createFloorGuideTrack(0, -22, 0, 24, 0x00F0FF);   // Main North-South Highway
  }

  createFloorGuideTrack(x1, z1, x2, z2, color) {
    const points = [new THREE.Vector3(x1, 0.03, z1), new THREE.Vector3(x2, 0.03, z2)];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineDashedMaterial({
      color: color,
      dashSize: 1.5,
      gapSize: 0.8,
      linewidth: 2
    });
    const line = new THREE.Line(geo, mat);
    line.computeLineDistances();
    this.scene.add(line);
  }

  setupWorkstationModels() {
    // 1. RECEIVING BAY (Dock 1-4 with Automated Conveyor)
    this.createWorkstationPad('RECEIVING DOCK', -32, 0, 10, 16, 0x00F0FF);
    this.createConveyorBelt(-32, 0, 12);

    // 2. AUTOMATED PACKING BAY (With robotic sorting arm)
    this.createWorkstationPad('PACKING BAY', 0, 24, 24, 9, 0x10B981);
    this.createRoboticPackingStation(0, 24);

    // 3. SHIPPING & OUTBOUND DOCK (With transport truck model)
    this.createWorkstationPad('SHIPPING DOCK', 32, 0, 10, 16, 0xA855F7);
    this.createShippingTruck(32, 0);
  }

  createWorkstationPad(name, x, z, w, d, color) {
    const padGeo = new THREE.PlaneGeometry(w, d);
    const padMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide
    });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.rotation.x = -Math.PI / 2;
    padMesh.position.set(x, 0.03, z);
    this.scene.add(padMesh);

    // Glowing Neon Border
    const borderGeo = new THREE.EdgesGeometry(padGeo);
    const borderMat = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    const borderLine = new THREE.LineSegments(borderGeo, borderMat);
    borderLine.rotation.x = -Math.PI / 2;
    borderLine.position.set(x, 0.04, z);
    this.scene.add(borderLine);
  }

  createConveyorBelt(x, z, length) {
    const conveyorGroup = new THREE.Group();

    // Bed
    const bedGeo = new THREE.BoxGeometry(2.4, 0.5, length);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.8, roughness: 0.3 });
    const bed = new THREE.Mesh(bedGeo, bedMat);
    bed.position.set(x, 0.6, z);
    conveyorGroup.add(bed);

    // Rollers
    const rollerGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.2, 8);
    const rollerMat = new THREE.MeshStandardMaterial({ color: 0x00F0FF, metalness: 0.9, roughness: 0.2 });
    for (let rz = -length / 2 + 1; rz <= length / 2 - 1; rz += 1.2) {
      const roller = new THREE.Mesh(rollerGeo, rollerMat);
      roller.rotation.z = Math.PI / 2;
      roller.position.set(x, 0.9, z + rz);
      conveyorGroup.add(roller);
    }

    // Moving Inbound Boxes on Conveyor
    const boxGeo = new THREE.BoxGeometry(0.8, 0.6, 0.8);
    const boxColors = [0x00F0FF, 0x10B981, 0xF59E0B];
    for (let b = 0; b < 3; b++) {
      const boxMat = new THREE.MeshStandardMaterial({ color: boxColors[b], roughness: 0.5 });
      const cBox = new THREE.Mesh(boxGeo, boxMat);
      cBox.position.set(x, 1.3, z - 4 + b * 4);
      conveyorGroup.add(cBox);
      this.conveyorBoxes.push({ mesh: cBox, baseZ: z, offsetZ: -4 + b * 4, length: length });
    }

    this.scene.add(conveyorGroup);
  }

  createRoboticPackingStation(x, z) {
    const packGroup = new THREE.Group();

    // Workstation Table
    const tableGeo = new THREE.BoxGeometry(18, 0.8, 4);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.6, roughness: 0.4 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(x, 1.2, z);
    packGroup.add(table);

    // 2 Robotic Arms
    [-6, 6].forEach(rx => {
      const baseGeo = new THREE.CylinderGeometry(0.6, 0.8, 0.5, 12);
      const armMat = new THREE.MeshStandardMaterial({ color: 0x10B981, metalness: 0.7, roughness: 0.3 });
      const armBase = new THREE.Mesh(baseGeo, armMat);
      armBase.position.set(x + rx, 1.85, z);
      packGroup.add(armBase);

      const segmentGeo = new THREE.BoxGeometry(0.3, 1.8, 0.3);
      const armSeg1 = new THREE.Mesh(segmentGeo, armMat);
      armSeg1.position.set(x + rx, 2.8, z);
      armSeg1.rotation.z = rx < 0 ? 0.35 : -0.35;
      packGroup.add(armSeg1);
    });

    this.scene.add(packGroup);
  }

  createShippingTruck(x, z) {
    const truckGroup = new THREE.Group();

    // Cargo Trailer Body
    const trailerGeo = new THREE.BoxGeometry(4.2, 4.5, 12);
    const trailerMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.4, roughness: 0.5 });
    const trailer = new THREE.Mesh(trailerGeo, trailerMat);
    trailer.position.set(x + 2, 2.8, z);
    trailer.castShadow = true;
    truckGroup.add(trailer);

    // Cab
    const cabGeo = new THREE.BoxGeometry(4.0, 3.8, 3.5);
    const cabMat = new THREE.MeshStandardMaterial({ color: 0xA855F7, metalness: 0.6, roughness: 0.3 });
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(x + 2, 2.4, z + 7.5);
    cab.castShadow = true;
    truckGroup.add(cab);

    // Neon Tail Lights
    const lightGeo = new THREE.BoxGeometry(0.8, 0.3, 0.1);
    const redLightMat = new THREE.MeshBasicMaterial({ color: 0xFF3366 });
    const tailL = new THREE.Mesh(lightGeo, redLightMat);
    tailL.position.set(x + 0.8, 1.2, z - 6.05);
    truckGroup.add(tailL);
    const tailR = new THREE.Mesh(lightGeo, redLightMat);
    tailR.position.set(x + 3.2, 1.2, z - 6.05);
    truckGroup.add(tailR);

    this.scene.add(truckGroup);
  }

  setupWarehouseZones(zonesData) {
    const zoneConfigs = [
      { code: 'ZONE A', name: 'Fast Moving & High Velocity', x: -16, z: -10, color: 0x00F0FF, focus: 'High Velocity Consumer' },
      { code: 'ZONE B', name: 'Electronics & High Value', x: 0, z: -10, color: 0xA855F7, focus: 'Electronics & Audio' },
      { code: 'ZONE C', name: 'Heavy Freight & Machinery', x: 16, z: -10, color: 0xFF3366, focus: 'Bulky & Heavy Goods' },
      { code: 'ZONE D', name: 'Cold Chain & Pharmaceuticals', x: -16, z: 8, color: 0x06B6D4, focus: 'Cold Chain (4°C)' },
      { code: 'ZONE E', name: 'Overstock & Bulk Pallets', x: 16, z: 8, color: 0xF59E0B, focus: 'Reserve Pallets' }
    ];

    zoneConfigs.forEach(cfg => {
      const liveData = (zonesData || []).find(z => z.zone_code === cfg.code) || {};
      const occupancy = liveData.capacity ? Math.round((liveData.occupied / liveData.capacity) * 100) : 75;
      const congestion = liveData.congestion_level !== undefined ? liveData.congestion_level : 40;
      const pickersCount = liveData.picker_count || 3;
      const isBottleneck = cfg.code === 'ZONE C' && congestion > 50;

      let statusColor = cfg.color;
      if (isBottleneck) statusColor = 0xFF3366;
      else if (congestion > 50) statusColor = 0xF59E0B;

      // Zone Floor Pad with Neon Glow
      const zoneGeo = new THREE.PlaneGeometry(12, 14);
      const zoneMat = new THREE.MeshBasicMaterial({
        color: statusColor,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide
      });
      const zoneFloor = new THREE.Mesh(zoneGeo, zoneMat);
      zoneFloor.rotation.x = -Math.PI / 2;
      zoneFloor.position.set(cfg.x, 0.04, cfg.z);
      this.scene.add(zoneFloor);

      // Glowing Neon Perimeter Border
      const borderGeo = new THREE.EdgesGeometry(zoneGeo);
      const borderMat = new THREE.LineBasicMaterial({ color: statusColor, linewidth: 2 });
      const borderLine = new THREE.LineSegments(borderGeo, borderMat);
      borderLine.rotation.x = -Math.PI / 2;
      borderLine.position.set(cfg.x, 0.05, cfg.z);
      this.scene.add(borderLine);

      // High Detail Industrial Pallet Racks
      const rackGroup = this.createStorageRacks(cfg.x, cfg.z, statusColor, cfg.code);
      this.scene.add(rackGroup);

      // Raycast Bounding Box
      const hitGeo = new THREE.BoxGeometry(13, 8, 15);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitBox = new THREE.Mesh(hitGeo, hitMat);
      hitBox.position.set(cfg.x, 4, cfg.z);
      hitBox.userData = {
        isZone: true,
        zoneCode: cfg.code,
        zoneName: cfg.name,
        categoryFocus: cfg.focus,
        occupancy: occupancy,
        congestion: congestion,
        pickers: pickersCount,
        orders: cfg.code === 'ZONE C' ? 14 : (cfg.code === 'ZONE A' ? 8 : 4),
        status: isBottleneck ? 'BOTTLENECK' : (congestion > 50 ? 'BUSY' : 'OPTIMAL'),
        color: statusColor
      };
      this.scene.add(hitBox);
      this.interactiveObjects.push(hitBox);
      this.zoneMeshes[cfg.code] = { hitBox, floor: zoneFloor, border: borderLine, rackGroup };

      // Pulsing Bottleneck Beacon (Zone C)
      if (isBottleneck) {
        this.createBottleneckBeacon(cfg.x, cfg.z);
      }
    });
  }

  createStorageRacks(centerX, centerZ, zoneColor, zoneCode) {
    const group = new THREE.Group();
    const aisleOffsets = [-3.5, 3.5];

    const postGeo = new THREE.BoxGeometry(0.25, 5.8, 0.25);
    const beamGeo = new THREE.BoxGeometry(6.4, 0.18, 0.25);
    const palletGeo = new THREE.BoxGeometry(1.6, 0.16, 1.4);
    const boxGeo = new THREE.BoxGeometry(0.72, 0.65, 0.62);
    const ledGeo = new THREE.SphereGeometry(0.1, 8, 8);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const beamMat = new THREE.MeshStandardMaterial({ color: zoneColor, metalness: 0.6, roughness: 0.4 });
    const palletMat = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.9 });

    const boxColors = [0x00F0FF, 0x10B981, 0xF59E0B, 0xA855F7, 0x38BDF8];

    aisleOffsets.forEach(xOffset => {
      const rackX = centerX + xOffset;

      // 4 Steel Corner Uprights
      [-3, 3].forEach(px => {
        [-0.85, 0.85].forEach(pz => {
          const post = new THREE.Mesh(postGeo, metalMat);
          post.position.set(rackX + px, 2.9, centerZ + pz);
          post.castShadow = true;
          group.add(post);
        });
      });

      // 3 Shelf Tiers
      [1.2, 2.9, 4.6].forEach((levelY, lvlIdx) => {
        // Crossbeams
        [-0.85, 0.85].forEach(pz => {
          const beam = new THREE.Mesh(beamGeo, beamMat);
          beam.position.set(rackX, levelY, centerZ + pz);
          group.add(beam);
        });

        // 3 Pallet Bays with Stock Level Status LEDs
        [-2, 0, 2].forEach((palX, pIdx) => {
          const pallet = new THREE.Mesh(palletGeo, palletMat);
          pallet.position.set(rackX + palX, levelY + 0.1, centerZ);
          pallet.castShadow = true;
          group.add(pallet);

          // LED Indicator Light on Shelf
          const isCritical = zoneCode === 'ZONE C' && lvlIdx === 0 && pIdx === 1;
          const ledMat = new THREE.MeshBasicMaterial({ color: isCritical ? 0xFF3366 : (pIdx === 2 ? 0xF59E0B : 0x10B981) });
          const led = new THREE.Mesh(ledGeo, ledMat);
          led.position.set(rackX + palX, levelY + 0.25, centerZ + 0.9);
          group.add(led);
          this.shelfLeds.push({ mesh: led, isCritical: isCritical });

          // Product Boxes on Pallet
          const boxCount = ((lvlIdx + pIdx) % 3) + 2;
          for (let b = 0; b < boxCount; b++) {
            const bCol = boxColors[(lvlIdx + pIdx + b) % boxColors.length];
            const boxMat = new THREE.MeshStandardMaterial({ color: bCol, roughness: 0.45, metalness: 0.2 });
            const box = new THREE.Mesh(boxGeo, boxMat);
            const bx = rackX + palX + ((b % 2) - 0.5) * 0.5;
            const by = levelY + 0.2 + (b >= 2 ? 0.65 : 0.32);
            const bz = centerZ + ((Math.floor(b / 2) % 2) - 0.5) * 0.4;
            box.position.set(bx, by, bz);
            box.castShadow = true;
            group.add(box);
          }
        });
      });
    });

    return group;
  }

  createBottleneckBeacon(x, z) {
    if (this.bottleneckBeacon) {
      this.scene.remove(this.bottleneckBeacon.group);
    }

    const beaconGroup = new THREE.Group();

    // Pulsing Ground Ring
    const ringGeo = new THREE.RingGeometry(5.8, 6.6, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xFF3366,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(x, 0.08, z);
    beaconGroup.add(ringMesh);

    // Holographic Warning Light Column
    const cylinderGeo = new THREE.CylinderGeometry(0.2, 4.8, 9, 16, 1, true);
    const cylinderMat = new THREE.MeshBasicMaterial({
      color: 0xFF3366,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide
    });
    const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
    cylinder.position.set(x, 4.5, z);
    beaconGroup.add(cylinder);

    this.bottleneckBeacon = { group: beaconGroup, ring: ringMesh, cylinder: cylinder };
    this.scene.add(beaconGroup);
  }

  setupPickingFleet() {
    // 1. Autonomous AGV Transport Pickers
    const pickerRoutes = [
      { start: new THREE.Vector3(-16, 0.5, -10), end: new THREE.Vector3(0, 0.5, 24), speed: 0.038, progress: 0, name: 'AGV Robot #01 (Zone A)' },
      { start: new THREE.Vector3(0, 0.5, -10), end: new THREE.Vector3(0, 0.5, 24), speed: 0.034, progress: 0.35, name: 'AGV Robot #02 (Zone B)' },
      { start: new THREE.Vector3(16, 0.5, -10), end: new THREE.Vector3(0, 0.5, 24), speed: 0.028, progress: 0.7, name: 'AGV Robot #03 (Zone C)' },
      { start: new THREE.Vector3(-16, 0.5, 8), end: new THREE.Vector3(0, 0.5, 24), speed: 0.036, progress: 0.2, name: 'AGV Robot #04 (Zone D)' },
      { start: new THREE.Vector3(16, 0.5, 8), end: new THREE.Vector3(0, 0.5, 24), speed: 0.031, progress: 0.55, name: 'AGV Robot #05 (Zone E)' }
    ];

    pickerRoutes.forEach((r, idx) => {
      const agvGroup = new THREE.Group();

      // Cyber Rover Base
      const baseGeo = new THREE.BoxGeometry(1.2, 0.4, 1.6);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x090D1A, metalness: 0.8, roughness: 0.2 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.25;
      base.castShadow = true;
      agvGroup.add(base);

      // Glowing Neon Base Underglow
      const underglowGeo = new THREE.PlaneGeometry(1.4, 1.8);
      const underglowMat = new THREE.MeshBasicMaterial({ color: 0x00F0FF, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
      const underglow = new THREE.Mesh(underglowGeo, underglowMat);
      underglow.rotation.x = -Math.PI / 2;
      underglow.position.y = 0.04;
      agvGroup.add(underglow);

      // Tote Container Box
      const toteGeo = new THREE.BoxGeometry(0.9, 0.55, 1.1);
      const toteMat = new THREE.MeshStandardMaterial({ color: idx === 2 ? 0xFF3366 : 0x00F0FF, roughness: 0.4 });
      const tote = new THREE.Mesh(toteGeo, toteMat);
      tote.position.y = 0.7;
      agvGroup.add(tote);

      agvGroup.position.copy(r.start);
      this.scene.add(agvGroup);
      this.pickers.push({ mesh: agvGroup, ...r });
    });

    // 2. High Detail Animated Forklifts with Hydraulic Lifting Forks
    const forkliftRoutes = [
      { start: new THREE.Vector3(-28, 0.8, 0), end: new THREE.Vector3(16, 0.8, -10), speed: 0.024, progress: 0.1 },
      { start: new THREE.Vector3(0, 0.8, 24), end: new THREE.Vector3(28, 0.8, 0), speed: 0.028, progress: 0.6 }
    ];

    forkliftRoutes.forEach(fr => {
      const fGroup = new THREE.Group();

      // Chassis
      const bodyGeo = new THREE.BoxGeometry(1.8, 1.2, 2.4);
      const forkMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.6, roughness: 0.3 });
      const body = new THREE.Mesh(bodyGeo, forkMat);
      body.position.y = 0.7;
      body.castShadow = true;
      fGroup.add(body);

      // Overhead Roll Cage
      const cageGeo = new THREE.BoxGeometry(1.6, 1.4, 1.4);
      const cageMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.9, wireframe: true });
      const cage = new THREE.Mesh(cageGeo, cageMat);
      cage.position.set(0, 2.0, -0.3);
      fGroup.add(cage);

      // Hydraulic Mast
      const mastGeo = new THREE.BoxGeometry(0.18, 2.6, 1.4);
      const mast = new THREE.Mesh(mastGeo, forkMat);
      mast.position.set(0, 1.4, 1.25);
      fGroup.add(mast);

      // Animated Lifting Forks
      const forkProngGeo = new THREE.BoxGeometry(0.8, 0.08, 1.2);
      const prongMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 });
      const forks = new THREE.Mesh(forkProngGeo, prongMat);
      forks.position.set(0, 0.4, 1.7);
      fGroup.add(forks);

      fGroup.position.copy(fr.start);
      this.scene.add(fGroup);
      this.forklifts.push({ mesh: fGroup, forks: forks, ...fr });
    });
  }

  showOrderPickingRoute(orderNumber) {
    if (this.activeRouteMesh) {
      this.scene.remove(this.activeRouteMesh);
      this.activeRouteMesh = null;
    }
    if (this.routePulseDot) {
      this.scene.remove(this.routePulseDot);
      this.routePulseDot = null;
    }
    if (this.pickingLaserBeam) {
      this.scene.remove(this.pickingLaserBeam);
      this.pickingLaserBeam = null;
    }

    let waypoints = [];
    let title = `Order Route #${orderNumber}`;
    let dist = '48m';
    let time = '4.5 min';
    let picks = '3 SKUs (Zone A)';
    let targetRack = new THREE.Vector3(-16, 0.4, -10);

    if (orderNumber === 'ORD-1092') {
      targetRack = new THREE.Vector3(-16, 0.4, -10);
      waypoints = [
        new THREE.Vector3(-16, 0.4, -10),
        new THREE.Vector3(-16, 0.4, -3),
        new THREE.Vector3(-6, 0.4, 0),
        new THREE.Vector3(0, 0.4, 18),
        new THREE.Vector3(30, 0.4, 0)
      ];
      dist = '48m';
      time = '4.5 min';
      picks = '3 SKUs (Zone A)';
    } else if (orderNumber === 'ORD-1088') {
      targetRack = new THREE.Vector3(0, 0.4, -10);
      waypoints = [
        new THREE.Vector3(0, 0.4, -10),
        new THREE.Vector3(0, 0.4, 0),
        new THREE.Vector3(0, 0.4, 18),
        new THREE.Vector3(30, 0.4, 0)
      ];
      dist = '36m';
      time = '3.8 min';
      picks = '2 SKUs (Zone B)';
    } else if (orderNumber === 'ORD-1099') {
      targetRack = new THREE.Vector3(16, 0.4, -10);
      waypoints = [
        new THREE.Vector3(16, 0.4, -10),
        new THREE.Vector3(16, 0.4, 0),
        new THREE.Vector3(0, 0.4, 18),
        new THREE.Vector3(30, 0.4, 0)
      ];
      dist = '64m';
      time = '6.8 min';
      picks = '4 SKUs (Heavy Freight)';
    } else {
      return;
    }

    // 1. Glowing Neon 3D Spline Ribbon
    const curve = new THREE.CatmullRomCurve3(waypoints);
    const points = curve.getPoints(80);
    const routeGeo = new THREE.BufferGeometry().setFromPoints(points);
    const routeMat = new THREE.LineDashedMaterial({
      color: 0x00F0FF,
      dashSize: 1.4,
      gapSize: 0.6,
      linewidth: 3
    });
    this.activeRouteMesh = new THREE.Line(routeGeo, routeMat);
    this.activeRouteMesh.computeLineDistances();
    this.scene.add(this.activeRouteMesh);

    // 2. Animated Energy Pulse Orb
    const pulseGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0x00F0FF });
    this.routePulseDot = new THREE.Mesh(pulseGeo, pulseMat);
    this.routePulseDot.position.copy(waypoints[0]);
    this.scene.add(this.routePulseDot);
    this.routeCurve = curve;
    this.routePulseProgress = 0;

    // 3. Holographic Laser Scanning Beam at Target Rack
    const laserGeo = new THREE.CylinderGeometry(0.08, 0.08, 5.5, 12);
    const laserMat = new THREE.MeshBasicMaterial({ color: 0x00F0FF, transparent: true, opacity: 0.85 });
    this.pickingLaserBeam = new THREE.Mesh(laserGeo, laserMat);
    this.pickingLaserBeam.position.set(targetRack.x, 2.75, targetRack.z);
    this.scene.add(this.pickingLaserBeam);

    // 4. Update HUD Card
    const hudCard = document.getElementById('routeHudCard');
    const hudTitle = document.getElementById('routeHudTitle');
    const hudDist = document.getElementById('routeHudDist');
    const hudTime = document.getElementById('routeHudTime');
    const hudPicks = document.getElementById('routeHudPicks');

    if (hudCard) {
      hudCard.style.display = 'block';
      if (hudTitle) hudTitle.textContent = title;
      if (hudDist) hudDist.textContent = dist;
      if (hudTime) hudTime.textContent = time;
      if (hudPicks) hudPicks.textContent = picks;
    }
  }

  clearPickingRoute() {
    if (this.activeRouteMesh) {
      this.scene.remove(this.activeRouteMesh);
      this.activeRouteMesh = null;
    }
    if (this.routePulseDot) {
      this.scene.remove(this.routePulseDot);
      this.routePulseDot = null;
    }
    if (this.pickingLaserBeam) {
      this.scene.remove(this.pickingLaserBeam);
      this.pickingLaserBeam = null;
    }
    const hudCard = document.getElementById('routeHudCard');
    if (hudCard) hudCard.style.display = 'none';

    const select = document.getElementById('pickingRouteOrderSelect');
    if (select) select.value = '';
  }

  setupEvents() {
    const canvas = this.renderer.domElement;

    // Raycast Mouse Move
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.handleRaycastHover(e);
    });

    // Mouse Leave
    canvas.addEventListener('mouseleave', () => {
      this.hideHUDTooltip();
    });

    // Click on Zone to open Drawer and focus camera
    canvas.addEventListener('click', () => {
      if (this.hoveredZone) {
        if (window.openZoneInspectionDrawer) {
          window.openZoneInspectionDrawer(this.hoveredZone.zoneCode);
        }
      }
    });

    // Window Resize
    window.addEventListener('resize', () => this.handleResize());
  }

  handleRaycastHover(mouseEvent) {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const data = hit.userData;

      if (data && data.isZone) {
        this.hoveredZone = data;
        this.showHUDTooltip(data, mouseEvent);
        document.body.style.cursor = 'pointer';
        return;
      }
    }

    this.hoveredZone = null;
    this.hideHUDTooltip();
    document.body.style.cursor = 'default';
  }

  showHUDTooltip(data, event) {
    const tooltip = document.getElementById('hudZoneTooltip');
    if (!tooltip) return;

    document.getElementById('hudZoneCode').textContent = data.zoneCode;
    document.getElementById('hudZoneStatus').textContent = data.status;
    document.getElementById('hudZoneStatus').className = `hud-zone-status status-${data.status.toLowerCase()}`;
    document.getElementById('hudOccupancy').textContent = `${data.occupancy}%`;
    document.getElementById('hudActiveOrders').textContent = data.orders;
    document.getElementById('hudPickers').textContent = `${data.pickers} active`;
    document.getElementById('hudCongestion').textContent = `${data.congestion}% (${data.congestion > 50 ? 'HIGH' : 'NORMAL'})`;

    const rect = this.container.getBoundingClientRect();
    const x = event.clientX - rect.left + 16;
    const y = event.clientY - rect.top + 16;

    tooltip.style.left = `${Math.min(x, rect.width - 240)}px`;
    tooltip.style.top = `${Math.min(y, rect.height - 180)}px`;
    tooltip.style.display = 'block';
  }

  hideHUDTooltip() {
    const tooltip = document.getElementById('hudZoneTooltip');
    if (tooltip) tooltip.style.display = 'none';
  }

  setCameraPreset(preset) {
    if (!this.camera || !this.controls) return;

    this.isCinematic = (preset === 'cinematic');

    if (preset === 'isometric') {
      this.smoothMoveCamera(new THREE.Vector3(45, 36, 54), new THREE.Vector3(0, 0, 0));
    } else if (preset === 'topdown') {
      this.smoothMoveCamera(new THREE.Vector3(0, 80, 0.1), new THREE.Vector3(0, 0, 0));
    } else if (preset === 'zoneA') {
      this.smoothMoveCamera(new THREE.Vector3(-16, 18, 16), new THREE.Vector3(-16, 2, -10));
    } else if (preset === 'zoneC') {
      this.smoothMoveCamera(new THREE.Vector3(16, 18, 16), new THREE.Vector3(16, 2, -10));
    }
  }

  smoothMoveCamera(targetPos, targetLookAt) {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    let progress = 0;

    const animateTransition = () => {
      progress += 0.05;
      this.camera.position.lerpVectors(startPos, targetPos, progress);
      this.controls.target.lerpVectors(startTarget, targetLookAt, progress);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animateTransition);
      }
    };
    animateTransition();
  }

  setupVisibilityObserver() {
    if ('IntersectionObserver' in window && this.container) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          this.isPaused = !entry.isIntersecting;
        });
      }, { threshold: 0.1 });
      observer.observe(this.container);
    }
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    if (this.isPaused) return;

    const time = Date.now() * 0.001;

    // 1. Controls & Cinematic Auto-Rotation
    if (this.controls) {
      if (this.isCinematic) {
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 1.2;
      } else {
        this.controls.autoRotate = false;
      }
      this.controls.update();
    }

    // 2. Animate AGV Pickers
    this.pickers.forEach(p => {
      p.progress += p.speed * 0.1;
      if (p.progress > 1) p.progress = 0;
      const alpha = Math.sin(p.progress * Math.PI);
      p.mesh.position.lerpVectors(p.start, p.end, alpha);
    });

    // 3. Animate Forklifts & Hydraulic Lift Forks
    this.forklifts.forEach(f => {
      f.progress += f.speed * 0.08;
      if (f.progress > 1) f.progress = 0;
      const alpha = Math.sin(f.progress * Math.PI);
      f.mesh.position.lerpVectors(f.start, f.end, alpha);

      // Fork lifting animation
      if (f.forks) {
        f.forks.position.y = 0.4 + Math.sin(time * 2.0) * 0.6;
      }
    });

    // 4. Animate Inbound Conveyor Boxes
    this.conveyorBoxes.forEach(cb => {
      cb.mesh.position.z += 0.04;
      if (cb.mesh.position.z > cb.baseZ + cb.length / 2) {
        cb.mesh.position.z = cb.baseZ - cb.length / 2;
      }
    });

    // 5. Animate Bottleneck Pulsing Beacon
    if (this.bottleneckBeacon) {
      const pulseScale = 1.0 + Math.sin(time * 4.0) * 0.16;
      this.bottleneckBeacon.ring.scale.set(pulseScale, pulseScale, 1);
      this.bottleneckBeacon.cylinder.material.opacity = 0.15 + Math.sin(time * 4.0) * 0.1;
    }

    // 6. Animate Active Picking Spline Pulse & Laser
    if (this.routePulseDot && this.routeCurve) {
      this.routePulseProgress += 0.009;
      if (this.routePulseProgress > 1) this.routePulseProgress = 0;
      const point = this.routeCurve.getPoint(this.routePulseProgress);
      if (point) this.routePulseDot.position.copy(point);
    }

    if (this.pickingLaserBeam) {
      this.pickingLaserBeam.material.opacity = 0.5 + Math.sin(time * 8.0) * 0.4;
    }

    // 7. Render
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 580;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
      this.renderer.dispose();
    }
  }
}

// Global Singleton
window.warehouse3D = null;

window.initWarehouse3DScene = function(zonesData) {
  if (!window.warehouse3D) {
    window.warehouse3D = new Warehouse3DEngine('threejsCanvasContainer');
  }
  return window.warehouse3D.init(zonesData);
};

