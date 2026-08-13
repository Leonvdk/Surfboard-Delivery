import * as THREE from "three";
import { NOISE_GLSL } from "./noise";

/** Starfield points + a faint fbm nebula backdrop. Follows the camera. */
export function createSky() {
	const group = new THREE.Group();

	// Nebula shell (inside-out, below bloom threshold)
	const neb = new THREE.Mesh(
		new THREE.SphereGeometry(60, 32, 32),
		new THREE.ShaderMaterial({
			side: THREE.BackSide,
			depthWrite: false,
			uniforms: {},
			vertexShader: `varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
			fragmentShader: /* glsl */ `
				${NOISE_GLSL}
				varying vec3 vP;
				void main(){
					vec3 d = normalize(vP);
					float n = fbm(d*2.2);
					vec3 col = mix(vec3(0.01,0.015,0.05), vec3(0.06,0.03,0.10), smoothstep(0.0,0.6,n));
					col += vec3(0.02,0.05,0.09) * smoothstep(0.3,0.8,fbm(d*4.0));
					gl_FragColor = vec4(col, 1.0);
				}`,
		}),
	);
	group.add(neb);

	// Stars
	const N = 1400;
	const pos = new Float32Array(N * 3);
	const siz = new Float32Array(N);
	for (let i = 0; i < N; i++) {
		const v = new THREE.Vector3().randomDirection().multiplyScalar(50);
		pos.set([v.x, v.y, v.z], i * 3);
		siz[i] = Math.random() * 1.6 + 0.3;
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
	g.setAttribute("aSize", new THREE.BufferAttribute(siz, 1));
	const uTime = { value: 0 };
	const starMat = new THREE.ShaderMaterial({
		transparent: true,
		depthWrite: false,
		uniforms: { uTime },
		vertexShader: `
			attribute float aSize; varying float vT; uniform float uTime;
			void main(){ vT = aSize;
				vec4 mv = modelViewMatrix*vec4(position,1.0);
				gl_PointSize = aSize * (300.0/-mv.z) * (0.7+0.3*sin(uTime+aSize*10.0));
				gl_Position = projectionMatrix*mv; }`,
		fragmentShader: `
			void main(){ float d = length(gl_PointCoord-0.5);
				if(d>0.5) discard;
				gl_FragColor = vec4(vec3(1.0,0.98,0.9), smoothstep(0.5,0.0,d)); }`,
	});
	const stars = new THREE.Points(g, starMat);
	group.add(stars);

	return {
		group,
		update(t: number, cam: THREE.Camera) {
			group.position.copy(cam.position);
			uTime.value = t;
		},
	};
}
