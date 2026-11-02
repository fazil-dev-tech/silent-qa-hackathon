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
    camera.position.z = 90;

    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // -------------------------------------------------------------
    // 1. Central Core Sphere with Geodesic Dual Shell
    // -------------------------------------------------------------
    const innerCoreGeo = new THREE.IcosahedronGeometry(18, 3);
    const innerCoreMat = new THREE.MeshBasicMaterial({
      color: 0xDC2626,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const innerCoreMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    masterGroup.add(innerCoreMesh);

    const outerCoreGeo = new THREE.DodecahedronGeometry(23, 1);
    const outerCoreMat = new THREE.MeshBasicMaterial({
      color: 0xEF4444,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const outerCoreMesh = new THREE.Mesh(outerCoreGeo, outerCoreMat);
    masterGroup.add(outerCoreMesh);

    // -------------------------------------------------------------
    // 2. High-Density Telemetry Particle Constellation (400 nodes)
    // -------------------------------------------------------------
    const particleCount = 380;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities: { x: number; y: number; z: number }[] = [];

    // Distinct Telemetry Palette
    const palette = [
      new THREE.Color('#DC2626'), // Exception / Error (Crimson)
      new THREE.Color('#EF4444'), // Network Failure (Red)
      new THREE.Color('#0284C7'), // Fetch / XHR (Sky Blue)
      new THREE.Color('#16A34A'), // DOM Mutation (Emerald)
      new THREE.Color('#9333EA'), // Long Task / Perf (Purple)
      new THREE.Color('#F59E0B'), // Warning / Degraded (Amber)
    ];

    for (let i = 0; i < particleCount; i++) {
      const radius = 22 + Math.random() * 26;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      velocities.push({
        x: (Math.random() - 0.5) * 0.04,
        y: (Math.random() - 0.5) * 0.04,
        z: (Math.random() - 0.5) * 0.04,
      });

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // High-resolution particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.2, 'rgba(239, 68, 68, 0.9)');
      gradient.addColorStop(0.5, 'rgba(220, 38, 38, 0.4)');
      gradient.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(32, 32, 32, 0, Math.PI * 2);
      ctx.fill();
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: 2.2,
      map: particleTexture,
      transparent: true,
      opacity: 0.85,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    masterGroup.add(particleSystem);

    // -------------------------------------------------------------
    // 3. Dynamic Telemetry Neural Link Lines
    // -------------------------------------------------------------
    const maxLineConnections = 300;
    const linePositions = new Float32Array(maxLineConnections * 6);
    const lineColors = new Float32Array(maxLineConnections * 6);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
    });

    const lineSystem = new THREE.LineSegments(lineGeometry, lineMaterial);
    masterGroup.add(lineSystem);

    // -------------------------------------------------------------
    // 4. Gyroscopic Orbital Rings & Satellites
    // -------------------------------------------------------------
    const ringGroup = new THREE.Group();
    masterGroup.add(ringGroup);

    // Primary Equatorial Ring
    const primaryRingGeo = new THREE.RingGeometry(42, 42.5, 96);
    const primaryRingMat = new THREE.MeshBasicMaterial({
      color: 0xDC2626,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
    });
    const primaryRing = new THREE.Mesh(primaryRingGeo, primaryRingMat);
    primaryRing.rotation.x = Math.PI / 2.8;
    ringGroup.add(primaryRing);

    // Secondary Inclined Ring
    const secondaryRingGeo = new THREE.RingGeometry(48, 48.3, 96);
    const secondaryRingMat = new THREE.MeshBasicMaterial({
      color: 0x0284C7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.15,
    });
    const secondaryRing = new THREE.Mesh(secondaryRingGeo, secondaryRingMat);
    secondaryRing.rotation.y = Math.PI / 3;
    ringGroup.add(secondaryRing);

    // Floating Orbital Telemetry Node Satellites
    const satelliteGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const sat1Mat = new THREE.MeshBasicMaterial({ color: 0xDC2626 });
    const sat1 = new THREE.Mesh(satelliteGeo, sat1Mat);
    ringGroup.add(sat1);

    const sat2Mat = new THREE.MeshBasicMaterial({ color: 0x0284C7 });
    const sat2 = new THREE.Mesh(satelliteGeo, sat2Mat);
    ringGroup.add(sat2);

    const sat3Mat = new THREE.MeshBasicMaterial({ color: 0x16A34A });
    const sat3 = new THREE.Mesh(satelliteGeo, sat3Mat);
    ringGroup.add(sat3);

    // -------------------------------------------------------------
    // 5. Interactive Mouse Parallax & Elastic Easing
    // -------------------------------------------------------------
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    function handleMouseMove(e: MouseEvent) {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    function handleResize() {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }

    window.addEventListener('resize', handleResize);

    // -------------------------------------------------------------
    // 6. Animation Loop (60 FPS with micro-motions & link updates)
    // -------------------------------------------------------------
    let animationFrameId: number;
    const clock = new THREE.Clock();

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth Elastic Mouse Lerp
      currentX += (mouseX * 0.5 - currentX) * 0.04;
      currentY += (mouseY * 0.5 - currentY) * 0.04;

      masterGroup.rotation.y = currentX + elapsed * 0.08;
      masterGroup.rotation.x = currentY + Math.sin(elapsed * 0.3) * 0.08;

      // Pulse Core
      const pulse = 1 + Math.sin(elapsed * 2) * 0.05;
      innerCoreMesh.scale.set(pulse, pulse, pulse);
      innerCoreMesh.rotation.z += 0.003;
      outerCoreMesh.rotation.y -= 0.002;

      // Orbit Satellites
      const satAngle1 = elapsed * 0.9;
      sat1.position.set(Math.cos(satAngle1) * 42.2, Math.sin(satAngle1) * 20, Math.sin(satAngle1) * 36);

      const satAngle2 = -elapsed * 0.7 + 1.5;
      sat2.position.set(Math.cos(satAngle2) * 48.1, Math.sin(satAngle2) * 48.1 * 0.6, Math.sin(satAngle2) * 20);

      const satAngle3 = elapsed * 0.5 + 3.0;
      sat3.position.set(Math.sin(satAngle3) * 35, Math.cos(satAngle3) * 35, Math.sin(satAngle3) * 15);

      // Particle Drift & Dynamic Line Connections
      const posAttr = particleGeometry.getAttribute('position') as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      let lineIndex = 0;
      const linePosAttr = lineGeometry.getAttribute('position') as THREE.BufferAttribute;
      const linePosArray = linePosAttr.array as Float32Array;
      const lineColAttr = lineGeometry.getAttribute('color') as THREE.BufferAttribute;
      const lineColArray = lineColAttr.array as Float32Array;

      const connectionDistSq = 14 * 14;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        posArray[idx] += velocities[i].x;
        posArray[idx + 1] += velocities[i].y;
        posArray[idx + 2] += velocities[i].z;

        // Bounce back within spherical boundary
        const dist = Math.sqrt(posArray[idx] ** 2 + posArray[idx + 1] ** 2 + posArray[idx + 2] ** 2);
        if (dist > 48 || dist < 20) {
          velocities[i].x *= -1;
          velocities[i].y *= -1;
          velocities[i].z *= -1;
        }

        // Connect nearby particles with glowing lines
        if (lineIndex < maxLineConnections && i % 3 === 0) {
          for (let j = i + 1; j < Math.min(i + 15, particleCount); j++) {
            const jdx = j * 3;
            const dx = posArray[idx] - posArray[jdx];
            const dy = posArray[idx + 1] - posArray[jdx + 1];
            const dz = posArray[idx + 2] - posArray[jdx + 2];
            const dSq = dx * dx + dy * dy + dz * dz;

            if (dSq < connectionDistSq && lineIndex < maxLineConnections) {
              const lIdx = lineIndex * 6;
              linePosArray[lIdx] = posArray[idx];
              linePosArray[lIdx + 1] = posArray[idx + 1];
              linePosArray[lIdx + 2] = posArray[idx + 2];

              linePosArray[lIdx + 3] = posArray[jdx];
              linePosArray[lIdx + 4] = posArray[jdx + 1];
              linePosArray[lIdx + 5] = posArray[jdx + 2];

              // Line Color matches source node
              lineColArray[lIdx] = colors[idx];
              lineColArray[lIdx + 1] = colors[idx + 1];
              lineColArray[lIdx + 2] = colors[idx + 2];
              lineColArray[lIdx + 3] = colors[jdx];
              lineColArray[lIdx + 4] = colors[jdx + 1];
              lineColArray[lIdx + 5] = colors[jdx + 2];

              lineIndex++;
            }
          }
        }
      }

      posAttr.needsUpdate = true;
      lineGeometry.setDrawRange(0, lineIndex * 2);
      linePosAttr.needsUpdate = true;
      lineColAttr.needsUpdate = true;

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      innerCoreGeo.dispose();
      innerCoreMat.dispose();
      outerCoreGeo.dispose();
      outerCoreMat.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      primaryRingGeo.dispose();
      primaryRingMat.dispose();
      secondaryRingGeo.dispose();
      secondaryRingMat.dispose();
      satelliteGeo.dispose();
      sat1Mat.dispose();
      sat2Mat.dispose();
      sat3Mat.dispose();
      renderer.dispose();

      if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
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
        zIndex: 0,
      }}
    />
  );
}
