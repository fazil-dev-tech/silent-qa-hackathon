'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function ParticleConduitBridge() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 210);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 440);

    // Dynamic mouse position for interactive deflection
    const mouse = { x: width / 2, y: height / 2, active: false };

    // Dense fiber optic conduit strands
    const strandCount = 14;
    const strands = Array.from({ length: strandCount }, (_, i) => {
      const norm = i / (strandCount - 1); // 0 to 1
      return {
        id: i,
        norm,
        startY: height * (0.12 + norm * 0.76),
        endY: height * (0.12 + norm * 0.76),
        waistYOffset: (norm - 0.5) * 48,
        pulseOffset: Math.random() * Math.PI * 2,
        pulseSpeed: 1.5 + Math.random() * 1.5,
      };
    });

    // High-density flowing particle packets
    const particleCount = 180;
    interface Particle {
      strandIndex: number;
      progress: number; // 0 to 1 along strand
      speed: number;
      size: number;
      alpha: number;
      seed: number;
    }

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      strandIndex: Math.floor(Math.random() * strandCount),
      progress: Math.random(),
      speed: 0.006 + Math.random() * 0.012,
      size: 1.2 + Math.random() * 2.4,
      alpha: 0.3 + Math.random() * 0.7,
      seed: Math.random() * 100,
    }));

    let time = 0;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      const speedMultiplier = isHovered ? 2.4 : 1.0;
      time += 0.025 * speedMultiplier;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Draw glowing fiber strands
      strands.forEach((s) => {
        const wave = Math.sin(time * s.pulseSpeed + s.pulseOffset) * (isHovered ? 12 : 7);
        const cp1x = width * 0.32;
        const cp1y = centerY + s.waistYOffset * 0.45 + wave;
        const cp2x = width * 0.68;
        const cp2y = centerY + s.waistYOffset * 0.45 - wave;

        ctx.beginPath();
        ctx.moveTo(0, s.startY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, width, s.endY);

        // Gradient from Red -> Magenta/Purple -> Cyan
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        const baseOpacity = isHovered ? 0.45 : 0.22;
        grad.addColorStop(0, `rgba(239, 68, 68, ${baseOpacity * 0.9})`);
        grad.addColorStop(0.3, `rgba(236, 72, 153, ${baseOpacity * 1.2})`);
        grad.addColorStop(0.5, `rgba(168, 85, 247, ${baseOpacity * 1.4})`);
        grad.addColorStop(0.75, `rgba(0, 240, 255, ${baseOpacity * 1.2})`);
        grad.addColorStop(1, `rgba(16, 185, 129, ${baseOpacity * 0.9})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = isHovered ? 1.6 : 1.1;
        ctx.stroke();

        // Terminal connection dock pins
        // Left Pin (Red)
        ctx.beginPath();
        ctx.arc(2, s.startY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#EF4444';
        ctx.shadowColor = '#EF4444';
        ctx.shadowBlur = 6;
        ctx.fill();

        // Right Pin (Cyan)
        ctx.beginPath();
        ctx.arc(width - 2, s.endY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#00F0FF';
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 2. Central Energy Nexus Core (Rotating multi-ring pulse)
      const corePulse = Math.sin(time * 3) * 0.2 + 0.8;
      const coreRadius = (isHovered ? 26 : 20) * corePulse;

      // Outer radial aura
      const radialGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius * 2.2);
      radialGlow.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
      radialGlow.addColorStop(0.5, 'rgba(236, 72, 153, 0.2)');
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = radialGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Inner glowing ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius * 0.7, 0, Math.PI * 2);
      ctx.strokeStyle = '#EC4899';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#EC4899';
      ctx.shadowBlur = isHovered ? 14 : 8;
      ctx.stroke();

      // Rotating dashed satellite ring
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(time * 1.2);
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius * 1.15, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.75)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.restore();
      ctx.shadowBlur = 0;

      // 3. Flowing particles along Bezier tracks
      particles.forEach((p) => {
        p.progress += p.speed * (isHovered ? 1.9 : 1.0);
        if (p.progress > 1) {
          p.progress = 0;
          p.strandIndex = Math.floor(Math.random() * strandCount);
        }

        const strand = strands[p.strandIndex];
        const t = p.progress;
        const wave = Math.sin(time * strand.pulseSpeed + strand.pulseOffset) * (isHovered ? 12 : 7);
        const cp1x = width * 0.32;
        const cp1y = centerY + strand.waistYOffset * 0.45 + wave;
        const cp2x = width * 0.68;
        const cp2y = centerY + strand.waistYOffset * 0.45 - wave;

        // Cubic Bezier calculation: B(t) = (1-t)^3*P0 + 3(1-t)^2*t*P1 + 3(1-t)*t^2*P2 + t^3*P3
        const oneMinusT = 1 - t;
        const bx =
          Math.pow(oneMinusT, 3) * 0 +
          3 * Math.pow(oneMinusT, 2) * t * cp1x +
          3 * oneMinusT * Math.pow(t, 2) * cp2x +
          Math.pow(t, 3) * width;
        const by =
          Math.pow(oneMinusT, 3) * strand.startY +
          3 * Math.pow(oneMinusT, 2) * t * cp1y +
          3 * oneMinusT * Math.pow(t, 2) * cp2y +
          Math.pow(t, 3) * strand.endY;

        // Color interpolation based on position
        let r = 239, g = 68, b = 68;
        if (t < 0.45) {
          const localT = t / 0.45;
          r = Math.round(239 + (236 - 239) * localT);
          g = Math.round(68 + (72 - 68) * localT);
          b = Math.round(68 + (153 - 68) * localT);
        } else if (t < 0.75) {
          const localT = (t - 0.45) / 0.3;
          r = Math.round(236 + (0 - 236) * localT);
          g = Math.round(72 + (240 - 72) * localT);
          b = Math.round(153 + (255 - 153) * localT);
        } else {
          const localT = (t - 0.75) / 0.25;
          r = Math.round(0 + (16 - 0) * localT);
          g = Math.round(240 + (185 - 240) * localT);
          b = Math.round(255 + (129 - 255) * localT);
        }

        const alphaP = Math.sin(t * Math.PI) * (isHovered ? 1.0 : p.alpha);

        ctx.beginPath();
        ctx.arc(bx, by, p.size * (isHovered ? 1.3 : 1.0), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alphaP})`;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.9)`;
        ctx.shadowBlur = isHovered ? 12 : 7;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    };

    render();

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth || 210;
      height = canvas.height = canvas.parentElement.clientHeight || 440;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isHovered]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        width: '210px',
        height: '440px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        cursor: 'pointer',
      }}
      title="Interactive Causal AI Synthesis Pipeline (Hover to Accelerate)"
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Center Badge Pill: 'SYNTHESIS PIPELINE' */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          padding: '0.2rem 0.6rem',
          borderRadius: '9999px',
          background: 'rgba(10, 12, 18, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: isHovered ? '1px solid rgba(236, 72, 153, 0.7)' : '1px solid rgba(168, 85, 247, 0.4)',
          boxShadow: isHovered ? '0 0 16px rgba(236, 72, 153, 0.6)' : '0 0 10px rgba(168, 85, 247, 0.3)',
          color: '#F8FAFC',
          fontSize: '0.62rem',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          transition: 'all 0.25s ease',
        }}
      >
        <span style={{ color: isHovered ? '#00F0FF' : '#C084FC' }}>✦ SYNTHESIS ✦</span>
      </div>
    </div>
  );
}
