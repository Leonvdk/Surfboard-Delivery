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
	const uTime = { value: 0 };
	const uSpin = { value: 0 };

	// real Earth land/ocean map (equirectangular). Longitude wraps; poles clamp.
	const landTex = new THREE.TextureLoader().load("/tides/earth-mask.png");
	landTex.wrapS = THREE.RepeatWrapping;
	landTex.wrapT = THREE.ClampToEdgeWrapping;
	landTex.colorSpace = THREE.NoColorSpace;
	landTex.anisotropy = 8; // sharper, less aliased coastlines at grazing angles
	const uLandTex = { value: landTex };

	const ROT = /* glsl */ `mat3 rotY(float a){ float c=cos(a),s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }`;
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
		uniforms: { uSunDir, uTime, uSpin, uLandTex },
		vertexShader: /* glsl */ `
			${NOISE_GLSL} ${ROT} ${MASK}
			varying vec3 vN; varying vec3 vRot;
			uniform float uSpin;
			void main(){
				vec3 nr = rotY(uSpin) * normalize(position);
				vRot = nr;
				// The solid Earth stays ROUND — the tide doesn't deform rock. A little
				// land relief so coasts read, but no tidal displacement here.
				float lh = 0.05 * smoothstep(0.15, 0.7, landAt(nr));
				vec3 disp = position * (1.0 + lh);
				// Light by the WORLD normal so the day/night terminator is fixed to
				// the Sun; the continents (vRot) spin through it.
				vN = normalize(normal);
				gl_Position = projectionMatrix * modelViewMatrix * vec4(disp,1.0);
			}`,
		fragmentShader: /* glsl */ `
			${NOISE_GLSL} ${MASK}
			varying vec3 vN; varying vec3 vRot;
			uniform vec3 uSunDir;
			void main(){
				vec3 p = normalize(vRot);
				float landv = landAt(p);
				float isLand = smoothstep(0.44, 0.56, landv);   // shared coastline with the water mask
				float ndl = dot(normalize(vN), normalize(uSunDir));
				float day = smoothstep(-0.15, 0.35, ndl);

				// The ocean floor IS the resting sea surface — the SAME water colour as
				// the tidal shell, sitting on the land sphere so it meets land with no
				// seam. Wherever the shell dips or fades (troughs, coasts), this shows
				// through and still reads as water, never a dark gap or "depth".
				vec3 oceanCol = mix(vec3(0.09,0.32,0.46), vec3(0.15,0.42,0.56), 0.5+0.5*fbm(p*3.0));
				oceanCol *= 0.30 + 0.70*day;   // same day/night curve as the water shell

				// Land: green, with a full day/night cycle and warm city lights at night.
				vec3 green = mix(vec3(0.13,0.24,0.10), vec3(0.40,0.34,0.18), 0.5+0.5*fbm(p*4.0));
				vec3 landCol = mix(green*0.06 + vec3(0.02,0.03,0.06), green*(0.32 + 0.62*day), day);
				float cityN = 0.5 + 0.5*fbm(p*30.0);
				float cities = smoothstep(0.66, 0.80, cityN) * (1.0 - day);
				landCol += vec3(1.0, 0.82, 0.48) * cities * 1.8;

				vec3 col = mix(oceanCol, landCol, isLand);
				// polar caps: soft, muted snow/ice at both poles (matches the water shell)
				float polar = smoothstep(0.88, 0.99, abs(p.y));
				col = mix(col, vec3(0.70,0.77,0.84), polar*0.85);
				gl_FragColor = vec4(col, 1.0);
			}`,
	});
	group.add(new THREE.Mesh(new THREE.SphereGeometry(radius, 200, 200), landMat));

	// ---- Water shell (ocean-masked, tidal, cohesive) ----
	const waterMat = new THREE.ShaderMaterial({
		transparent: true,
		uniforms: { uSunDir, uMoonDir, uMoonW, uSunW, uAmp, uTime, uSpin, uLandTex },
		vertexShader: /* glsl */ `
			${NOISE_GLSL} ${ROT} ${MASK}
			varying vec3 vN; varying vec3 vWorld; varying float vBulge; varying float vOcean; varying float vLat;
			uniform vec3 uMoonDir, uSunDir; uniform float uMoonW, uSunW, uAmp, uTime, uSpin;
			float tide(vec3 n, vec3 axis){ float c = dot(n, normalize(axis)); return (3.0*c*c - 1.0)*0.5; }
			void main(){
				vec3 n = normalize(position);              // world frame (mesh unrotated)
				vec3 nRot = rotY(uSpin) * n;               // Earth's spinning frame
				vLat = n.y;                                // latitude (spin axis is Y)
				vOcean = oceanMask(nRot);
				float h = uMoonW*tide(n,uMoonDir) + uSunW*tide(n,uSunDir);
				vBulge = h;
				float ripple = 0.006*snoise(nRot*8.0 + uTime*0.3) + 0.003*snoise(nRot*16.0 - uTime*0.45);
				float sea = uAmp*h + 0.006 + ripple;   // open-ocean bulge height
				// Wide, BLURRED coast proximity so the bulge dome physically curves DOWN
				// to the globe as it nears land — a rounded, watery droplet edge instead
				// of a raised film that just fades out. The land itself is untouched; the
				// fragment's ocean mask keeps the water off it.
				float U = 0.5 - atan(nRot.z, nRot.x) / 6.28318530718;
				float Vv = 0.5 + asin(clamp(nRot.y, -1.0, 1.0)) / 3.14159265359;
				float w = 0.07;
				float prox = (1.0 - texture2D(uLandTex, vec2(U, Vv)).r)
					+ (1.0 - texture2D(uLandTex, vec2(U + w, Vv)).r)
					+ (1.0 - texture2D(uLandTex, vec2(U - w, Vv)).r)
					+ (1.0 - texture2D(uLandTex, vec2(U, Vv + w)).r)
					+ (1.0 - texture2D(uLandTex, vec2(U, Vv - w)).r)
					+ (1.0 - texture2D(uLandTex, vec2(U + w*0.7, Vv + w*0.7)).r)
					+ (1.0 - texture2D(uLandTex, vec2(U - w*0.7, Vv - w*0.7)).r);
				prox /= 7.0;
				float coastBlend = smoothstep(0.10, 0.85, prox);
				float rise = mix(sea, 0.004, coastBlend);   // settle just above the surface at the shore
				vec3 disp = position * (1.0 + rise);
				vec3 nrm = normalize(mix(normalize(position), normalize(disp), 0.6));
				vN = normalize(normalMatrix * nrm);
				vec4 wp = modelMatrix * vec4(disp,1.0);
				vWorld = wp.xyz;
				gl_Position = projectionMatrix * viewMatrix * wp;
			}`,
		fragmentShader: /* glsl */ `
			${NOISE_GLSL}
			varying vec3 vN; varying vec3 vWorld; varying float vBulge; varying float vOcean; varying float vLat;
			uniform vec3 uSunDir; uniform float uTime;
			void main(){
				vec3 V = normalize(cameraPosition - vWorld);
				vec3 L = normalize(uSunDir);

				// churning surface: layered flowing noise perturbs the normal
				vec3 fp = vWorld*4.5;
				vec3 nprt = vec3(
					snoise(fp + vec3(uTime*0.26, 0.0, 0.0)),
					snoise(fp*1.3 + vec3(0.0, uTime*0.21, 0.0)),
					snoise(fp*0.8 + vec3(0.0, 0.0, uTime*0.24)));
				vec3 N = normalize(vN + 0.12*nprt);
				float ndl = max(dot(N,L), 0.0);
				float fres = pow(1.0 - max(dot(N,V),0.0), 3.0);

				// depth field: 0 over land (thin connecting skim), 1 in open ocean
				float ocean = smoothstep(0.02, 0.34, vOcean);

				// One bright, near-uniform ocean blue so the sea reads as a single
				// connected body from EVERY angle — not dependent on grazing/fresnel
				// for brightness (that made head-on water look like a dark gap).
				float turb = 0.5 + 0.5*fbm(vWorld*3.2 + vec3(uTime*0.12));
				vec3 water = mix(vec3(0.09,0.32,0.46), vec3(0.15,0.42,0.56), turb);
				water *= 1.0 - 0.14*ocean;                    // open sea only slightly deeper
				water = mix(water, vec3(0.18,0.46,0.58), fres*0.22); // subtle sheen, not a brightener

				// whitecaps: high-freq noise, piled at the bulge crest and along coasts
				float foamN = fbm(vWorld*8.0 + vec3(uTime*0.32));
				float crest = smoothstep(0.40, 0.85, vBulge) * ocean;   // toward the pull
				float shore = smoothstep(0.05, 0.45, vOcean) * (1.0 - smoothstep(0.45, 0.85, vOcean));
				float foam = smoothstep(0.58, 0.98, foamN*0.5 + crest*0.42 + shore*0.35);
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

				// The tidal bulge is a TRANSLUCENT water envelope, shown ONLY where the
				// sea piles up (vBulge > 0) AND only over OCEAN (× ocean) — so the two
				// bulges read as glassy domes over the sea, the Earth stays round, and
				// the land shows through clean, never under the bulge.
				float alpha = smoothstep(0.05, 0.5, vBulge) * (0.42 + 0.45*fres) * ocean;
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
		update(t: number, spin = 0) {
			uTime.value = t;
			uSpin.value = spin;
		},
	};
}
