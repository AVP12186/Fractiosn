import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  Enemy,
  RuneGate,
  Chest,
  Torch,
  SpellType,
  Fraction,
  CharacterConfig,
  Stairs,
  fractionToString,
} from '../types/game';
import {
  createFloorTexture,
  createWallTexture,
  createCustomPlayerTexture,
  createSlime64Texture,
  createGolem64Texture,
  createBoss64Texture,
  createGorgonBoss64Texture,
  createShadowWraith64Texture,
  createMagmaChimera64Texture,
  createPillarTexture,
  createChestTexture,
  createStairsTexture,
} from './pixelTextures';
import { FormattedFraction } from '../components/FormattedFraction';
import { sound } from '../audio/soundEngine';
import type { CoopPlayer } from '../types/multiplayer';

interface Projectile {
  mesh: THREE.Mesh;
  light: THREE.PointLight;
  type: SpellType;
  fraction: Fraction;
  dir: THREE.Vector3;
  pos: THREE.Vector3;
  targetEnemyId?: string;
  life: number;
}

interface DungeonViewProps {
  playerPos: { x: number; z: number };
  onMovePlayer: (pos: { x: number; z: number }) => void;
  enemies: Enemy[];
  gates: RuneGate[];
  chests: Chest[];
  torches: Torch[];
  roomWidth: number;
  roomHeight: number;
  activeSpellProjectiles: { type: SpellType; fraction: Fraction; targetEnemyId?: string; timestamp: number }[];
  characterConfig?: CharacterConfig;
  stairs?: Stairs;
  onAscendStairs?: () => void;
  onInteractGate?: (gate: RuneGate) => void;
  onInteractChest?: (chest: Chest) => void;
  onTargetEnemy?: (enemy: Enemy) => void;
  onMobAttackPlayer?: (enemy: Enemy) => void;
  isInvulnerable?: boolean;
  isBossRoom?: boolean;
  joystickVector?: { vx: number; vz: number };
  isBattleActive?: boolean;
  multiplayer?: boolean;
  remotePlayers?: CoopPlayer[];
}

export const DungeonView: React.FC<DungeonViewProps> = ({
  playerPos,
  onMovePlayer,
  enemies,
  gates,
  chests,
  torches,
  roomWidth,
  roomHeight,
  activeSpellProjectiles,
  characterConfig = { robeColor: '#2563eb', hatStyle: 'wizard', accessory: 'none', wandStyle: 'wood' },
  stairs,
  onAscendStairs,
  onInteractGate,
  onInteractChest,
  onTargetEnemy,
  onMobAttackPlayer,
  isInvulnerable = false,
  isBossRoom = false,
  joystickVector,
  isBattleActive = false,
  multiplayer = false,
  remotePlayers = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Mesh handles
  const playerMeshRef = useRef<THREE.Group | null>(null);
  const enemyMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const chestMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const gateMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const stairsMeshRef = useRef<THREE.Group | null>(null);
  const projectilesRef = useRef<Projectile[]>([]);
  const processedSpellTimestampRef = useRef<number>(0);
  const torchLightsRef = useRef<THREE.PointLight[]>([]);
  const remoteMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const latest = useRef({ enemies, onMovePlayer, onTargetEnemy, multiplayer });
  latest.current = { enemies, onMovePlayer, onTargetEnemy, multiplayer };

  const isBattleActiveRef = useRef(false);
  
  useEffect(() => {
    isBattleActiveRef.current = !!isBattleActive;
  }, [isBattleActive]);

  // Smooth interpolation state & waddle timer
  const targetPlayerPosRef = useRef({ x: playerPos.x, z: playerPos.z });
  const currentPlayerPosRef = useRef({ x: playerPos.x, z: playerPos.z });
  const walkCycleTimerRef = useRef(0);
  const joystickVectorRef = useRef(joystickVector);
  const lastAscendCheckRef = useRef(0);
  const lastMobAttackCheckRef = useRef(0);

  useEffect(() => {
    joystickVectorRef.current = joystickVector;
  }, [joystickVector]);

  useEffect(() => {
    const d = Math.hypot(playerPos.x - targetPlayerPosRef.current.x, playerPos.z - targetPlayerPosRef.current.z);
    if (d > 0.01) {
      targetPlayerPosRef.current = { x: playerPos.x, z: playerPos.z };
      if (d > 3) currentPlayerPosRef.current = { x: playerPos.x, z: playerPos.z };
    }
  }, [playerPos.x, playerPos.z]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup - Bright & clear background
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#141d2f');
    scene.fog = new THREE.FogExp2('#141d2f', 0.008);

    // 2. Camera: Isometric 2.5D tilted perspective
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(playerPos.x, 16, playerPos.z + 14);
    camera.lookAt(playerPos.x, 0, playerPos.z);

    // 3. Renderer with high visibility exposure
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 4. Bright Lighting Rig
    const ambientLight = new THREE.AmbientLight('#94a3b8', 2.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#ffffff', 2.2);
    dirLight.position.set(10, 24, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    const d = 16;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // 5. Procedural Dungeon Room Geometry
    const floorTexture = createFloorTexture();
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(roomWidth / 2, roomHeight / 2);

    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomHeight);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.85,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Dungeon Perimeter Walls
    const wallTexture = createWallTexture();
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(roomWidth / 4, 1);

    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.8,
    });

    const northWallGeo = new THREE.BoxGeometry(roomWidth, 4, 0.8);
    const northWall = new THREE.Mesh(northWallGeo, wallMat);
    northWall.position.set(0, 2, -roomHeight / 2);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    scene.add(northWall);

    const westWallGeo = new THREE.BoxGeometry(0.8, 4, roomHeight);
    const westWall = new THREE.Mesh(westWallGeo, wallMat);
    westWall.position.set(-roomWidth / 2, 2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    scene.add(westWall);

    const eastWallGeo = new THREE.BoxGeometry(0.8, 4, roomHeight);
    const eastWall = new THREE.Mesh(eastWallGeo, wallMat);
    eastWall.position.set(roomWidth / 2, 2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    scene.add(eastWall);

    // Rune Pillars
    const pillarTexture = createPillarTexture();
    const pillarMat = new THREE.MeshStandardMaterial({
      map: pillarTexture,
      roughness: 0.8,
    });
    const pillarGeo = new THREE.CylinderGeometry(0.7, 0.8, 3.6, 8);

    const pillarPositions = [
      { x: -roomWidth / 3, z: -roomHeight / 3 },
      { x: roomWidth / 3, z: -roomHeight / 3 },
      { x: -roomWidth / 3, z: roomHeight / 3 },
      { x: roomWidth / 3, z: roomHeight / 3 },
    ];

    pillarPositions.forEach((pos) => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(pos.x, 1.8, pos.z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
    });

    // Torches with Dynamic Point Lights
    torches.forEach((torchData) => {
      const torchGroup = new THREE.Group();
      torchGroup.position.set(torchData.x, 2.2, torchData.z);

      const sconceGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.8, 6);
      const sconceMat = new THREE.MeshStandardMaterial({ color: '#78350f' });
      const sconce = new THREE.Mesh(sconceGeo, sconceMat);
      torchGroup.add(sconce);

      const flameGeo = new THREE.SphereGeometry(0.18, 6, 6);
      const flameMat = new THREE.MeshBasicMaterial({ color: torchData.color });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.y = 0.45;
      torchGroup.add(flame);

      const pLight = new THREE.PointLight(torchData.color, torchData.intensity * 2.2, 14, 1.2);
      pLight.position.y = 0.5;
      pLight.castShadow = true;
      pLight.shadow.bias = -0.002;
      torchGroup.add(pLight);

      torchLightsRef.current.push(pLight);
      scene.add(torchGroup);
    });

    // 6. Actual 3D Ascending Stairs
    if (stairs) {
      const stairsGroup = new THREE.Group();
      stairsGroup.position.set(stairs.x, 0, stairs.z);

      const stairsTexture = createStairsTexture();
      const stairsMat = new THREE.MeshStandardMaterial({
        map: stairsTexture,
        roughness: 0.7,
      });

      // 4 tiered stone steps
      for (let s = 0; s < 4; s++) {
        const stepGeo = new THREE.BoxGeometry(2.6, 0.25, 0.6);
        const stepMesh = new THREE.Mesh(stepGeo, stairsMat);
        stepMesh.position.set(0, 0.125 + s * 0.25, -s * 0.5 + 0.75);
        stepMesh.castShadow = true;
        stepMesh.receiveShadow = true;
        stairsGroup.add(stepMesh);
      }

      // Glowing Ascension Aura Light
      const stairsLight = new THREE.PointLight(stairs.active ? '#f59e0b' : '#38bdf8', stairs.active ? 2.8 : 1.2, 8);
      stairsLight.position.set(0, 2.0, -0.8);
      stairsLight.castShadow = true;
      stairsGroup.add(stairsLight);

      // Top Portal Gateway Ring
      const ringGeo = new THREE.TorusGeometry(1.2, 0.08, 8, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: stairs.active ? '#fbbf24' : '#64748b' });
      const portalRing = new THREE.Mesh(ringGeo, ringMat);
      portalRing.name = 'portalRing';
      portalRing.position.set(0, 1.8, -1.0);
      stairsGroup.add(portalRing);

      scene.add(stairsGroup);
      stairsMeshRef.current = stairsGroup;
    }

    // 7. Player Mesh (Arc the Alchemist with custom 64x64 texture)
    const playerGroup = new THREE.Group();
    playerGroup.position.set(playerPos.x, 0, playerPos.z);

    const playerTex = createCustomPlayerTexture(characterConfig);
    const playerMat = new THREE.MeshStandardMaterial({
      map: playerTex,
      transparent: true,
      alphaTest: 0.3,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });
    const playerGeo = new THREE.PlaneGeometry(1.6, 1.6);
    const playerQuad = new THREE.Mesh(playerGeo, playerMat);
    playerQuad.name = 'playerQuad';
    playerQuad.position.y = 0.9;
    playerQuad.rotation.x = -Math.PI / 6;
    playerQuad.castShadow = true;
    playerGroup.add(playerQuad);

    // Contact shadow
    const shadowGeo = new THREE.CircleGeometry(0.6, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.4 });
    const playerContactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    playerContactShadow.rotation.x = -Math.PI / 2;
    playerContactShadow.position.y = 0.02;
    playerGroup.add(playerContactShadow);

    // Arc's Lantern Aura
    const playerLight = new THREE.PointLight('#fef08a', 2.8, 16);
    playerLight.position.y = 1.2;
    playerGroup.add(playerLight);

    scene.add(playerGroup);
    playerMeshRef.current = playerGroup;

    // Raycaster for click-to-move
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(floor);

      if (intersects.length > 0) {
        const pt = intersects[0].point;
        const halfW = roomWidth / 2 - 1.2;
        const halfH = roomHeight / 2 - 1.2;
        const tx = Math.max(-halfW, Math.min(halfW, pt.x));
        const tz = Math.max(-halfH, Math.min(halfH, pt.z));
        targetPlayerPosRef.current = { x: tx, z: tz };
        latest.current.onMovePlayer({ x: tx, z: tz });
        sound.playStep();
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 8. Animation & Render Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Fluid Continuous Joystick Movement
      const joy = joystickVectorRef.current;
      const target = targetPlayerPosRef.current;
      const cur = currentPlayerPosRef.current;
      let hasJoystickInput = false;

      if (!isBattleActiveRef.current && joy && (Math.abs(joy.vx) > 0.04 || Math.abs(joy.vz) > 0.04)) {
        hasJoystickInput = true;
        const speed = 9.5;
        const halfW = roomWidth / 2 - 1.2;
        const halfH = roomHeight / 2 - 1.2;

        target.x = Math.max(-halfW, Math.min(halfW, target.x + joy.vx * speed * delta));
        target.z = Math.max(-halfH, Math.min(halfH, target.z + joy.vz * speed * delta));
        latest.current.onMovePlayer({ ...target });
      }

      const dx = target.x - cur.x;
      const dz = target.z - cur.z;
      const dist = Math.hypot(dx, dz);
      const isMoving = dist > 0.05 || hasJoystickInput;

      // Snappy, responsive damping
      cur.x = THREE.MathUtils.damp(cur.x, target.x, 12, delta);
      cur.z = THREE.MathUtils.damp(cur.z, target.z, 12, delta);

      if (playerMeshRef.current) {
        playerMeshRef.current.position.set(cur.x, 0, cur.z);

        const playerQuad = playerMeshRef.current.getObjectByName('playerQuad') as THREE.Mesh | undefined;
        if (playerQuad) {
          if (isMoving) {
            walkCycleTimerRef.current += delta * 15;
            // Waddle tilt
            playerQuad.rotation.z = Math.sin(walkCycleTimerRef.current) * 0.22;
            // Waddle bounce
            playerQuad.position.y = 0.9 + Math.abs(Math.sin(walkCycleTimerRef.current)) * 0.22;

            if (joy && Math.abs(joy.vx) > 0.05) {
              playerQuad.scale.x = joy.vx < 0 ? -1 : 1;
            } else if (Math.abs(dx) > 0.05) {
              playerQuad.scale.x = dx < 0 ? -1 : 1;
            }
          } else {
            // Idle breathing
            playerQuad.rotation.z = THREE.MathUtils.damp(playerQuad.rotation.z, 0, 10, delta);
            playerQuad.position.y = 0.9 + Math.sin(elapsed * 3) * 0.04;
          }

          // Invulnerability visual blink
          if (isInvulnerable) {
            playerQuad.visible = Math.floor(elapsed * 12) % 2 === 0;
          } else {
            playerQuad.visible = true;
          }
        }

        // Camera follow
        camera.position.x = THREE.MathUtils.damp(camera.position.x, cur.x, 6, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, cur.z + 14, 6, delta);
        camera.lookAt(cur.x, 0, cur.z);
      }

      // Check stairs ascension trigger
      if (stairs && stairs.active && onAscendStairs) {
        const stairsDist = Math.hypot(cur.x - stairs.x, cur.z - stairs.z);
        const now = performance.now();
        if (stairsDist < 1.6 && now - lastAscendCheckRef.current > 2500) {
          lastAscendCheckRef.current = now;
          onAscendStairs();
        }
      }

      // Rotate portal ring
      if (stairsMeshRef.current) {
        const portalRing = stairsMeshRef.current.getObjectByName('portalRing');
        if (portalRing) {
          portalRing.rotation.z += delta * 1.5;
        }
      }

      // Torch flicker
      torchLightsRef.current.forEach((light, i) => {
        light.intensity = 2.2 + Math.sin(elapsed * 8 + i * 2) * 0.4;
      });

      const now = performance.now();

      // Animate Enemy Meshes and perform Mob AI & Contact Attacks
      enemyMeshesRef.current.forEach((grp, id) => {
        const enemy = latest.current.enemies.find((e) => e.id === id);
        if (enemy && enemy.hp > 0) {
          // AI Stalking: Slimes and mobs wander/creep toward Arc when nearby
          const distToPlayer = Math.hypot(cur.x - enemy.x, cur.z - enemy.z);
          if (!latest.current.multiplayer && !isBattleActiveRef.current && distToPlayer > 1.3 && distToPlayer < 6.5) {
            const stalkSpeed = (enemy.type === 'slime' ? 0.7 : 0.5) * delta;
            const dirX = (cur.x - enemy.x) / distToPlayer;
            const dirZ = (cur.z - enemy.z) / distToPlayer;
            enemy.x += dirX * stalkSpeed;
            enemy.z += dirZ * stalkSpeed;
          }

          // Contact attack trigger -> Initiates battle immediately when hitting a mob!
          if (!latest.current.multiplayer && !isBattleActiveRef.current && distToPlayer < 1.35 && !isInvulnerable && latest.current.onTargetEnemy) {
            if (now - lastMobAttackCheckRef.current > 3000) {
              lastMobAttackCheckRef.current = now;
              latest.current.onTargetEnemy(enemy);
            }
          }

          grp.position.x = THREE.MathUtils.damp(grp.position.x, enemy.x, 6, delta);
          grp.position.z = THREE.MathUtils.damp(grp.position.z, enemy.z, 6, delta);

          if (enemy.type === 'slime') {
            grp.position.y = Math.abs(Math.sin(elapsed * 4 + grp.position.x)) * 0.35;
          } else if (enemy.type === 'chimera' || enemy.type === 'boss') {
            grp.position.y = 0.2 + Math.sin(elapsed * 2.5) * 0.15;
            const halo = grp.getObjectByName('bossHalo');
            if (halo) {
              halo.rotation.y += delta * 1.2;
            }
          }
        }
      });

      // Update Spell Projectiles
      for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
        const proj = projectilesRef.current[i];
        proj.pos.addScaledVector(proj.dir, delta * 16);
        proj.mesh.position.copy(proj.pos);
        proj.light.position.copy(proj.pos);
        proj.life -= delta;

        if (proj.life <= 0) {
          scene.remove(proj.mesh);
          scene.remove(proj.light);
          proj.mesh.geometry.dispose();
          projectilesRef.current.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);

      if (container && renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }

      floorGeo.dispose();
      floorMat.dispose();
      floorTexture.dispose();
      northWallGeo.dispose();
      westWallGeo.dispose();
      eastWallGeo.dispose();
      wallMat.dispose();
      wallTexture.dispose();
      pillarGeo.dispose();
      pillarMat.dispose();
      pillarTexture.dispose();
      renderer.dispose();
      remoteMeshesRef.current.forEach((mesh) => {
        mesh.geometry.dispose();
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.map?.dispose(); mat.dispose();
      });
      remoteMeshesRef.current.clear();
    };
  }, [roomWidth, roomHeight, isBossRoom, stairs?.x, stairs?.z, stairs?.active]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const meshes = remoteMeshesRef.current;
    for (const [id, mesh] of meshes) {
      if (!remotePlayers.some((p) => p.id === id)) {
        scene.remove(mesh); mesh.geometry.dispose();
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.map?.dispose(); mat.dispose(); meshes.delete(id);
      }
    }
    for (const player of remotePlayers) {
      let mesh = meshes.get(player.id);
      if (!mesh) {
        const texture = createCustomPlayerTexture({ robeColor: '#10b981', hatStyle: 'wizard', accessory: 'none', wandStyle: 'crystal' });
        mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshStandardMaterial({ map: texture, transparent: true, side: THREE.DoubleSide }));
        mesh.rotation.x = -Math.PI / 6; meshes.set(player.id, mesh); scene.add(mesh);
      }
      mesh.position.set(player.x, player.hp > 0 ? 0.9 : 0.3, player.z);
      mesh.rotation.z = player.hp > 0 ? 0 : Math.PI / 2;
    }
  }, [remotePlayers, roomWidth, roomHeight, stairs?.active]);

  // Dynamically update Player Quad Texture whenever characterConfig changes
  useEffect(() => {
    if (!playerMeshRef.current) return;
    const playerQuad = playerMeshRef.current.getObjectByName('playerQuad') as THREE.Mesh | undefined;
    if (playerQuad && playerQuad.material) {
      const newTex = createCustomPlayerTexture(characterConfig);
      newTex.needsUpdate = true;
      const mat = playerQuad.material as THREE.MeshStandardMaterial;
      if (mat.map) {
        mat.map.dispose();
      }
      mat.map = newTex;
      mat.needsUpdate = true;
    }
  }, [
    characterConfig?.robeColor,
    characterConfig?.hatStyle,
    characterConfig?.accessory,
    characterConfig?.wandStyle,
    characterConfig?.skinTone,
  ]);

  // Sync Enemies into 3D Scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const activeIds = new Set(enemies.map((e) => e.id));

    enemyMeshesRef.current.forEach((grp, id) => {
      if (!activeIds.has(id)) {
        scene.remove(grp);
        enemyMeshesRef.current.delete(id);
      }
    });

    enemies.forEach((enemy) => {
      let grp = enemyMeshesRef.current.get(enemy.id);
      if (!grp) {
        grp = new THREE.Group();
        grp.userData = { enemyId: enemy.id };
        grp.position.set(enemy.x, 0, enemy.z);

        let tex: THREE.CanvasTexture;
        let size = 1.5;

        if (enemy.type === 'slime') {
          tex = createSlime64Texture(enemy.color || '#10b981');
          size = 1.4;
        } else if (enemy.type === 'golem') {
          tex = createGolem64Texture();
          size = 2.1;
        } else if (enemy.type === 'wraith') {
          tex = createShadowWraith64Texture();
          size = 1.9;
        } else if (enemy.type === 'gorgon') {
          tex = createGorgonBoss64Texture();
          size = 3.2;
        } else if (enemy.type === 'chimera') {
          tex = createMagmaChimera64Texture();
          size = 3.4;
        } else if (enemy.type === 'boss') {
          tex = createBoss64Texture();
          size = 3.8;

          const ringGeo = new THREE.TorusGeometry(2.4, 0.08, 8, 24);
          const ringMat = new THREE.MeshBasicMaterial({ color: '#f59e0b', wireframe: true });
          const halo = new THREE.Mesh(ringGeo, ringMat);
          halo.name = 'bossHalo';
          halo.position.y = 2.0;
          halo.rotation.x = Math.PI / 2;
          grp.add(halo);
        } else {
          tex = createSlime64Texture('#818cf8');
          size = 1.5;
        }

        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          transparent: true,
          alphaTest: 0.3,
          roughness: 0.7,
          side: THREE.DoubleSide,
        });

        const geo = new THREE.PlaneGeometry(size, size);
        const quad = new THREE.Mesh(geo, mat);
        quad.position.y = size / 2;
        quad.rotation.x = -Math.PI / 6;
        quad.castShadow = true;
        quad.receiveShadow = true;
        grp.add(quad);

        const shadowGeo = new THREE.CircleGeometry(size * 0.35, 12);
        const shadowMat = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.4 });
        const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
        contactShadow.rotation.x = -Math.PI / 2;
        contactShadow.position.y = 0.02;
        grp.add(contactShadow);

        scene.add(grp);
        enemyMeshesRef.current.set(enemy.id, grp);
      }
    });
  }, [enemies]);

  // Sync Chests into 3D Scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    chests.forEach((chest) => {
      let grp = chestMeshesRef.current.get(chest.id);
      if (!grp) {
        grp = new THREE.Group();
        grp.position.set(chest.x, 0, chest.z);

        const tex = createChestTexture(chest.opened);
        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          transparent: true,
          alphaTest: 0.2,
          side: THREE.DoubleSide,
        });
        const geo = new THREE.PlaneGeometry(1.2, 1.2);
        const quad = new THREE.Mesh(geo, mat);
        quad.position.y = 0.6;
        quad.rotation.x = -Math.PI / 6;
        quad.castShadow = true;
        grp.add(quad);

        scene.add(grp);
        chestMeshesRef.current.set(chest.id, grp);
      }
    });
  }, [chests]);

  // Spawn New Projectiles
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || activeSpellProjectiles.length === 0) return;

    const latest = activeSpellProjectiles[activeSpellProjectiles.length - 1];
    if (latest.timestamp <= processedSpellTimestampRef.current) return;
    processedSpellTimestampRef.current = latest.timestamp;

    let targetPos = new THREE.Vector3(playerPos.x, 1, playerPos.z - 6);
    if (latest.targetEnemyId) {
      const enemy = enemies.find((e) => e.id === latest.targetEnemyId);
      if (enemy) targetPos.set(enemy.x, 1, enemy.z);
    } else if (enemies.length > 0) {
      targetPos.set(enemies[0].x, 1, enemies[0].z);
    }

    const startPos = new THREE.Vector3(playerPos.x, 1, playerPos.z);
    const dir = targetPos.clone().sub(startPos).normalize();

    const colors: Record<SpellType, string> = {
      fire: '#ef4444',
      frost: '#38bdf8',
      lightning: '#eab308',
      arcane: '#10b981',
    };
    const spellColor = colors[latest.type] || '#38bdf8';

    const sphereGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: spellColor,
      emissive: spellColor,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    });
    const projMesh = new THREE.Mesh(sphereGeo, sphereMat);
    projMesh.position.copy(startPos);
    projMesh.castShadow = true;
    scene.add(projMesh);

    const projLight = new THREE.PointLight(spellColor, 3.5, 9);
    projLight.position.copy(startPos);
    projLight.castShadow = true;
    scene.add(projLight);

    projectilesRef.current.push({
      mesh: projMesh,
      light: projLight,
      type: latest.type,
      fraction: latest.fraction,
      dir,
      pos: startPos.clone(),
      targetEnemyId: latest.targetEnemyId,
      life: 2.5,
    });
  }, [activeSpellProjectiles, playerPos.x, playerPos.z, enemies]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* 3D Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />

      {/* Chunky Retro Pixel 2D HUD Overlays for Enemies */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {enemies.map((enemy) => {
          const hpPercent = Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100));

          return (
            <div
              key={enemy.id}
              className="absolute pointer-events-auto transition-transform duration-75 flex flex-col items-center"
              style={{
                left: `calc(50% + ${(enemy.x - playerPos.x) * 32}px)`,
                top: `calc(50% + ${(enemy.z - playerPos.z) * 32 - (enemy.isBoss ? 95 : 65)}px)`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => onTargetEnemy && onTargetEnemy(enemy)}
            >
              {/* Chunky Pixel HP Box */}
              <div className="bg-slate-950/95 border-2 border-slate-600 hover:border-amber-400 rounded-lg p-1.5 text-center shadow-[0_4px_16px_rgba(0,0,0,0.8)] backdrop-blur-sm cursor-pointer transition-all min-w-[110px]">
                <div className="flex items-center justify-between text-[10px] font-pixel text-slate-200 gap-2 mb-1">
                  <span className="truncate max-w-[85px] text-amber-300 font-bold">{enemy.name}</span>
                  <span className="font-mono text-slate-300 font-bold">{enemy.hp}HP</span>
                </div>

                {/* Segmented Pixel Bar */}
                <div className="w-full h-3 bg-slate-900 border border-slate-700 p-0.5 rounded overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-300 rounded-sm ${
                      hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>

                {/* Formatted Fraction Shield Indicator */}
                {enemy.shield ? (
                  <div className="mt-1 flex items-center justify-center gap-1.5 bg-amber-950/90 border border-amber-500 rounded px-1.5 py-0.5">
                    <span className="text-[8px] text-amber-400 font-pixel">SHIELD:</span>
                    <FormattedFraction fraction={enemy.shield} size="xs" color="text-amber-200" showPieIndicator={true} />
                  </div>
                ) : (
                  <div className="mt-0.5 text-[8px] font-pixel text-emerald-400">
                    CLICK TO BATTLE
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* 2D Floating Indicator for Stairs when active */}
        {stairs && stairs.active && (
          <div
            className="absolute pointer-events-none transition-transform duration-75 flex flex-col items-center"
            style={{
              left: `calc(50% + ${(stairs.x - playerPos.x) * 32}px)`,
              top: `calc(50% + ${(stairs.z - playerPos.z) * 32 - 70}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="bg-amber-950/90 border-2 border-amber-400 rounded-lg px-2 py-1 text-center shadow-lg animate-bounce">
              <span className="font-pixel text-[9px] text-amber-300 block">ASCEND TOWER</span>
              <span className="font-retro text-[8px] text-white">Walk up stairs</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
