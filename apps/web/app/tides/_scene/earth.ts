import * as THREE from "three";
import { NOISE_GLSL } from "./noise";

/**
 * The tidal Earth. A procedural land/ocean sphere, plus a WATER shell that:
 *  - exists ONLY over ocean (land is hydrophobic — water recedes from it),
 *  - is raised by the tidal potential of Moon + Sun (two cos²θ bulges),
 *  - has cohesion: a soft, rounded meniscus at coasts and a glossy, rippling
 *    surface, so it reads as sticky liquid, not a rigid shell.
 * The ocean mask is sampled in the Earth's ROTATING frame (uSpin) while the
 * bulge axes are world-fixed — so the planet turns under the bulges.
 * Everything is lit by uSunDir (no scene lights) and stays below bloom.
 */
export function createEarth(radius = 1) {
	const group = new THREE.Group();

	const uSunDir = { value: new THREE.Vector3(1, 0, 0) };
	const uMoonDir = { value: new THREE.Vector3(-1, 0, 0) };
	const uMoonW = { value: 1.0 };
	const uSunW = { value: 0.46 };
	const uAmp = { value: 0.18 };
	const uSpin = { value: 0 };

	// real Earth land/ocean map (equirectangular). Longitude wraps; poles clamp.
	const loader = new THREE.TextureLoader();
	const equirect = (url: string) => {
		const t = loader.load(url);
		t.wrapS = THREE.RepeatWrapping;
		t.wrapT = THREE.ClampToEdgeWrapping;
		t.colorSpace = THREE.NoColorSpace;
		t.anisotropy = 8; // sharper, less aliased coastlines at grazing angles
		return t;
	};
	const uLandTex = { value: equirect("/tides/earth-mask.png") };
	// Surface relief of the Earth.stl globe, projected into the same
	// equirectangular frame as the mask by tools/make-earth-relief.py.
	// Its coastlines and sea floor are the real thing; on land it tracks the
	// brightness of the source imagery rather than true height (see that script),
	// so it is used as surface texture, not as a claim about how high anything is.
	const uReliefTex = { value: equirect("/tides/earth-relief.png") };
	// How open a sea each point stands in: 0 on land and along every shore, 1 out
	// in a basin. Baked by tools/make-ocean-openness.py, which holds it at zero
	// across a margin wide enough that the shell can never interpolate up through
	// the coast. This is what the tidal bulge is multiplied by.
	const uOpenTex = { value: equirect("/tides/earth-openness.png") };

	// How the relief map is packed and how much of it we build into the globe.
	const RELIEF_SPAN = 0.08; // encoded full scale, in globe radii (sea level = 0.5)
	const RELIEF = 0.6; // enough to shape the land without inventing mountains
	const COAST_LIFT = 0.016; // every coast still steps clear of the resting sea
	const SEA_REST = 0.004; // resting sea, below COAST_LIFT so land always stands proud

	const ROT = /* glsl */ `mat3 rotY(float a){ float c=cos(a),s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }`;
	// Relief in globe radii: 0 at sea level, positive on land, negative on the sea
	// floor. The globe exaggerates its relief roughly twelvefold, which is what
	// makes anything read at this size.
	const RELIEF_GLSL = /* glsl */ `
		uniform sampler2D uReliefTex;
		float reliefAt(vec3 nRot){
			vec3 n = normalize(nRot);
			float u = 0.5 - atan(n.z, n.x) / 6.28318530718;
			float v = 0.5 + asin(clamp(n.y, -1.0, 1.0)) / 3.14159265359;
			return (texture2D(uReliefTex, vec2(u, v)).r - 0.5) * ${RELIEF_SPAN.toFixed(3)};
		}
		float landRelief(vec3 nRot){ return max(reliefAt(nRot), 0.0); }`;
	const OPEN_GLSL = /* glsl */ `
		uniform sampler2D uOpenTex;
		float openAt(vec3 nRot){
			vec3 n = normalize(nRot);
			float u = 0.5 - atan(n.z, n.x) / 6.28318530718;
			float v = 0.5 + asin(clamp(n.y, -1.0, 1.0)) / 3.14159265359;
			return texture2D(uOpenTex, vec2(u, v)).r;
		}`;
	// Shared land/ocean mask, sampled from a real equirectangular Earth map so the
	// continents take their true shapes. In the source map the sea is bright and
	// the land dark. nRot = spun surface direction.
	const MASK = /* glsl */ `
		uniform sampler2D uLandTex;
		float landAt(vec3 nRot){
			vec3 n = normalize(nRot);
			float u = 0.5 - atan(n.z, n.x) / 6.28318530718;   // flipped: un-mirror the map
			float v = 0.5 + asin(clamp(n.y, -1.0, 1.0)) / 3.14159265359;
			float here = 1.0 - texture2D(uLandTex, vec2(u, v)).r;   // land = 1, ocean = 0
			// Fill inland lakes: if the ring around this point is mostly land, it is
			// enclosed water, so treat it as land. Open ocean has watery neighbours
			// and is left untouched.
			float e = 0.0075;
			float a = 0.0;
			a += 1.0 - texture2D(uLandTex, vec2(u + e, v)).r;
			a += 1.0 - texture2D(uLandTex, vec2(u - e, v)).r;
			a += 1.0 - texture2D(uLandTex, vec2(u, v + e)).r;
			a += 1.0 - texture2D(uLandTex, vec2(u, v - e)).r;
			a += 1.0 - texture2D(uLandTex, vec2(u + e, v + e)).r;
			a += 1.0 - texture2D(uLandTex, vec2(u - e, v - e)).r;
			a += 1.0 - texture2D(uLandTex, vec2(u + e, v - e)).r;
			a += 1.0 - texture2D(uLandTex, vec2(u - e, v + e)).r;
			a *= 0.125;
			return max(here, smoothstep(0.70, 0.92, a));
		}
		float oceanMask(vec3 nRot){ return 1.0 - landAt(nRot); }`;

	// ---- Land / ocean sphere ----
	const landMat = new THREE.ShaderMaterial({
		uniforms: { uSunDir, uSpin, uLandTex, uReliefTex },
		vertexShader: /* glsl */ `
			${NOISE_GLSL} ${ROT} ${MASK} ${RELIEF_GLSL}
			varying vec3 vRot;
			uniform float uSpin;
			void main(){
				vec3 nr = rotY(uSpin) * normalize(position);
				vRot = nr;
				// The solid Earth stays ROUND — the tide doesn't deform rock. What it
				// does carry is the relief globe's own land surface, standing on a small
				// lift that keeps every coast a step above the resting sea. The sea floor
				// stays flat at the sphere, because that surface doubles as the resting
				// sea (see the fragment).
				float lh = smoothstep(0.15, 0.7, landAt(nr))
					* (${COAST_LIFT.toFixed(3)} + ${RELIEF.toFixed(2)} * landRelief(nr));
				vec3 disp = position * (1.0 + lh);
				gl_Position = projectionMatrix * modelViewMatrix * vec4(disp,1.0);
			}`,
		fragmentShader: /* glsl */ `
			${NOISE_GLSL} ${ROT} ${MASK} ${RELIEF_GLSL}
			varying vec3 vRot;
			uniform vec3 uSunDir; uniform float uSpin;

			// Normal of the displaced land, from the slope of the relief map. Without
			// this the relief would only show on the limb; with it the land catches the
			// light and throws the shading that makes it read as ground, not paint.
			vec3 terrainNormal(vec3 p, float h){
				vec3 a = abs(p.y) < 0.999 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0);
				vec3 t1 = normalize(cross(a, p));      // east
				vec3 t2 = cross(p, t1);                // north
				float e = 0.012;                       // ~2 texels of the relief map
				float h1 = landRelief(normalize(p + t1*e));
				float h2 = landRelief(normalize(p + t2*e));
				return normalize(p - (t1*(h1-h) + t2*(h2-h)) * (${RELIEF.toFixed(2)} / e));
			}

			void main(){
				vec3 p = normalize(vRot);
				float landv = landAt(p);
				float isLand = smoothstep(0.44, 0.56, landv);   // shared coastline with the water mask
				float relief = reliefAt(p);
				// Light by the WORLD normal so the day/night terminator is fixed to the
				// Sun; the continents (vRot) spin through it, relief and all.
				vec3 N = rotY(-uSpin) * terrainNormal(p, max(relief, 0.0));
				float ndl = dot(N, normalize(uSunDir));
				float day = smoothstep(-0.15, 0.35, ndl);

				// The ocean floor IS the resting sea surface — the SAME water colour as
				// the tidal shell, sitting on the land sphere so it meets land with no
				// seam. Wherever the shell dips or fades (troughs, coasts), this shows
				// through and still reads as water, never a dark gap or "depth". Its
				// shade follows the real sea floor, so the ridges and trenches show
				// faintly through without ever reading as a hole.
				float depth = smoothstep(0.0, 0.028, -relief);
				vec3 oceanCol = mix(vec3(0.15,0.42,0.56), vec3(0.09,0.32,0.46), depth);
				oceanCol *= 0.30 + 0.70*day;   // same day/night curve as the water shell

				// Land: green where the source imagery is dark and vegetated, dry and
				// bare where it is bright — which is what the relief actually encodes,
				// so it lands the deserts and the forests in the right places. Full
				// day/night cycle, with warm city lights at night.
				vec3 green = mix(vec3(0.13,0.24,0.10), vec3(0.40,0.34,0.18), 0.5+0.5*fbm(p*4.0));
				vec3 terrain = mix(green, vec3(0.44,0.37,0.27), smoothstep(0.011, 0.023, relief));
				vec3 landCol = mix(terrain*0.06 + vec3(0.02,0.03,0.06), terrain*(0.32 + 0.62*day), day);
				float cityN = 0.5 + 0.5*fbm(p*30.0);
				// the dry, empty ground is dark at night — keep the lights off it
				float cities = smoothstep(0.66, 0.80, cityN) * (1.0 - day) * (1.0 - smoothstep(0.010, 0.022, relief));
				landCol += vec3(1.0, 0.82, 0.48) * cities * 1.8;

				vec3 col = mix(oceanCol, landCol, isLand);
				// polar caps: soft, muted snow/ice at both poles (matches the water shell)
				float polar = smoothstep(0.88, 0.99, abs(p.y));
				col = mix(col, vec3(0.70,0.77,0.84), polar*0.85);
				gl_FragColor = vec4(col, 1.0);
			}`,
	});
	// enough segments for the land relief to carry a silhouette, not just shading
	group.add(new THREE.Mesh(new THREE.SphereGeometry(radius, 384, 192), landMat));

	// ---- Water shell (ocean-only, tidal, cohesive) ----
	const waterMat = new THREE.ShaderMaterial({
		transparent: true,
		uniforms: { uSunDir, uMoonDir, uMoonW, uSunW, uAmp, uSpin, uOpenTex },
		vertexShader: /* glsl */ `
			${ROT} ${OPEN_GLSL}
			varying vec3 vN; varying vec3 vWorld; varying float vBulge; varying float vOpen; varying float vLat;
			uniform vec3 uMoonDir, uSunDir; uniform float uMoonW, uSunW, uAmp, uSpin;
			float tide(vec3 n, vec3 axis){ float c = dot(n, normalize(axis)); return (3.0*c*c - 1.0)*0.5; }

			// The sea surface, as a height above the globe for any direction. The bulge
			// is the tidal potential; multiplying it by the openness field is what makes
			// the dome curve down to the resting sea before it ever reaches a coast, so
			// it settles beside the land instead of climbing over it.
			float riseAt(vec3 nWorld){
				float h = uMoonW*tide(nWorld,uMoonDir) + uSunW*tide(nWorld,uSunDir);
				return ${SEA_REST.toFixed(3)} + uAmp * h * openAt(rotY(uSpin) * nWorld);
			}

			void main(){
				vec3 n = normalize(position);              // world frame (mesh unrotated)
				vLat = n.y;                                // latitude (spin axis is Y)
				vOpen = openAt(rotY(uSpin) * n);
				vBulge = uMoonW*tide(n,uMoonDir) + uSunW*tide(n,uSunDir);

				float rise = ${SEA_REST.toFixed(3)} + uAmp * vBulge * vOpen;   // riseAt(n), already sampled
				vec3 disp = position * (1.0 + rise);

				// True normal of that surface, from its own slope — so the flank of the
				// dome shades as a rounded body of water running downhill to the shore,
				// instead of a sphere with a picture of a bulge on it.
				vec3 a = abs(n.y) < 0.999 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0);
				vec3 t1 = normalize(cross(a, n));
				vec3 t2 = cross(n, t1);
				float e = 0.02;
				float r1 = riseAt(normalize(n + t1*e));
				float r2 = riseAt(normalize(n + t2*e));
				vec3 nrm = normalize(n - (t1*(r1-rise) + t2*(r2-rise)) / e);

				vN = normalize(normalMatrix * nrm);
				vec4 wp = modelMatrix * vec4(disp,1.0);
				vWorld = wp.xyz;
				gl_Position = projectionMatrix * viewMatrix * wp;
			}`,
		fragmentShader: /* glsl */ `
			${NOISE_GLSL}
			varying vec3 vN; varying vec3 vWorld; varying float vBulge; varying float vOpen; varying float vLat;
			uniform vec3 uSunDir;
			void main(){
				vec3 V = normalize(cameraPosition - vWorld);
				vec3 L = normalize(uSunDir);

				// A still surface. The sea has texture but no motion: an animated one
				// bobbed the shell up and down across the coastline every frame, which
				// spiked the water wherever the shore is not flush with it.
				vec3 nprt = vec3(
					snoise(vWorld*4.5),
					snoise(vWorld*5.85),
					snoise(vWorld*3.6));
				vec3 N = normalize(vN + 0.06*nprt);
				float ndl = max(dot(N,L), 0.0);
				float fres = pow(1.0 - max(dot(N,V),0.0), 3.0);

				// One bright, near-uniform ocean blue so the sea reads as a single
				// connected body from EVERY angle — not dependent on grazing/fresnel
				// for brightness (that made head-on water look like a dark gap).
				float turb = 0.5 + 0.5*fbm(vWorld*3.2);
				vec3 water = mix(vec3(0.09,0.32,0.46), vec3(0.15,0.42,0.56), turb);
				water *= 1.0 - 0.14*vOpen;                    // open sea only slightly deeper
				water = mix(water, vec3(0.18,0.46,0.58), fres*0.22); // subtle sheen, not a brightener

				// a little white left along the crest of the dome, where the sea piles up
				float crest = smoothstep(0.45, 0.90, vBulge) * vOpen;
				float foam = smoothstep(0.62, 0.98, fbm(vWorld*8.0)*0.5 + crest*0.40);
				vec3 col = mix(water, vec3(0.90,0.95,0.98), foam);

				col *= 0.30 + 0.70*ndl;   // real day/night: the sea darkens on the night side,
				                          // brightest under the Sun, dim on the far hemisphere
				vec3 H = normalize(L+V);
				col += vec3(0.9,0.85,0.72) * pow(max(dot(N,H),0.0), 80.0) * ndl * 0.22; // tight, soft glint
				col += fres * vec3(0.18,0.34,0.44) * 0.30;              // grazing sheen

				// polar sea ice — soft, muted caps (kept below the bloom threshold)
				float polar = smoothstep(0.88, 0.99, abs(vLat));
				col = mix(col, vec3(0.66,0.73,0.80), polar*0.8);

				// Brighten the crest so the piled-up water reads as a raised dome.
				col += vec3(0.10, 0.16, 0.20) * smoothstep(0.15, 0.95, vBulge);

				// The tidal bulge is a TRANSLUCENT water envelope, shown only where the
				// sea piles up (vBulge > 0) and only over open sea — the same openness
				// that drives its descent, so the dome thins out as it runs down to the
				// shore and is simply not there over land.
				float alpha = smoothstep(0.05, 0.5, vBulge) * (0.42 + 0.45*fres) * vOpen;
				gl_FragColor = vec4(col, alpha);
			}`,
	});
	group.add(new THREE.Mesh(new THREE.SphereGeometry(radius, 288, 288), waterMat));

	return {
		group,
		setSunDir(v: THREE.Vector3) {
			uSunDir.value.copy(v).normalize();
		},
		setMoonDir(v: THREE.Vector3) {
			uMoonDir.value.copy(v).normalize();
		},
		setAmp(a: number) {
			uAmp.value = a;
		},
		setWeights(moon: number, sun: number) {
			uMoonW.value = moon;
			uSunW.value = sun;
		},
		// nothing in the Earth animates on its own any more — only the spin, which
		// the lesson drives. The time argument is kept so callers need not change.
		update(_t: number, spin = 0) {
			uSpin.value = spin;
		},
	};
}
