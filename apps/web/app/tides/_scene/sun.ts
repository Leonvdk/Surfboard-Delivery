import * as THREE from "three";
import { NOISE_GLSL } from "./noise";

/**
 * Eclipse-grade Sun: a camera-facing billboard compositing a granulated,
 * limb-darkened photosphere disc, a pearly streamered corona (angular fbm ×
 * radial falloff), and red chromosphere prominences at the limb. Emissive
 * above 1.0 so UnrealBloom makes it blaze. Comes with an invisible pick
 * sphere for dragging.
 */
export function createSun(discRadius = 0.9) {
	const group = new THREE.Group();
	const size = discRadius * 6.5; // plane leaves room for the corona

	const uTime = { value: 0 };
	const mat = new THREE.ShaderMaterial({
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
		uniforms: { uTime },
		vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
		fragmentShader: /* glsl */ `
			${NOISE_GLSL}
			varying vec2 vUv; uniform float uTime;
			void main(){
				vec2 p = vUv*2.0 - 1.0;
				float r = length(p);
				float ang = atan(p.y, p.x);
				float discR = 0.30;

				// photosphere disc: granulation + limb darkening
				float core = smoothstep(discR+0.015, discR-0.015, r);
				float gran = 0.75 + 0.4*fbm(vec3(p*7.0, uTime*0.06));
				float mu = sqrt(max(0.0, 1.0 - clamp(r/discR,0.0,1.0)*clamp(r/discR,0.0,1.0)));
				vec3 photo = mix(vec3(2.2,1.1,0.35), vec3(3.4,2.6,1.4), mu) * gran;

				// corona streamers
				float streak = fbm(vec3(cos(ang)*3.2, sin(ang)*3.2, uTime*0.04));
				streak = pow(0.5+0.5*streak, 2.2);
				float radial = smoothstep(1.0, discR, r);
				float corona = radial * (0.30 + 1.0*streak) * smoothstep(discR-0.04, discR+0.10, r);
				vec3 coronaCol = vec3(1.15,0.9,0.65) * corona;

				// prominences: red arcs hugging the limb
				float prom = smoothstep(0.82, 1.0, fbm(vec3(ang*5.0, uTime*0.25, 3.0)));
				prom *= smoothstep(discR+0.10, discR, r) * smoothstep(discR-0.03, discR+0.02, r);

				vec3 col = photo*core + coronaCol + vec3(1.6,0.25,0.12)*prom;
				float alpha = max(core, corona*0.95 + prom);
				if(alpha < 0.008) discard;
				gl_FragColor = vec4(col, alpha);
			}`,
	});
	const billboard = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
	group.add(billboard);

	// invisible pick target
	const pick = new THREE.Mesh(
		new THREE.SphereGeometry(discRadius * 1.4, 16, 16),
		new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
	);
	pick.name = "sun";
	group.add(pick);

	return {
		group,
		pick,
		update(t: number, camera: THREE.Camera) {
			uTime.value = t;
			billboard.quaternion.copy(camera.quaternion); // face the camera
		},
	};
}
