"use client";

import { useEffect, useRef } from "react";

/**
 * The drifting neural-network field behind the dark app section.
 *
 * Canvas rather than DOM: the effect is ~70 nodes plus every near-enough pair
 * between them, which is a few hundred lines redrawn each frame. As elements
 * that is a layout and paint per frame; as one canvas it is a single composited
 * layer.
 *
 * Two things move, and they are deliberately out of step so the field never
 * settles into a readable rhythm:
 *
 *  - Each node drifts on its own slow random velocity and wraps at the edges.
 *  - A pair of long sine waves rolls underneath at a different period, which is
 *    what keeps it reading as a field rather than as scattered dots.
 *
 * Lines fade with distance, so the mesh thins out and re-forms as nodes pass one
 * another — that is the whole effect, and it comes from the alpha rather than
 * from any explicit connect/disconnect logic.
 */

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

/** Beyond this many px apart, two nodes are not drawn as connected. */
const LINK_DISTANCE = 130;
/** One node per this many px² of canvas, capped — density that reads on a phone
 *  would be a haze on a 4K monitor. */
const AREA_PER_NODE = 14000;
const MAX_NODES = 90;

export default function NeuralWaves({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Anyone who asked the OS to reduce motion gets one static frame: the mesh
    // is decoration, and a still one still carries the texture.
    const stillOnly = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let frame = 0;
    let phase = 0;

    function seed() {
      const count = Math.min(MAX_NODES, Math.round((width * height) / AREA_PER_NODE));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        // Slow, and signed independently per axis, so there is no shared drift
        // direction for the eye to lock onto.
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: 0.9 + Math.random() * 1.5,
      }));
    }

    function resize() {
      // Back the canvas at device resolution or the 1px lines alias into mush.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function drawWaves() {
      // Two sines at different periods and speeds — where they overlap the band
      // brightens, which is what makes the motion look non-repeating.
      for (let w = 0; w < 2; w++) {
        const amplitude = 26 + w * 16;
        const period = 320 + w * 190;
        const baseline = height * (0.42 + w * 0.22);
        const speed = phase * (0.6 + w * 0.35);

        ctx!.beginPath();
        for (let x = 0; x <= width; x += 8) {
          const y =
            baseline +
            Math.sin(x / period + speed) * amplitude +
            Math.sin(x / (period * 0.45) - speed * 1.4) * (amplitude * 0.35);
          if (x === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.strokeStyle = w === 0 ? "rgba(244,63,94,0.16)" : "rgba(139,92,246,0.13)";
        ctx!.lineWidth = 1.2;
        ctx!.stroke();
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      drawWaves();

      // Links first, so the nodes sit on top of their own connections.
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist > LINK_DISTANCE) continue;

          // Fade to nothing exactly at the threshold, so links appear and vanish
          // smoothly instead of popping in at full strength.
          const alpha = (1 - dist / LINK_DISTANCE) * 0.4;
          ctx!.beginPath();
          ctx!.moveTo(nodes[i].x, nodes[i].y);
          ctx!.lineTo(nodes[j].x, nodes[j].y);
          ctx!.strokeStyle = `rgba(148,163,184,${alpha})`;
          ctx!.lineWidth = 0.7;
          ctx!.stroke();
        }
      }

      for (const n of nodes) {
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fillStyle = "rgba(226,232,240,0.55)";
        ctx!.fill();
      }
    }

    function step() {
      phase += 0.006;
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        // Wrap rather than bounce: bouncing packs nodes against the edges over
        // time, and the seams are invisible behind the section's own gradients.
        if (n.x < -20) n.x = width + 20;
        if (n.x > width + 20) n.x = -20;
        if (n.y < -20) n.y = height + 20;
        if (n.y > height + 20) n.y = -20;
      }
      draw();
      frame = requestAnimationFrame(step);
    }

    resize();
    if (stillOnly) draw();
    else frame = requestAnimationFrame(step);

    // ResizeObserver, not the window resize event — the section's height changes
    // with its own content (the phone row wraps), not only with the viewport.
    const observer = new ResizeObserver(() => {
      resize();
      if (stillOnly) draw();
    });
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
