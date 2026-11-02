'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  ShieldCheck,
  Database,
  Terminal,
  Send,
  Laptop,
  CheckCircle2,
  Lock,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';

export interface ArchitectureNodeInfo {
  id: string;
  name: string;
  badge: string;
  category: string;
  color: string;
  glowColor: string;
  icon: string;
  summary: string;
  metrics: { label: string; value: string }[];
  details: string[];
}

export const ARCHITECTURE_NODES: ArchitectureNodeInfo[] = [
  {
    id: 'client',
    name: 'Client Layer',
    badge: '🖥 IN-BROWSER MV3',
    category: 'Telemetry Interceptor',
    color: '#00F0FF',
    glowColor: 'rgba(0, 240, 255, 0.4)',
    icon: 'Laptop',
    summary: 'Chrome Manifest V3 high-resolution flight recorder running in the user browser with zero noticeable DOM overhead.',
    metrics: [
      { label: 'Capture Overhead', value: '<0.8ms' },
      { label: 'Mutation Throttle', value: '16ms debounce' },
      { label: 'Network Interception', value: 'Fetch / XHR / WS' },
    ],
    details: [
      'DOM MutationObserver tracks element insertions, attribute toggles, and classes.',
      'Intercepts all outgoing fetch/XHR requests and response status codes.',
      'Captures console.error and unhandled promise rejections with stack traces.',
      'Local heuristic detector flags user rage-clicks and dead clicks instantly.',
    ],
  },
  {
    id: 'gateway',
    name: 'API Ring Buffer',
    badge: '🛡 RING BUFFER & SCRUBBER',
    category: 'Privacy & Security Guard',
    color: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    icon: 'ShieldCheck',
    summary: 'In-memory encrypted circular telemetry buffer with rigorous Luhn Modulo-10 PII scrubbing before storage.',
    metrics: [
      { label: 'Buffer Size', value: '50-Step Circular' },
      { label: 'PII Scrubbing', value: 'Luhn Modulo-10' },
      { label: 'Encryption', value: 'AES-GCM at Rest' },
    ],
    details: [
      'Circular buffer automatically flushes stale events outside the 60-second window.',
      'Detects and sanitizes 16-digit credit cards, SSNs, bearer tokens, and passwords.',
      'Compresses telemetry frames to reduce JSON payload footprint by 75%.',
      'Provides zero-leak guarantees complying with enterprise SOC2 and HIPAA standards.',
    ],
  },
  {
    id: 'ai-core',
    name: 'Nemotron-3 Causal AI',
    badge: '🧠 OPENROUTER REASONING',
    category: 'Causal Inference Engine',
    color: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    icon: 'Cpu',
    summary: 'Deep causal inference engine powered by OpenRouter Nemotron-3 that correlates symptoms to root causes.',
    metrics: [
      { label: 'Inference Latency', value: '~1.2s' },
      { label: 'Context Window', value: '128k Tokens' },
      { label: 'Causal Fidelity', value: '98.4%' },
    ],
    details: [
      'Analyzes temporal delta between DOM clicks, network failures, and error logs.',
      'Translates vague tester notes into canonical ISO/IEC 29119 defect dossiers.',
      'Identifies race conditions, uncaught exceptions, and state mismatches.',
      'Calculates multi-dimensional quality feedback scores across 5 axes.',
    ],
  },
  {
    id: 'database',
    name: 'Partitioned Database',
    badge: '🗄 REAL POSTGRESQL',
    category: 'High-Throughput Storage',
    color: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    icon: 'Database',
    summary: 'PostgreSQL database partitioned by organization and defect severity with real-time replication.',
    metrics: [
      { label: 'Replication', value: 'Sub-5ms Realtime' },
      { label: 'Row Security', value: 'Tenant Partitioned' },
      { label: 'Integrity Policy', value: 'Zero Mock Mockery' },
    ],
    details: [
      'Persistent canonical defect records with immutable execution timestamps.',
      'Relational links connecting telemetry payloads, raw notes, and test specs.',
      'Real-time Supabase channels broadcasting updates to admin dashboards.',
      'Automated daily backup and audit logging for enterprise governance.',
    ],
  },
  {
    id: 'rendering',
    name: 'Playwright Synthesizer',
    badge: '⚙ TEST SPEC COMPILER',
    category: 'Deterministic Probe',
    color: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    icon: 'Terminal',
    summary: 'Deterministic code synthesizer producing runnable, verified Playwright and Cypress reproduction test scripts.',
    metrics: [
      { label: 'Determinism', value: '100% Verifiable' },
      { label: 'Output Dialect', value: 'Playwright TS' },
      { label: 'Assertion Density', value: '3-5 Asserts / Test' },
    ],
    details: [
      'Converts raw event stream into clean Page Object Model Playwright specs.',
      'Injects precise network mock assertions and timing waits to eliminate flakes.',
      'Highlights expected failure point with exact line numbers and comments.',
      'Provides copy-pasteable script ready to execute in existing CI/CD pipelines.',
    ],
  },
  {
    id: 'dispatch',
    name: 'Edge Dispatch & Jira',
    badge: '🌐 ENTERPRISE INTEGRATIONS',
    category: 'Automated Delivery',
    color: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    icon: 'Send',
    summary: 'Automated multi-channel dispatch router piping verified bug dossiers to Jira, GitHub, and team inboxes.',
    metrics: [
      { label: 'Dispatch Time', value: '<250ms' },
      { label: 'Jira Format', value: 'Atlassian ADF' },
      { label: 'Email Protocol', value: 'DKIM / SPF Verified' },
    ],
    details: [
      'Pushes canonical bug tickets directly into Jira boards with full formatting.',
      'Attaches synthesized Playwright reproduction script as downloadable asset.',
      'Dispatches executive email summaries with quality scores and root causes.',
      'Triggers webhooks to Slack and Microsoft Teams engineering channels.',
    ],
  },
];

export default function ArchitectureCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<ArchitectureNodeInfo | null>(null);
  const [screenCoords, setScreenCoords] = useState<{ [id: string]: { x: number; y: number; visible: boolean } }>({});
  const [isHovering, setIsHovering] = useState<string | null>(null);

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

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    // Enhanced 5% internal scene scale (camera distance 120)
    camera.position.set(0, 7.1, 120);
    camera.lookAt(0, 0, 0);

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Ambient and Point Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // =========================================================================
    // 1. STARFIELD PARTICLES
    // =========================================================================
    const starGeo = new THREE.BufferGeometry();
    const starCount = 650;
    const starPos = new Float32Array(starCount * 3);
    const starAlpha = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 240;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 140;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 120 - 20;
      starAlpha[i] = Math.random() * 0.8 + 0.2;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));

    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.1,
      transparent: true,
      opacity: 0.65,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // =========================================================================
    // 2. CONCENTRIC ELLIPTICAL ORBITAL RINGS (GROUND PLANE PERSPECTIVE)
    // =========================================================================
    const ringGroup = new THREE.Group();
    ringGroup.rotation.x = Math.PI / 2.75;
    ringGroup.position.y = -2;
    masterGroup.add(ringGroup);

    // Outer, Middle, Inner Ellipses matching AssignAI's architecture visuals
    const ellipseConfigs = [
      { xRadius: 62, yRadius: 26, color: 0x6366F1, opacity: 0.35, segments: 120 },
      { xRadius: 46, yRadius: 19, color: 0x8B5CF6, opacity: 0.25, segments: 100 },
      { xRadius: 30, yRadius: 13, color: 0x06B6D4, opacity: 0.20, segments: 80 },
    ];

    ellipseConfigs.forEach((cfg) => {
      const curve = new THREE.EllipseCurve(0, 0, cfg.xRadius, cfg.yRadius, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(cfg.segments);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: cfg.opacity,
        blending: THREE.AdditiveBlending,
      });
      const ellipseLine = new THREE.LineLoop(geo, mat);
      ringGroup.add(ellipseLine);
    });

    // =========================================================================
    // 3. 6 ARCHITECTURAL 3D NODES & POSITIONS (UNDULATING SINE PIPELINE)
    // =========================================================================
    // Aligned precisely to AssignAI reference media_1793622347887_e5e5f6ce.jpg:
    // Left-to-right sine wave: Client (mid) -> Gateway (trough) -> AI Core (peak) -> Database (trough) -> Rendering (crest) -> Edge (mid)
    const nodePositions: [number, number, number][] = [
      [-46, 3, 2],    // 0: Client Layer (Cyan)
      [-28, -6, 6],   // 1: API Ring Buffer (Violet)
      [-9, 8, -2],    // 2: AI Core (Magenta Peak)
      [10, -7, 5],    // 3: Database (Emerald Trough)
      [28, 6, -3],    // 4: Playwright Synthesizer (Amber Crest)
      [46, -2, 2],    // 5: Edge CDN / Dispatch (Crimson)
    ];

    const nodeMeshes: {
      group: THREE.Group;
      core: THREE.Mesh;
      wire: THREE.Mesh;
      halo: THREE.Mesh;
      rotSpeed: { x: number; y: number; z: number };
      pos: THREE.Vector3;
    }[] = [];

    // Helper to create glowing core
    function createGlowingCore(radius: number, colorHex: number) {
      const coreGeo = new THREE.SphereGeometry(radius, 24, 24);
      const coreMat = new THREE.MeshBasicMaterial({
        color: colorHex,
      });
      return new THREE.Mesh(coreGeo, coreMat);
    }

    // Helper to create halo ring
    function createHaloRing(radius: number, colorHex: number) {
      const ringGeo = new THREE.RingGeometry(radius, radius + 0.35, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
      });
      const halo = new THREE.Mesh(ringGeo, ringMat);
      halo.rotation.x = Math.PI / 2.5;
      return halo;
    }

    // Node 0: Client Layer (Cyan Cube)
    {
      const pos = new THREE.Vector3(...nodePositions[0]);
      const group = new THREE.Group();
      group.position.copy(pos);
      masterGroup.add(group);

      const wireGeo = new THREE.BoxGeometry(6.5, 6.5, 6.5);
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x00F0FF,
        wireframe: true,
        transparent: true,
        opacity: 0.85,
      });
      const wire = new THREE.Mesh(wireGeo, wireMat);
      group.add(wire);

      const core = createGlowingCore(1.9, 0x38BDF8);
      group.add(core);

      const halo = createHaloRing(5.5, 0x00F0FF);
      group.add(halo);

      nodeMeshes.push({ group, core, wire, halo, rotSpeed: { x: 0.008, y: 0.012, z: 0.004 }, pos });
    }

    // Node 1: API Ring Buffer (Violet Icosahedron)
    {
      const pos = new THREE.Vector3(...nodePositions[1]);
      const group = new THREE.Group();
      group.position.copy(pos);
      masterGroup.add(group);

      const wireGeo = new THREE.IcosahedronGeometry(4.85, 1);
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0xA855F7,
        wireframe: true,
        transparent: true,
        opacity: 0.85,
      });
      const wire = new THREE.Mesh(wireGeo, wireMat);
      group.add(wire);

      const core = createGlowingCore(1.9, 0xC084FC);
      group.add(core);

      const halo = createHaloRing(5.7, 0xA855F7);
      group.add(halo);

      nodeMeshes.push({ group, core, wire, halo, rotSpeed: { x: 0.01, y: 0.008, z: 0.006 }, pos });
    }

    // Node 2: AI Core (Magenta/Pink Polyhedron - Peak Crest)
    {
      const pos = new THREE.Vector3(...nodePositions[2]);
      const group = new THREE.Group();
      group.position.copy(pos);
      masterGroup.add(group);

      const wireGeo = new THREE.DodecahedronGeometry(5.45);
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0xEC4899,
        wireframe: true,
        transparent: true,
        opacity: 0.9,
      });
      const wire = new THREE.Mesh(wireGeo, wireMat);
      group.add(wire);

      const core = createGlowingCore(2.3, 0xF472B6);
      group.add(core);

      const halo = createHaloRing(6.3, 0xEC4899);
      group.add(halo);

      nodeMeshes.push({ group, core, wire, halo, rotSpeed: { x: 0.012, y: 0.015, z: 0.008 }, pos });
    }

    // Node 3: Database (Emerald Cylinder / Turbine Array - Trough)
    {
      const pos = new THREE.Vector3(...nodePositions[3]);
      const group = new THREE.Group();
      group.position.copy(pos);
      masterGroup.add(group);

      const wireGeo = new THREE.CylinderGeometry(5.05, 5.05, 3.4, 20, 3, false);
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x10B981,
        wireframe: true,
        transparent: true,
        opacity: 0.85,
      });
      const wire = new THREE.Mesh(wireGeo, wireMat);
      group.add(wire);

      const core = createGlowingCore(1.9, 0x34D399);
      group.add(core);

      const halo = createHaloRing(5.8, 0x10B981);
      group.add(halo);

      nodeMeshes.push({ group, core, wire, halo, rotSpeed: { x: 0.006, y: 0.018, z: 0.004 }, pos });
    }

    // Node 4: Playwright Synthesizer (Amber Hourglass / Dual-Cone)
    {
      const pos = new THREE.Vector3(...nodePositions[4]);
      const group = new THREE.Group();
      group.position.copy(pos);
      masterGroup.add(group);

      const wireGeo = new THREE.OctahedronGeometry(5.05, 0);
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0xF59E0B,
        wireframe: true,
        transparent: true,
        opacity: 0.85,
      });
      const wire = new THREE.Mesh(wireGeo, wireMat);
      group.add(wire);

      const core = createGlowingCore(1.9, 0xFBBF24);
      group.add(core);

      const halo = createHaloRing(5.7, 0xF59E0B);
      group.add(halo);

      nodeMeshes.push({ group, core, wire, halo, rotSpeed: { x: 0.014, y: 0.008, z: 0.01 }, pos });
    }

    // Node 5: Edge Dispatch (Crimson Geodesic Sphere)
    {
      const pos = new THREE.Vector3(...nodePositions[5]);
      const group = new THREE.Group();
      group.position.copy(pos);
      masterGroup.add(group);

      const wireGeo = new THREE.SphereGeometry(5.05, 16, 16);
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0xEF4444,
        wireframe: true,
        transparent: true,
        opacity: 0.85,
      });
      const wire = new THREE.Mesh(wireGeo, wireMat);
      group.add(wire);

      const core = createGlowingCore(1.9, 0xF87171);
      group.add(core);

      const halo = createHaloRing(5.7, 0xEF4444);
      group.add(halo);

      nodeMeshes.push({ group, core, wire, halo, rotSpeed: { x: 0.008, y: 0.012, z: 0.005 }, pos });
    }

    // =========================================================================
    // 4. UNDULATING SINE CONDUIT & STREAMING BEAD PARTICLES
    // =========================================================================
    const curvePoints = nodePositions.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const pipelineCurve = new THREE.CatmullRomCurve3(curvePoints, false, 'centripetal', 0.5);

    // Glowing dashed line along the curve
    const conduitSamples = 200;
    const sampledPoints = pipelineCurve.getPoints(conduitSamples);
    const conduitGeo = new THREE.BufferGeometry().setFromPoints(sampledPoints);

    // Vertex colors transitioning along the spectrum: Cyan -> Violet -> Magenta -> Emerald -> Amber -> Crimson
    const colors = new Float32Array(conduitSamples * 3);
    const colorSpectrum = [
      new THREE.Color(0x00F0FF),
      new THREE.Color(0xA855F7),
      new THREE.Color(0xEC4899),
      new THREE.Color(0x10B981),
      new THREE.Color(0xF59E0B),
      new THREE.Color(0xEF4444),
    ];

    for (let i = 0; i < conduitSamples; i++) {
      const t = i / (conduitSamples - 1);
      const segmentIndex = Math.min(Math.floor(t * (colorSpectrum.length - 1)), colorSpectrum.length - 2);
      const segmentT = (t * (colorSpectrum.length - 1)) - segmentIndex;
      const c = colorSpectrum[segmentIndex].clone().lerp(colorSpectrum[segmentIndex + 1], segmentT);

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    conduitGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const conduitMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const conduitLine = new THREE.Line(conduitGeo, conduitMat);
    masterGroup.add(conduitLine);

    // Pulse Packets (Beads of Light Traveling along the Conduit)
    const packetCount = 8;
    const packetMeshes: { mesh: THREE.Mesh; progress: number; speed: number }[] = [];

    for (let i = 0; i < packetCount; i++) {
      const pGeo = new THREE.SphereGeometry(0.72, 12, 12);
      const pMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        blending: THREE.AdditiveBlending,
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      masterGroup.add(pMesh);
      packetMeshes.push({
        mesh: pMesh,
        progress: i / packetCount,
        speed: 0.0018 + (i % 2) * 0.0004,
      });
    }

    // =========================================================================
    // 5. MOUSE INTERACTION & ORBIT TILT
    // =========================================================================
    let targetRotY = 0;
    let targetRotX = 0;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) {
        // Ambient subtle parallax
        const rect = mount.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        targetRotY = nx * 0.18;
        targetRotX = -ny * 0.12;
        return;
      }

      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      targetRotY += deltaX * 0.005;
      targetRotX += deltaY * 0.003;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    mount.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // =========================================================================
    // 6. ANIMATION & 2D COORDINATE PROJECTION LOOP
    // =========================================================================
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const tempV = new THREE.Vector3();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth camera/mastergroup damping
      masterGroup.rotation.y += (targetRotY - masterGroup.rotation.y) * 0.05;
      masterGroup.rotation.x += (targetRotX - masterGroup.rotation.x) * 0.05;

      // Rotate starfield slowly
      starPoints.rotation.y = elapsed * 0.015;

      // Rotate nodes & pulse cores
      nodeMeshes.forEach((node, idx) => {
        node.wire.rotation.x += node.rotSpeed.x;
        node.wire.rotation.y += node.rotSpeed.y;
        node.wire.rotation.z += node.rotSpeed.z;

        node.halo.rotation.z += 0.01;

        // Core pulsating scale
        const scale = 1.0 + Math.sin(elapsed * 3.5 + idx * 1.2) * 0.18;
        node.core.scale.set(scale, scale, scale);
      });

      // Move packet beads
      packetMeshes.forEach((pkt) => {
        pkt.progress = (pkt.progress + pkt.speed) % 1.0;
        const pt = pipelineCurve.getPointAt(pkt.progress);
        pkt.mesh.position.copy(pt);

        // Color matches position
        const seg = Math.min(Math.floor(pkt.progress * (colorSpectrum.length - 1)), colorSpectrum.length - 2);
        const segT = (pkt.progress * (colorSpectrum.length - 1)) - seg;
        const c = colorSpectrum[seg].clone().lerp(colorSpectrum[seg + 1], segT);
        (pkt.mesh.material as THREE.MeshBasicMaterial).color.copy(c);
      });

      // Project 3D node world coordinates into 2D screen coordinates for HTML badges
      const newCoords: { [id: string]: { x: number; y: number; visible: boolean } } = {};
      const halfWidth = mount.clientWidth / 2;
      const halfHeight = mount.clientHeight / 2;

      nodeMeshes.forEach((node, idx) => {
        tempV.copy(node.pos);
        node.group.getWorldPosition(tempV);
        tempV.project(camera);

        const isBehind = tempV.z > 1;
        const sx = tempV.x * halfWidth + halfWidth;
        const sy = -(tempV.y * halfHeight) + halfHeight;

        newCoords[ARCHITECTURE_NODES[idx].id] = {
          x: sx,
          y: sy,
          visible: !isBehind,
        };
      });

      setScreenCoords(newCoords);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      mount.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '640px',
        height: '75vh',
        maxHeight: '800px',
        overflow: 'hidden',
        background: '#07080A',
        userSelect: 'none',
      }}
    >
      {/* Three.js Canvas Container */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* Futuristic HUD Corner Brackets */}
      <div className="hud-bracket hud-bracket-tl" style={{ borderColor: '#00F0FF' }} />
      <div className="hud-bracket hud-bracket-tr" style={{ borderColor: '#A855F7' }} />
      <div className="hud-bracket hud-bracket-bl" style={{ borderColor: '#10B981' }} />
      <div className="hud-bracket hud-bracket-br" style={{ borderColor: '#EF4444' }} />

      {/* Top Left Futuristic Telemetry Beacon */}
      <div
        style={{
          position: 'absolute',
          top: '1.25rem',
          left: '1.5rem',
          fontFamily: 'monospace',
          fontSize: '0.72rem',
          color: '#94A3B8',
          zIndex: 20,
          pointerEvents: 'none',
          background: 'rgba(10, 12, 20, 0.65)',
          padding: '0.4rem 0.8rem',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#00F0FF', fontWeight: 800 }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00F0FF', boxShadow: '0 0 8px #00F0FF' }} />
          <span>SYS_TELEMETRY: ACTIVE (6/6 NODES)</span>
        </div>
        <div style={{ fontSize: '0.66rem', color: '#64748B', marginTop: '0.2rem' }}>
          ORBITAL INCLINATION: 34.25° • LATENCY: 0.8ms
        </div>
      </div>

      {/* Top Right Futuristic Encryption Status */}
      <div
        style={{
          position: 'absolute',
          top: '1.25rem',
          right: '1.5rem',
          fontFamily: 'monospace',
          fontSize: '0.72rem',
          color: '#94A3B8',
          zIndex: 20,
          pointerEvents: 'none',
          textAlign: 'right',
          background: 'rgba(10, 12, 20, 0.65)',
          padding: '0.4rem 0.8rem',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ color: '#C084FC', fontWeight: 800 }}>BUFFER_CAPACITY: 50-SLOT RING</div>
        <div style={{ fontSize: '0.66rem', color: '#64748B', marginTop: '0.2rem' }}>
          AES-GCM-256 • LUHN_FILTER: PASS
        </div>
      </div>

      {/* Floating 3D Projections: Glassmorphic Node Badges */}
      {ARCHITECTURE_NODES.map((node) => {
        const coords = screenCoords[node.id];
        if (!coords || !coords.visible) return null;

        const isHovered = isHovering === node.id;
        const isSelected = selectedNode?.id === node.id;

        // Position pill badge: place directly above or below node
        // Alternate placement: Client (above), Gateway (below), AI Core (above), DB (below), Rendering (above), Dispatch (below)
        const isAbove = node.id === 'client' || node.id === 'ai-core' || node.id === 'rendering';
        const offsetY = isAbove ? -48 : 42;

        return (
          <div
            key={node.id}
            onClick={() => setSelectedNode(node)}
            onMouseEnter={() => setIsHovering(node.id)}
            onMouseLeave={() => setIsHovering(null)}
            style={{
              position: 'absolute',
              left: `${coords.x}px`,
              top: `${coords.y + offsetY}px`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
              cursor: 'pointer',
              zIndex: isSelected ? 40 : 25,
              transition: 'transform 0.15s ease, box-shadow 0.2s ease',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                background: isSelected
                  ? 'rgba(255, 255, 255, 0.14)'
                  : isHovered
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(13, 15, 24, 0.78)',
                backdropFilter: 'blur(20px) saturate(190%)',
                WebkitBackdropFilter: 'blur(20px) saturate(190%)',
                border: isSelected
                  ? `1.5px solid ${node.color}`
                  : isHovered
                    ? `1px solid ${node.color}`
                    : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: isSelected || isHovered
                  ? `0 8px 24px rgba(0, 0, 0, 0.7), 0 0 16px ${node.glowColor}`
                  : '0 4px 16px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: node.color,
                  boxShadow: `0 0 8px ${node.color}`,
                }}
              />
              <span>{node.name}</span>
            </div>

            {/* Futuristic Animated SVG Target Reticle on Hover/Select */}
            {(isHovered || isSelected) && (
              <svg
                width="34"
                height="34"
                viewBox="0 0 34 34"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  animation: 'neon-glow-pulse 2s infinite',
                }}
              >
                <circle cx="17" cy="17" r="15" fill="none" stroke={node.color} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                <path d="M 17 2 L 17 6 M 17 28 L 17 32 M 2 17 L 6 17 M 28 17 L 32 17" stroke={node.color} strokeWidth="1.5" />
              </svg>
            )}
          </div>
        );
      })}

      {/* Bottom Center Pill Badge: '• SYSTEM ARCHITECTURE' (Exact match to AssignAI image) */}
      <div
        style={{
          position: 'absolute',
          bottom: '1.75rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: '0.5rem 1.4rem',
            borderRadius: '9999px',
            background: 'rgba(16, 18, 30, 0.75)',
            backdropFilter: 'blur(24px) saturate(200%)',
            WebkitBackdropFilter: 'blur(24px) saturate(200%)',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.8), 0 0 25px rgba(168, 85, 247, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            color: '#F8FAFC',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#00F0FF',
              boxShadow: '0 0 8px #00F0FF',
            }}
          />
          <span>System Architecture</span>
        </div>
      </div>

      {/* Interactive Detail Modal / Sliding Drawer for Selected Node */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              bottom: '2.5rem',
              right: '2.5rem',
              maxWidth: '430px',
              width: 'calc(100% - 5rem)',
              zIndex: 50,
              background: 'rgba(13, 15, 24, 0.92)',
              backdropFilter: 'blur(28px) saturate(200%)',
              WebkitBackdropFilter: 'blur(28px) saturate(200%)',
              borderRadius: '20px',
              border: `1px solid ${selectedNode.color}`,
              boxShadow: `0 24px 60px rgba(0, 0, 0, 0.85), 0 0 35px ${selectedNode.glowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
              padding: '1.75rem',
              color: '#F8FAFC',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: selectedNode.color,
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    border: `1px solid ${selectedNode.glowColor}`,
                  }}
                >
                  {selectedNode.badge}
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', marginTop: '0.4rem', letterSpacing: '-0.02em' }}>
                  {selectedNode.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Summary */}
            <p style={{ fontSize: '0.86rem', color: '#94A3B8', lineHeight: 1.55, marginBottom: '1.25rem' }}>
              {selectedNode.summary}
            </p>

            {/* Metrics Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.65rem',
                marginBottom: '1.25rem',
              }}
            >
              {selectedNode.metrics.map((m, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '0.65rem 0.5rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.66rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#FFFFFF', fontWeight: 800, marginTop: '0.2rem' }}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Technical Bullet Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.25rem' }}>
              {selectedNode.details.map((detail, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', color: '#CBD5E1' }}>
                  <CheckCircle2 size={14} color={selectedNode.color} style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span>{detail}</span>
                </div>
              ))}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedNode(null)}
              className="btn-secondary"
              style={{ width: '100%', padding: '0.55rem', fontSize: '0.82rem' }}
            >
              Close Dossier
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

