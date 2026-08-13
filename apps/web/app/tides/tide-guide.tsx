"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { createEarth } from "./_scene/earth";
import { createMoon } from "./_scene/moon";
import { createSky } from "./_scene/sky";
import { createSun } from "./_scene/sun";

export function TideGuide() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!canvasRef.current) return;
		const canvas = canvasRef.current;

		let disposed = false;
		const TAU = Math.PI * 2;
		const SUN_R = 5.2; // distance compressed for legibility (Sun is really ~far)
		const MOON_R = 3.0;

		const $ = (id: string) => document.getElementById(id) as HTMLElement;

		// ---------- renderer / scene / camera ----------
		const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
		renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 0.95;
		renderer.outputColorSpace = THREE.SRGBColorSpace;

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 400);
		camera.position.set(5.5, 5.0, 8.5);

		const controls = new OrbitControls(camera, canvas);
		controls.enableDamping = true;
		controls.dampingFactor = 0.08;
		controls.minDistance = 3.2;
		controls.maxDistance = 20;
		controls.enablePan = false;
		controls.target.set(0, 0, 0);

		// ---------- worlds ----------
		const sky = createSky();
		scene.add(sky.group);

		const earth = createEarth(1);
		scene.add(earth.group);

		const moon = createMoon(0.27);
		moon.mesh.name = "moon";
		scene.add(moon.mesh);

		const sun = createSun(0.62);
		scene.add(sun.group);

		// faint orbit guides
		function ring(r: number, color: number, op: number) {
			const m = new THREE.Mesh(
				new THREE.RingGeometry(r - 0.012, r + 0.012, 128),
				new THREE.MeshBasicMaterial({
					color,
					transparent: true,
					opacity: op,
					side: THREE.DoubleSide,
				}),
			);
			m.rotation.x = -Math.PI / 2;
			return m;
		}
		scene.add(ring(MOON_R, 0x2a3550, 0.55));
		scene.add(ring(SUN_R, 0x3a2a20, 0.35));

		// a "your beach" marker that rides the equator, used in the lesson to show a
		// coast turning through both bulges (the reason the tide comes and goes)
		const marker = new THREE.Mesh(
			new THREE.SphereGeometry(0.055, 20, 20),
			new THREE.MeshBasicMaterial({ color: 0xffcf8a }),
		);
		marker.visible = false;
		scene.add(marker);

		// "you are here" location pin — a sewing pin: a thin steel shaft planted in the
		// globe with a round red head, placed at the visitor's latitude/longitude and
		// standing up from the spinning surface along its local normal.
		const PIN_SHAFT = 0.17;
		const pin = new THREE.Group();
		const pinShaft = new THREE.Mesh(
			new THREE.CylinderGeometry(0.006, 0.006, PIN_SHAFT, 10),
			new THREE.MeshBasicMaterial({ color: 0xe2e5ee }),
		);
		pinShaft.position.y = PIN_SHAFT / 2; // base at y=0, shaft points +Y
		const pinHead = new THREE.Mesh(
			new THREE.SphereGeometry(0.03, 20, 20),
			new THREE.MeshBasicMaterial({ color: 0xd8342b }),
		);
		pinHead.position.y = PIN_SHAFT + 0.02;
		pin.add(pinShaft, pinHead);
		pin.visible = false;
		scene.add(pin);
		const PIN_UP = new THREE.Vector3(0, 1, 0);
		const pinDir = new THREE.Vector3();

		// geographic (lat,lon in degrees) → direction in the Earth's texture (spun) frame,
		// matching the equirectangular mapping used in the shader
		let pinRot: THREE.Vector3 | null = null;
		function setPin(lat: number, lon: number) {
			const la = (lat * Math.PI) / 180;
			const lo = (lon * Math.PI) / 180;
			const cl = Math.cos(la);
			pinRot = new THREE.Vector3(cl * Math.cos(lo), Math.sin(la), -cl * Math.sin(lo)).normalize();
			pin.visible = true;
		}
		setPin(37.29, -8.8); // default: Aljezur (our home) until the visitor's location resolves
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(p) => {
					if (!disposed) setPin(p.coords.latitude, p.coords.longitude);
				},
				() => {},
				{ enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
			);
		}

		// ---------- post ----------
		const composer = new EffectComposer(renderer);
		composer.addPass(new RenderPass(scene, camera));
		composer.addPass(
			new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.55, 0.85),
		);
		composer.addPass(new OutputPass());

		// ---------- state ----------
		let sunAngle = 0.0;
		let moonAngle = 0.0; // actual body angles (XZ plane)
		let tgtSun = 0.0;
		let tgtMoon = 0.0; // targets (presets ease toward these)
		const smMoonDir = new THREE.Vector3(1, 0, 0); // smoothed dirs → liquid lag
		const smSunDir = new THREE.Vector3(1, 0, 0);
		let spin = 0;
		let spinRate = 0.05; // Earth's rotation speed (lesson speeds this up to show intervals)
		let showMarker = false;
		let mode = "lesson"; // "lesson" | "explore"

		const posFromAngle = (a: number, r: number) =>
			new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
		const shortAngle = (from: number, to: number) => {
			let d = (to - from) % TAU;
			if (d > Math.PI) d -= TAU;
			if (d < -Math.PI) d += TAU;
			return d;
		};

		// ---------- live description ----------
		function phaseName(p: number) {
			const d = (p * 180) / Math.PI;
			if (d < 12 || d > 348) return "New Moon";
			if (Math.abs(d - 90) < 12) return "First Quarter";
			if (Math.abs(d - 180) < 12) return "Full Moon";
			if (Math.abs(d - 270) < 12) return "Last Quarter";
			if (d < 90) return "Waxing crescent";
			if (d < 180) return "Waxing gibbous";
			if (d < 270) return "Waning gibbous";
			return "Waning crescent";
		}
		const DESC: Record<string, [string, string]> = {
			"New Moon": [
				"Spring tide",
				"Sun, Earth and Moon in a line — the two pulls add up. Biggest range: highest highs, lowest lows.",
			],
			"Full Moon": [
				"Spring tide",
				"Earth sits between Sun and Moon, all in line — the pulls add again. Another big spring tide.",
			],
			"First Quarter": [
				"Neap tide",
				"Sun and Moon at right angles — their bulges fight and partly cancel. The sea barely moves.",
			],
			"Last Quarter": [
				"Neap tide",
				"Right angles again — the bulges cancel. A neap, or Dutch <i>doodtij</i>: a dead, small tide.",
			],
		};
		function classify(phase: number) {
			const p = ((phase % TAU) + TAU) % TAU;
			const name = phaseName(p);
			const d = DESC[name];
			if (d) return { name, kind: d[0], desc: d[1] };
			const deg = (p * 180) / Math.PI;
			const dSpring = Math.min(Math.abs(deg - 0), Math.abs(deg - 360), Math.abs(deg - 180));
			const dNeap = Math.min(Math.abs(deg - 90), Math.abs(deg - 270));
			return dSpring < dNeap
				? {
						name,
						kind: "Building toward spring",
						desc: "The Sun and Moon are lining up — the tidal range is growing.",
					}
				: {
						name,
						kind: "Fading toward neap",
						desc: "The pulls are crossing — the tidal range is shrinking.",
					};
		}
		function updateReadout() {
			const phase = moonAngle - sunAngle;
			const c = classify(phase);
			// (original ran this on every frame via `|| true`; keep that behaviour)
			$("phase-name").textContent = c.name;
			$("desc").innerHTML = c.desc;
			const badge = $("kind-badge");
			badge.textContent = c.kind;
			badge.className = `badge${/neap/i.test(c.kind) ? " neap" : ""}`;
			const r = 1.0 + 0.46 * (3 * Math.cos(phase) * Math.cos(phase) - 1) * 0.5;
			$("meter").style.width =
				`${Math.max(8, Math.min(100, ((r - 0.6) / (1.46 - 0.6)) * 82 + 18))}%`;
			$("range-val").textContent = `${Math.round((r / 1.46) * 100)}% of max`;
		}

		// ---------- hint ----------
		let hintGone = false;
		let hintTimeout: ReturnType<typeof setTimeout> | undefined;
		function hideHint() {
			if (hintGone) return;
			hintGone = true;
			const h = document.getElementById("hint");
			if (h) {
				h.style.opacity = "0";
				hintTimeout = setTimeout(() => {
					h.style.display = "none";
				}, 400);
			}
		}

		// ---------- tide menu ----------
		const menuBtns = Array.from(document.querySelectorAll<HTMLElement>(".tideguide .tm"));
		const clearActive = () => {
			for (const b of menuBtns) b.classList.remove("active");
		};
		for (const b of menuBtns) {
			b.onclick = () => {
				const offset = (Number(b.dataset.phase) * Math.PI) / 180;
				tgtMoon = sunAngle + offset; // relative to the Sun's current position
				clearActive();
				b.classList.add("active");
				hideHint();
			};
		}

		// ---------- drag interaction ----------
		const raycaster = new THREE.Raycaster();
		const ndc = new THREE.Vector2();
		const planeY0 = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
		const hitPt = new THREE.Vector3();
		let dragging: string | null = null; // 'sun' | 'moon' | null

		function pointerAngle(ev: PointerEvent) {
			const rect = canvas.getBoundingClientRect();
			ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
			ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
			raycaster.setFromCamera(ndc, camera);
			if (raycaster.ray.intersectPlane(planeY0, hitPt)) return Math.atan2(hitPt.z, hitPt.x);
			return null;
		}

		function onCanvasPointerDown(ev: PointerEvent) {
			if (mode === "lesson") return; // the lesson drives the bodies itself
			const rect = canvas.getBoundingClientRect();
			ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
			ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
			raycaster.setFromCamera(ndc, camera);
			const hits = raycaster.intersectObjects([moon.mesh, sun.pick], false);
			const first = hits[0];
			if (first) {
				dragging = first.object.name;
				controls.enabled = false;
				hideHint();
			}
		}
		canvas.addEventListener("pointerdown", onCanvasPointerDown, true); // capture — beat OrbitControls

		function onPointerMove(ev: PointerEvent) {
			if (!dragging) return;
			const a = pointerAngle(ev);
			if (a == null) return;
			if (dragging === "sun") {
				sunAngle = a;
				tgtSun = a;
			} else {
				moonAngle = a;
				tgtMoon = a;
			}
			clearActive();
		}
		function onPointerUp() {
			dragging = null;
			controls.enabled = true;
		}
		addEventListener("pointermove", onPointerMove);
		addEventListener("pointerup", onPointerUp);

		// ---------- lesson ----------
		// Each step positions the Sun & Moon (absolute angles, radians), sets the spin
		// speed, and narrates. New/Full = Sun & Moon aligned (spring); quarter = 90°.
		type Step = {
			title: string;
			text: string;
			sun: number;
			moon: number;
			spin: number;
			marker: boolean;
			cta?: boolean;
		};
		const LESSON: Step[] = [
			{
				title: "The Moon lifts the sea",
				text: "The Moon's gravity pulls hardest on the ocean closest to it, and weakest on the ocean on the far side. That stretch raises <b>two bulges</b> of water — one under the Moon, one directly opposite. Those bulges are <b>high tide</b>.",
				sun: 0,
				moon: 0,
				spin: 0.05,
				marker: false,
			},
			{
				title: "The Sun pulls too",
				text: "The Sun is vastly bigger, but so far away that its tug on the sea is a bit <b>less than half</b> the Moon's. It raises its own smaller pair of bulges that travel along with the Moon's.",
				sun: 0,
				moon: 0,
				spin: 0.05,
				marker: false,
			},
			{
				title: "Why the tide comes and goes",
				text: "The Earth spins once a day, turning every coast <b>through both bulges and both dips</b>. So most beaches get <b>two highs and two lows</b> each day — a high roughly every <span class='num'>12 hours 25 minutes</span>. The extra 25 minutes is the Moon moving on in its orbit. Watch the marker pass through the bulges.",
				sun: 0,
				moon: 0,
				spin: 0.9,
				marker: true,
			},
			{
				title: "Spring tides: pulls add up",
				text: "At <b>new and full moon</b> the Sun and Moon line up, so their bulges stack. The sea climbs highest and drops lowest — the big range surfers call a <b>spring tide</b>.",
				sun: 0,
				moon: 0,
				spin: 0.08,
				marker: false,
			},
			{
				title: "Neap tides: pulls fight",
				text: "At the <b>half moons</b> the Sun sits at a right angle to the Moon. Their bulges pull against each other and partly cancel, so the range shrinks — a small <b>neap tide</b>.",
				sun: 0,
				moon: Math.PI / 2,
				spin: 0.08,
				marker: false,
			},
			{
				title: "Why tides differ by place",
				text: "The open-ocean bulge is only tens of centimetres. What you actually see is shaped by the <b>coast</b>: the depth and slope of the sea floor, bays that funnel the water, and basins that resonate. So the Bay of Fundy swings over <span class='num'>15 m</span>, the Mediterranean barely moves, and some coasts get just <b>one</b> high a day instead of two.",
				sun: 0,
				moon: Math.PI / 2,
				spin: 0.08,
				marker: false,
			},
			{
				title: "Here on the Costa Vicentina",
				text: "Aljezur's beaches — <b>Amoreira, Monte Clérigo, Arrifana</b> — are semidiurnal: two lows and two highs a day, a couple of metres between them. Low tide opens up sandbanks and peaks, and the hour either side of it is often the cleanest surf. Check the tide, then paddle out.",
				sun: 0,
				moon: 0,
				spin: 0.05,
				marker: false,
				cta: true,
			},
		];
		let step = 0;

		function applyStep() {
			const s = LESSON[step];
			if (!s) return;
			tgtSun = s.sun;
			tgtMoon = s.moon;
			spinRate = s.spin;
			showMarker = !!s.marker;
			$("lesson-title").innerHTML = s.title;
			$("lesson-text").innerHTML = s.text;
			$("lesson-count").textContent = `Step ${step + 1} of ${LESSON.length}`;
			$("lesson-back").style.visibility = step === 0 ? "hidden" : "visible";
			const last = step === LESSON.length - 1;
			$("lesson-next").style.display = last ? "none" : "";
			$("lesson-explore").style.display = last ? "" : "none";
		}

		// slide the toggle "thumb" to sit exactly over the active button
		function positionThumb() {
			const el = $("modes");
			const b = el.querySelector<HTMLElement>(`.mode-btn[data-mode="${mode}"]`);
			const thumb = el.querySelector<HTMLElement>(".mode-thumb");
			if (!b || !thumb) return;
			thumb.style.left = `${b.offsetLeft}px`;
			thumb.style.top = `${b.offsetTop}px`;
			thumb.style.width = `${b.offsetWidth}px`;
			thumb.style.height = `${b.offsetHeight}px`;
		}

		function setMode(m: string) {
			mode = m;
			$("lesson-inner").style.display = m === "lesson" ? "block" : "none";
			$("panel-inner").style.display = m === "explore" ? "block" : "none";
			$("tidemenu").style.display = m === "explore" ? "" : "none";
			$("hint").style.display = m === "explore" && !hintGone ? "" : "none";
			for (const b of document.querySelectorAll<HTMLElement>(".tideguide .mode-btn")) {
				b.classList.toggle("active", b.dataset.mode === m);
			}
			positionThumb();
			if (m === "lesson") {
				applyStep();
			} else {
				spinRate = 0.05;
				showMarker = false;
			}
		}
		// keep the thumb aligned as fonts load / the layout reflows
		addEventListener("load", positionThumb);
		addEventListener("resize", positionThumb);

		$("lesson-next").onclick = () => {
			if (step < LESSON.length - 1) {
				step++;
				applyStep();
			}
		};
		$("lesson-back").onclick = () => {
			if (step > 0) {
				step--;
				applyStep();
			}
		};
		$("lesson-explore").onclick = () => setMode("explore");
		for (const b of document.querySelectorAll<HTMLElement>(".tideguide .mode-btn")) {
			b.onclick = () => {
				const m = b.dataset.mode;
				if (m) setMode(m);
			};
		}

		$("panel-handle").onclick = () => $("panel").classList.toggle("collapsed");

		// ---------- resize ----------
		function onResize() {
			camera.aspect = innerWidth / innerHeight;
			camera.fov = innerWidth < 720 ? 60 : 48;
			camera.updateProjectionMatrix();
			renderer.setSize(innerWidth, innerHeight);
			composer.setSize(innerWidth, innerHeight);
		}
		addEventListener("resize", onResize);

		// ---------- loop ----------
		const clock = new THREE.Clock();
		let rafId = 0;
		function tick() {
			const dt = Math.min(clock.getDelta(), 0.05);
			const t = clock.elapsedTime;

			// ease body angles toward targets (presets glide; drag is instant)
			if (dragging !== "sun") sunAngle += shortAngle(sunAngle, tgtSun) * Math.min(1, dt * 3.2);
			if (dragging !== "moon") moonAngle += shortAngle(moonAngle, tgtMoon) * Math.min(1, dt * 3.2);

			const sunPos = posFromAngle(sunAngle, SUN_R);
			const moonPos = posFromAngle(moonAngle, MOON_R);
			sun.group.position.copy(sunPos);
			moon.mesh.position.copy(moonPos);

			// liquid lag: the water's tidal axes chase the bodies more slowly, so the
			// sea sloshes and rounds toward the pull instead of snapping.
			smSunDir.lerp(sunPos.clone().normalize(), Math.min(1, dt * 2.2)).normalize();
			smMoonDir.lerp(moonPos.clone().normalize(), Math.min(1, dt * 2.2)).normalize();

			spin += dt * spinRate; // Earth turns under the bulges (faster during the intervals step)

			// the "your beach" marker rides the spinning equator
			marker.visible = showMarker;
			if (showMarker) marker.position.set(Math.cos(spin) * 1.09, 0, Math.sin(spin) * 1.09);

			// the location pin rides the spin too (rotate its fixed geo-direction by -spin),
			// then stands upright out of the surface along that normal
			if (pinRot) {
				const cs = Math.cos(spin);
				const sn = Math.sin(spin);
				pinDir
					.set(cs * pinRot.x - sn * pinRot.z, pinRot.y, sn * pinRot.x + cs * pinRot.z)
					.normalize();
				pin.position.copy(pinDir).multiplyScalar(0.99); // base planted at the surface
				pin.quaternion.setFromUnitVectors(PIN_UP, pinDir);
			}

			earth.setSunDir(smSunDir);
			earth.setMoonDir(smMoonDir);
			earth.update(t, spin);
			// light the Moon from Moon→Sun (not origin→Sun) so its phase updates correctly
			// when the Moon itself is dragged, not only when the Sun moves
			moon.setSunDir(sunPos.clone().sub(moonPos).normalize());
			sun.update(t, camera);
			sky.update(t, camera);
			updateReadout();

			controls.update();
			composer.render();
			rafId = requestAnimationFrame(tick);
		}

		onResize();
		updateReadout();
		setMode("lesson"); // start in the guided lesson; "Explore" hands off to the sandbox
		// enable the sliding animation only after the thumb is first placed
		const thumbRaf = requestAnimationFrame(() => {
			document.querySelector<HTMLElement>(".tideguide .mode-thumb")?.classList.add("animate");
		});
		rafId = requestAnimationFrame(tick);

		// ---------- cleanup (React strict mode double-invokes effects in dev) ----------
		return () => {
			disposed = true;
			cancelAnimationFrame(rafId);
			cancelAnimationFrame(thumbRaf);
			if (hintTimeout) clearTimeout(hintTimeout);
			canvas.removeEventListener("pointerdown", onCanvasPointerDown, true);
			removeEventListener("pointermove", onPointerMove);
			removeEventListener("pointerup", onPointerUp);
			removeEventListener("resize", onResize);
			removeEventListener("resize", positionThumb);
			removeEventListener("load", positionThumb);
			controls.dispose();
			composer.dispose();
			renderer.dispose();
		};
	}, []);

	return (
		<div className="tideguide">
			<canvas id="scene" ref={canvasRef} />

			<div id="ui">
				<header id="topbar">
					<span className="brand">Surf Rental Aljezur</span>
					<span className="brand-sub">How tides work</span>
				</header>

				<div id="hint">
					Drag the <b>Sun</b> or <b>Moon</b> — the sea follows.
				</div>

				<div id="tidemenu">
					<span className="tidemenu-label">Jump to a tide</span>
					<div className="tidemenu-btns">
						<button className="tm" data-phase="0" type="button">
							New Moon<small>spring</small>
						</button>
						<button className="tm" data-phase="180" type="button">
							Full Moon<small>spring</small>
						</button>
						<button className="tm" data-phase="90" type="button">
							First Quarter<small>neap</small>
						</button>
						<button className="tm" data-phase="270" type="button">
							Last Quarter<small>neap</small>
						</button>
					</div>
				</div>

				<section id="panel" aria-live="polite">
					<button id="panel-handle" aria-label="Toggle panel" type="button" />

					<div id="modes">
						<span className="mode-thumb" aria-hidden="true" />
						<button className="mode-btn active" data-mode="lesson" type="button">
							Lesson
						</button>
						<button className="mode-btn" data-mode="explore" type="button">
							Explore
						</button>
					</div>

					{/* LESSON: guided, narrated walkthrough */}
					<div id="lesson-inner">
						<span className="step-count" id="lesson-count">
							Step 1 of 6
						</span>
						<h1 id="lesson-title">The Moon lifts the sea</h1>
						<div id="lesson-text">…</div>
						<div className="lesson-controls">
							<button id="lesson-back" className="btn btn-ghost" type="button">
								← Back
							</button>
							<button id="lesson-next" className="btn btn-solid" type="button">
								Next →
							</button>
							<button
								id="lesson-explore"
								className="btn btn-solid"
								style={{ display: "none" }}
								type="button"
							>
								Play around yourself →
							</button>
						</div>
					</div>

					{/* EXPLORE: free-play readout */}
					<div id="panel-inner" style={{ display: "none" }}>
						<div className="live-head">
							<h1 id="phase-name">New Moon</h1>
							<span id="kind-badge" className="badge">
								Spring tide
							</span>
						</div>
						<div id="desc">…</div>
						<div className="meter">
							<div className="meter-fill" id="meter" />
						</div>
						<div className="meter-label">
							<span>neap</span>
							<span id="range-val">range</span>
							<span>spring</span>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
