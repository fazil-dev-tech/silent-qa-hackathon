'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function FlightCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    // Balanced widescreen cosmic vista (zoomed out 5% to 139)
    camera.position.set(0, 0, 139);

    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Ambient & Point Lighting for Rich Dimensional Volume
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x00F0FF, 3.5, 90);
    cyanLight.position.set(-54, 14, 14);
    scene.add(cyanLight);

    const violetLight = new THREE.PointLight(0xA855F7, 3.2, 90);
    violetLight.position.set(-50, -4, 14);
    scene.add(violetLight);

    const crimsonLight = new THREE.PointLight(0xEF4444, 4.0, 90);
    crimsonLight.position.set(50, -4, 14);
    scene.add(crimsonLight);

    const emeraldLight = new THREE.PointLight(0x10B981, 3.5, 90);
    emeraldLight.position.set(54, 14, 14);
    scene.add(emeraldLight);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // =========================================================================
    // 4-TIER ARCHITECTURAL TOPOLOGY (PERFECT FLANK POSITIONING)
    // Left Flank: Tier 1 (Upper-Left) & Tier 2 (Lower-Left)
    // Right Flank: Tier 4 (Upper-Right) & Tier 3 (Lower-Right)
    // =========================================================================

    // -------------------------------------------------------------------------
    // TIER 1: CLIENT FLIGHT RECORDER (Hexagonal Node, Cyan #00F0FF)
    // Position: (-54, 14, -8)
    // -------------------------------------------------------------------------
    const clientNodeGroup = new THREE.Group();
    clientNodeGroup.position.set(-54, 14, -8);
    masterGroup.add(clientNodeGroup);

    const clientGeo = new THREE.CylinderGeometry(4.8, 4.8, 2.6, 6);
    const clientWireMat = new THREE.MeshBasicMaterial({
      color: 0x00F0FF,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const clientMesh = new THREE.Mesh(clientGeo, clientWireMat);
    clientNodeGroup.add(clientMesh);

    const clientInnerMat = new THREE.MeshStandardMaterial({
      color: 0x0284C7,
      roughness: 0.25,
      metalness: 0.85,
      transparent: true,
      opacity: 0.45,
    });
    const clientInnerMesh = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 2.2, 6), clientInnerMat);
    clientNodeGroup.add(clientInnerMesh);

    const clientCore = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x38BDF8 })
    );
    clientNodeGroup.add(clientCore);

    // Orbital Scan Halo
    const clientHaloGeo = new THREE.RingGeometry(6.4, 6.6, 48);
    const clientHaloMat = new THREE.MeshBasicMaterial({
      color: 0x00F0FF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const clientHalo = new THREE.Mesh(clientHaloGeo, clientHaloMat);
    clientHalo.rotation.x = Math.PI / 2.5;
    clientNodeGroup.add(clientHalo);

    // -------------------------------------------------------------------------
    // TIER 2: ENCRYPTED RING BUFFER & PII SCRUBBER (Torus Node, Violet #A855F7)
    // Position: (-50, -4, -8)
    // -------------------------------------------------------------------------
    const bufferNodeGroup = new THREE.Group();
    bufferNodeGroup.position.set(-50, -4, -8);
    masterGroup.add(bufferNodeGroup);

    const bufferGeo = new THREE.TorusGeometry(4.8, 1.25, 16, 36);
    const bufferWireMat = new THREE.MeshBasicMaterial({
      color: 0xA855F7,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    const bufferMesh = new THREE.Mesh(bufferGeo, bufferWireMat);
    bufferMesh.rotation.x = Math.PI / 3.5;
    bufferNodeGroup.add(bufferMesh);

    const bufferInnerMat = new THREE.MeshStandardMaterial({
      color: 0x7C3AED,
      roughness: 0.3,
      metalness: 0.8,
      transparent: true,
      opacity: 0.4,
    });
    const bufferInnerMesh = new THREE.Mesh(new THREE.TorusGeometry(4.0, 0.95, 16, 36), bufferInnerMat);
    bufferInnerMesh.rotation.x = Math.PI / 3.5;
    bufferNodeGroup.add(bufferInnerMesh);

    const bufferCore = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xC084FC })
    );
    bufferNodeGroup.add(bufferCore);

    // Orbital Halo
    const bufferHaloGeo = new THREE.RingGeometry(6.8, 7.0, 48);
    const bufferHaloMat = new THREE.MeshBasicMaterial({
      color: 0xA855F7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const bufferHalo = new THREE.Mesh(bufferHaloGeo, bufferHaloMat);
    bufferHalo.rotation.y = Math.PI / 3;
    bufferNodeGroup.add(bufferHalo);

    // -------------------------------------------------------------------------
    // TIER 3: CAUSAL AI SYNTHESIS ENGINE (Icosahedron Core, Crimson #DC2626)
    // Position: (50, -4, -8)
    // -------------------------------------------------------------------------
    const aiNodeGroup = new THREE.Group();
    aiNodeGroup.position.set(50, -4, -8);
    masterGroup.add(aiNodeGroup);

    const aiGeo = new THREE.IcosahedronGeometry(6.0, 1);
    const aiWireMat = new THREE.MeshBasicMaterial({
      color: 0xEF4444,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const aiMesh = new THREE.Mesh(aiGeo, aiWireMat);
    aiNodeGroup.add(aiMesh);

    const aiInnerMat = new THREE.MeshStandardMaterial({
      color: 0xB91C1C,
      roughness: 0.2,
      metalness: 0.9,
      transparent: true,
      opacity: 0.45,
    });
    const aiInnerMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(4.4, 1), aiInnerMat);
    aiNodeGroup.add(aiInnerMesh);

    const aiCore = new THREE.Mesh(
      new THREE.SphereGeometry(1.8, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xFCA5A5 })
    );
    aiNodeGroup.add(aiCore);

    // Dual Orbital Halo Rings
    const aiHaloGeo = new THREE.RingGeometry(7.6, 7.85, 48);
    const aiHaloMat = new THREE.MeshBasicMaterial({
      color: 0xEF4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const aiHalo = new THREE.Mesh(aiHaloGeo, aiHaloMat);
    aiHalo.rotation.x = Math.PI / 4;
    aiNodeGroup.add(aiHalo);

    // -------------------------------------------------------------------------
    // TIER 4: AUTOMATED PLAYWRIGHT PROBE (Octahedron Diamond, Emerald #10B981)
    // Position: (54, 14, -8)
    // -------------------------------------------------------------------------
    const probeNodeGroup = new THREE.Group();
    probeNodeGroup.position.set(54, 14, -8);
    masterGroup.add(probeNodeGroup);

    const probeGeo = new THREE.OctahedronGeometry(5.2, 0);
    const probeWireMat = new THREE.MeshBasicMaterial({
      color: 0x10B981,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const probeMesh = new THREE.Mesh(probeGeo, probeWireMat);
    probeNodeGroup.add(probeMesh);

    const probeInnerMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      roughness: 0.25,
      metalness: 0.85,
      transparent: true,
      opacity: 0.45,
    });
    const probeInnerMesh = new THREE.Mesh(new THREE.OctahedronGeometry(4.0, 0), probeInnerMat);
    probeNodeGroup.add(probeInnerMesh);

    const probeCore = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x6EE7B7 })
    );
    probeNodeGroup.add(probeCore);

    // Orbital Halo
    const probeHaloGeo = new THREE.RingGeometry(6.6, 6.8, 48);
    const probeHaloMat = new THREE.MeshBasicMaterial({
      color: 0x10B981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const probeHalo = new THREE.Mesh(probeHaloGeo, probeHaloMat);
    probeHalo.rotation.x = Math.PI / 3;
    probeNodeGroup.add(probeHalo);

    // =========================================================================
    // QUADRATIC BEZIER DATA CONDUITS (ARCHITECTURAL CIRCUIT PIPELINE)
    // =========================================================================
    const curves = [
      // Conduit 1: Tier 1 (Upper-Left) -> Tier 2 (Lower-Left)
      new THREE.QuadraticBezierCurve3(
        clientNodeGroup.position,
        new THREE.Vector3(-58, 5, -8),
        bufferNodeGroup.position
      ),
      // Conduit 2: Tier 2 (Lower-Left) -> Tier 3 (Lower-Right) [Sweeps beneath hero CTAs]
      new THREE.QuadraticBezierCurve3(
        bufferNodeGroup.position,
        new THREE.Vector3(0, -18, -12),
        aiNodeGroup.position
      ),
      // Conduit 3: Tier 3 (Lower-Right) -> Tier 4 (Upper-Right)
      new THREE.QuadraticBezierCurve3(
        aiNodeGroup.position,
        new THREE.Vector3(58, 5, -8),
        probeNodeGroup.position
      ),
    ];

    // Draw Dual Glowing Conduit Pipelines
    curves.forEach((curve, cIdx) => {
      const points = curve.getPoints(60);
      const pipeGeo = new THREE.BufferGeometry().setFromPoints(points);
      const color = cIdx === 0 ? 0x00F0FF : cIdx === 1 ? 0xA855F7 : 0x10B981;

      // Bright Core Line
      const pipeMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      });
      const pipeLine = new THREE.Line(pipeGeo, pipeMat);
      masterGroup.add(pipeLine);
    });

    // 16 Moving Telemetry Data Pulses
    const pulseCount = 16;
    const pulseSpheres: { mesh: THREE.Mesh; curveIndex: number; progress: number; speed: number; baseScale: number }[] = [];
    const pulseColors = [0x38BDF8, 0xC084FC, 0xFCA5A5, 0x4ADE80];

    for (let i = 0; i < pulseCount; i++) {
      const curveIndex = i % 3;
      const pGeo = new THREE.SphereGeometry(0.7, 12, 12);
      const pMat = new THREE.MeshBasicMaterial({
        color: pulseColors[i % pulseColors.length],
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      masterGroup.add(pMesh);

      pulseSpheres.push({
        mesh: pMesh,
        curveIndex,
        progress: (i / pulseCount),
        speed: 0.0035 + Math.random() * 0.003,
        baseScale: 0.8 + Math.random() * 0.4,
      });
    }

    // =========================================================================
    // SUBTLE SURROUNDING CONSTELLATION (140 PARTICLES WITH REFINED SOFT GLOW)
    // =========================================================================
    const particleCount = 140;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities: { x: number; y: number; z: number }[] = [];

    const palette = [
      new THREE.Color('#EF4444'),
      new THREE.Color('#00F0FF'),
      new THREE.Color('#10B981'),
      new THREE.Color('#A855F7'),
      new THREE.Color('#38BDF8'),
    ];

    for (let i = 0; i < particleCount; i++) {
      const radius = 38 + Math.random() * 42;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = -18 + radius * Math.cos(phi) * 0.45;

      velocities.push({
        x: (Math.random() - 0.5) * 0.015,
        y: (Math.random() - 0.5) * 0.015,
        z: (Math.random() - 0.5) * 0.01,
      });

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // High-resolution Circular Glow Sprite
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(0, 240, 255, 0.7)');
      grad.addColorStop(0.7, 'rgba(239, 68, 68, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(32, 32, 32, 0, Math.PI * 2);
      ctx.fill();
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: 1.6,
      map: particleTexture,
      transparent: true,
      opacity: 0.7,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    masterGroup.add(particleSystem);

    // =========================================================================
    // UNDULATING HORIZON TERRAIN WAVE (COSMIC PARTICLE OCEAN)
    // Matches AssignAI reference media_1793622034155_85b73f95.jpg
    // =========================================================================
    const waveCols = 95;
    const waveRows = 70;
    const waveCount = waveCols * waveRows;
    const waveGeo = new THREE.BufferGeometry();
    const wavePositions = new Float32Array(waveCount * 3);
    const waveColors = new Float32Array(waveCount * 3);

    for (let r = 0; r < waveRows; r++) {
      for (let c = 0; c < waveCols; c++) {
        const idx = (r * waveCols + c) * 3;
        const x = ((c / (waveCols - 1)) - 0.5) * 170;
        const z = ((r / (waveRows - 1)) - 0.5) * 110 - 10;
        const y = -16;

        wavePositions[idx] = x;
        wavePositions[idx + 1] = y;
        wavePositions[idx + 2] = z;

        // Color transition: Front (pink/violet) -> Horizon (cyan/deep space)
        const t = r / (waveRows - 1);
        const col = new THREE.Color().lerpColors(
          new THREE.Color(0xA855F7),
          new THREE.Color(0x00F0FF),
          t
        );
        waveColors[idx] = col.r;
        waveColors[idx + 1] = col.g;
        waveColors[idx + 2] = col.b;
      }
    }
    waveGeo.setAttribute('position', new THREE.BufferAttribute(wavePositions, 3));
    waveGeo.setAttribute('color', new THREE.BufferAttribute(waveColors, 3));

    const waveMat = new THREE.PointsMaterial({
      size: 1.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const wavePoints = new THREE.Points(waveGeo, waveMat);
    masterGroup.add(wavePoints);

    // =========================================================================
    // GYROSCOPIC AMBIENT ORBITAL RINGS (DISTANT CELESTIAL HORIZONS)
    // =========================================================================
    const ringGeo = new THREE.RingGeometry(68, 68.3, 128);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00F0FF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
    });
    const gyroRing = new THREE.Mesh(ringGeo, ringMat);
    gyroRing.rotation.x = Math.PI / 3.4;
    masterGroup.add(gyroRing);

    const innerRingGeo = new THREE.RingGeometry(46, 46.3, 96);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0xEF4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
    });
    const gyroInnerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    gyroInnerRing.rotation.y = Math.PI / 2.8;
    masterGroup.add(gyroInnerRing);

    // Mouse Parallax Interactivity with Easing
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / mount.clientWidth) * 2 - 1;
      const y = -(((e.clientY - rect.top) / mount.clientHeight) * 2 - 1);
      targetX = x * 0.12;
      targetY = y * 0.09;
    };

    window.addEventListener('mousemove', onMouseMove);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerp
      mouseX += (targetX - mouseX) * 0.04;
      mouseY += (targetY - mouseY) * 0.04;

      masterGroup.rotation.y = mouseX * 0.35 + Math.sin(elapsedTime * 0.12) * 0.03;
      masterGroup.rotation.x = -mouseY * 0.25 + Math.cos(elapsedTime * 0.1) * 0.02;

      // Tier Node Internal Rotations & Breathing
      clientNodeGroup.rotation.y += 0.01;
      clientHalo.rotation.z += 0.012;

      bufferNodeGroup.rotation.x += 0.008;
      bufferNodeGroup.rotation.y += 0.01;
      bufferHalo.rotation.z -= 0.01;

      aiNodeGroup.rotation.x += 0.01;
      aiNodeGroup.rotation.y += 0.012;
      aiHalo.rotation.z += 0.015;
      const aiScale = 1 + Math.sin(elapsedTime * 2.5) * 0.035;
      aiNodeGroup.scale.set(aiScale, aiScale, aiScale);

      probeNodeGroup.rotation.y += 0.01;
      probeHalo.rotation.z -= 0.012;

      // Orbital Gyro Rotations
      gyroRing.rotation.z += 0.0006;
      gyroInnerRing.rotation.z -= 0.0009;

      // Move Telemetry Pulse Spheres along Bezier Conduits
      pulseSpheres.forEach((p, idx) => {
        p.progress += p.speed;
        if (p.progress > 1) {
          p.progress = 0;
        }
        const point = curves[p.curveIndex].getPoint(p.progress);
        p.mesh.position.copy(point);
        const s = p.baseScale * (1 + Math.sin(elapsedTime * 5 + idx) * 0.2);
        p.mesh.scale.set(s, s, s);
      });

      // Drift Surrounding Particles Gently
      const posAttr = particleGeometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        let x = posAttr.getX(i) + velocities[i].x;
        let y = posAttr.getY(i) + velocities[i].y;
        let z = posAttr.getZ(i) + velocities[i].z;

        if (Math.abs(x) > 65) velocities[i].x *= -1;
        if (Math.abs(y) > 42) velocities[i].y *= -1;
        if (Math.abs(z) > 28) velocities[i].z *= -1;

        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;

      // Animate Cosmic Undulating Horizon Wave
      const waveAttr = waveGeo.attributes.position as THREE.BufferAttribute;
      const waveArr = waveAttr.array as Float32Array;
      for (let r = 0; r < waveRows; r++) {
        for (let c = 0; c < waveCols; c++) {
          const idx = (r * waveCols + c) * 3;
          const wx = waveArr[idx];
          const wz = waveArr[idx + 2];
          waveArr[idx + 1] = -16 + Math.sin(wx * 0.05 + elapsedTime * 1.6) * 3.4 + Math.cos(wz * 0.06 + elapsedTime * 1.3) * 2.8;
        }
      }
      waveAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
