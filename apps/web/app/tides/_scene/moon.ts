import * as THREE from "three";
import { NOISE_GLSL } from "./noise";

/** Cratered Moon, lit by uSunDir. Its position is set on the orbit each frame. */
export function createMoon(radius = 0.27) {
	const uSunDir = { value: new THREE.Vector3(1, 0, 0) };
	const mat = new THREE.ShaderMaterial({
		uniforms: { uSunDir },
		vertexShader: /* glsl */ `
			varying vec3 vN; varying vec3 vPos;
			void main(){ vPos = position; vN = normalize(mat3(modelMatrix)*normal); // WORLD normal
				gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,

		fragmentShader: /* glsl */ `
			${NOISE_GLSL}
			varying vec3 vN; varying vec3 vPos; uniform vec3 uSunDir;
			void main(){
				vec3 p = normalize(vPos);
				float craters = 0.0;
				for(int i=0;i<3;i++){ float s = 6.0*pow(2.0,float(i));
					craters += (1.0/pow(2.0,float(i))) * abs(snoise(p*s)); }
				float maria = smoothstep(0.35,0.55, fbm(p*2.2));
				vec3 base = mix(vec3(0.62,0.60,0.57), vec3(0.32,0.31,0.30), maria);
				base *= 0.85 + 0.3*craters;
				float ndl = max(dot(normalize(vN), normalize(uSunDir)), 0.0);
				gl_FragColor = vec4(base * (0.06 + 1.1*ndl), 1.0);
			}`,
	});
	const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 48), mat);
	return {
		mesh,
		setSunDir(v: THREE.Vector3) {
			uSunDir.value.copy(v).normalize();
		},
	};
}
