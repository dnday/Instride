"use client";

import { useEffect, useRef } from "react";

import { MOOD_COLORS } from "@/lib/mood";

/**
 * Latar 3D landing: "bola mood" berwarna (palet mood Instride) melayang pelan, kamera bergeser mengikuti kursor.
 * Performa (MengTo optimize-web-animations): three.js dimuat dinamis setelah halaman tampil, loop render berhenti
 * saat kanvas di luar layar atau tab tersembunyi, DPR dibatasi 2, semua resource di-dispose saat unmount.
 * Reduce motion: satu frame diam tanpa loop. Tanpa WebGL: kanvas tidak muncul.
 */
export default function MoodOrbs({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    import("three").then((THREE) => {
      if (disposed) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      } catch {
        return; // WebGL tidak tersedia
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      camera.position.set(0, 0, 14);

      scene.add(new THREE.HemisphereLight(0xffffff, 0xcfe9e6, 1.6));
      const key = new THREE.DirectionalLight(0xffffff, 1.4);
      key.position.set(4, 6, 8);
      scene.add(key);

      const geometry = new THREE.SphereGeometry(1, 48, 48);
      const materials = [1, 2, 3, 4, 5].map(
        (v) =>
          new THREE.MeshPhysicalMaterial({
            color: MOOD_COLORS[v].fill,
            roughness: 0.35,
            clearcoat: 0.8,
            clearcoatRoughness: 0.25,
            transparent: true,
            opacity: 0.92,
          }),
      );

      // Posisi tetap (deterministik) agar komposisi selalu seimbang; lebih banyak bola sejuk (mood baik)
      const layout: [number, number, number, number, number][] = [
        // x, y, z, skala, mood
        [-5.6, 2.4, -2, 0.9, 5], [-3.2, -2.6, 0, 0.6, 4], [-6.4, -1.2, -4, 1.3, 3], [5.8, 2.8, -3, 1.1, 4],
        [3.6, -2.2, 1, 0.55, 2], [6.6, -2.8, -2, 0.85, 5], [1.2, 3.6, -5, 0.7, 1], [-1.4, 3.2, -1, 0.45, 4],
        [0.4, -3.6, -3, 0.95, 5], [-7.6, 3.6, -6, 0.75, 2], [8.2, 0.6, -6, 1.2, 3], [-2.4, 0.4, -7, 1.6, 5],
      ];
      const orbs = layout.map(([x, y, z, s, mood], i) => {
        const mesh = new THREE.Mesh(geometry, materials[mood - 1]);
        mesh.position.set(x, y, z);
        mesh.scale.setScalar(s);
        scene.add(mesh);
        return { mesh, base: new THREE.Vector3(x, y, z), phase: i * 1.7, speed: 0.25 + (i % 4) * 0.07 };
      });

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = el;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      // Parallax kursor: kamera bergeser sedikit ke arah pointer, dihaluskan
      const target = { x: 0, y: 0 };
      const onPointer = (e: PointerEvent) => {
        target.x = (e.clientX / window.innerWidth - 0.5) * 2;
        target.y = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const clock = new THREE.Clock();
      let frame = 0;
      let visible = true;

      const render = () => {
        const t = clock.getElapsedTime();
        for (const o of orbs) {
          o.mesh.position.x = o.base.x + Math.sin(t * o.speed + o.phase) * 0.35;
          o.mesh.position.y = o.base.y + Math.cos(t * o.speed * 0.8 + o.phase) * 0.45;
        }
        camera.position.x += (target.x * 1.2 - camera.position.x) * 0.04;
        camera.position.y += (-target.y * 0.8 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, -2);
        renderer.render(scene, camera);
      };
      const loop = () => {
        render();
        frame = requestAnimationFrame(loop);
      };
      const start = () => {
        if (!frame && visible && !document.hidden && !reduce) {
          clock.start();
          frame = requestAnimationFrame(loop);
        }
      };
      const stop = () => {
        cancelAnimationFrame(frame);
        frame = 0;
      };

      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      }, { threshold: 0.01 });
      io.observe(el);
      const onVisibility = () => (document.hidden ? stop() : start());
      document.addEventListener("visibilitychange", onVisibility);

      render(); // frame pertama (juga satu-satunya frame bila reduce motion)
      start();
      el.dataset.ready = "true";

      cleanup = () => {
        stop();
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("pointermove", onPointer);
        document.removeEventListener("visibilitychange", onVisibility);
        geometry.dispose();
        materials.forEach((m) => m.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={host} className={`transition-opacity duration-700 data-[ready=true]:opacity-100 opacity-0 ${className}`} />;
}
