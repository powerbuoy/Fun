'use strict';

/////////
// Vendor
import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/GLTFLoader.js';

//////
// App
class Bg3d {
	//////////////
	// Constructor
	constructor (el, conf) {
		this.el = el;
		this.config = Object.assign({
			scene: 'alcom.glb',
			fov: 45,
			easing: TWEEN.Easing.Quadratic.InOut,
			cameraTransitionDuration: 750,
			dev: false
		}, conf);

		this.init();
		this.load();
		this.floor();
		this.lights();

		if (this.config.dev) {
			document.documentElement.classList.add('dev');
			this.controls();
		}
		else {
			this.initialCameraPos();
			this.scrollCameraPos();
		}
	}

	///////
	// Init
	init () {
		// Create scene, renderer etc
		this.clock = new THREE.Clock();
		this.scene = new THREE.Scene();
		this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
		this.camera = new THREE.PerspectiveCamera(this.config.fov, this.el.clientWidth / this.el.clientHeight, 0.01, 5000);

		this.renderer.setSize(this.el.clientWidth, this.el.clientHeight);
		this.el.appendChild(this.renderer.domElement);

		this.camera.position.set(-0.28510064418506953, 0.7843109750334114, 2.336568471606887);
		this.camera.rotation.set(-0.16518068085575632, 0.24200931610262907, 0.039928961142229755);

		// Shadows
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

		// Resize
		window.addEventListener('resize', e => {
			this.camera.aspect = this.el.clientWidth / this.el.clientHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(this.el.clientWidth, this.el.clientHeight);
		});
	}

	///////////
	// Controls
	controls () {
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		// this.controls.autoRotate = true;
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;
		this.controls.rotateSpeed = 1;
	}

	///////
	// Load
	load () {
		this.loader = new GLTFLoader();

		this.loader.load(this.config.scene, glb => {
			// Cast shadows on all meshes
			glb.scene.traverse(node => {
				if (node.isMesh) {
					node.castShadow = true;
					node.receiveShadow = true;

					// And do this...? Anisotropic Filtering I guess?
					if (node.material.map) {
						node.material.map.anisotropy = 16;
					}
				}
			});

			this.scene.add(glb.scene);
			document.documentElement.classList.remove('loading');
		});
	}

	/////////
	// Lights
	lights () {
		this.ambLight = new THREE.AmbientLight(0xffffff, 1);
		this.scene.add(this.ambLight);

		this.spotLight = new THREE.SpotLight(0xffffff, 2.5);

		this.spotLight.position.set(-10, 10, 10);
		this.spotLight.castShadow = true;
		this.spotLight.shadow.bias = -0.0002;
		this.spotLight.shadow.mapSize.width = 512 * 8;
		this.spotLight.shadow.mapSize.height = 512 * 8;
		this.spotLight.shadow.camera.near = 1;
		this.spotLight.shadow.camera.far = 1000;

		this.scene.add(this.spotLight);
	}

	////////
	// Floor
	floor () {
		// https://threejs.org/docs/#api/en/materials/ShadowMaterial
		const geometry = new THREE.PlaneGeometry(2000, 2000);
		geometry.rotateX(-Math.PI / 2);

		const material = new THREE.ShadowMaterial();
		material.opacity = 0.2;

		this.floor = new THREE.Mesh(geometry, material);
		this.floor.receiveShadow = true;
		this.scene.add(this.floor);
	}

	/////////////////////
	// Initial camera pos
	initialCameraPos () {
		const initialPos = JSON.parse(document.querySelector('[data-camera-pos]').dataset.cameraPos);

		this.camera.position.set(initialPos.x, initialPos.y, initialPos.z);
		this.camera.rotation.set(initialPos.rx, initialPos.ry, initialPos.rz);
	}

	////////////////////
	// Scroll camera pos
	scrollCameraPos () {
		const observer = new IntersectionObserver(entries => entries.forEach(entry => {
			if (entry.isIntersecting) {
				const newPos = JSON.parse(entry.target.dataset.cameraPos);

				new TWEEN.Tween(this.camera.position).to({x: newPos.x, y: newPos.y, z: newPos.z}, this.config.cameraTransitionDuration).easing(this.config.easing).start();
				new TWEEN.Tween(this.camera.rotation).to({x: newPos.rx, y: newPos.ry, z: newPos.rz}, this.config.cameraTransitionDuration).easing(this.config.easing).start();
				new TWEEN.Tween(this.scene.position).to({x: 0, y: 0}, this.config.cameraTransitionDuration).easing(this.config.easing).start();
			}
		}), {threshold: 0.25});

		document.querySelectorAll('[data-camera-pos]').forEach(el => observer.observe(el));
	}

	/////////
	// Update
	animate () {
		const monitor = this.scene.getObjectByName('monitor');
		const mouse = this.scene.getObjectByName('mouse');

		if (this.controls && this.controls.update) {
			this.controls.update();
		}

		if (monitor) {
			monitor.position.y = 0.1 + ((Math.sin(this.clock.getElapsedTime()) / 20) + 0.1);
		}

		if (mouse) {
			mouse.position.z = 0.4 + (Math.sin(this.clock.getElapsedTime() / 2) / 20);
		}

		TWEEN.update();
	}

	/////////
	// Render
	render () {
		this.animate();
		this.renderer.render(this.scene, this.camera);
	}
}

///////////
// Kick off
window.bg3d = new Bg3d(document.getElementById('bg'));

function render () {
	window.bg3d.render();
	requestAnimationFrame(render);
}

render();

////////////
// Splitting
Splitting({
	target: 'h1, h2',
	by: 'chars'
});

////////////
// Scrollspy
const scrollspyObserver = new IntersectionObserver(entries => entries.forEach(entry => {
	if (entry.isIntersecting) {
		entry.target.classList.add('in-view');
	}
	else {
		entry.target.classList.remove('in-view');
	}
}), {threshold: 0.25});

document.querySelectorAll('section').forEach(el => {
	Array.from(el.children).forEach((child, index) => child.style.setProperty('--scrollspy-el-index', index));

	scrollspyObserver.observe(el);
});

////////////
// Set theme
const allThemes = [];
const allThemeButtons = document.querySelectorAll('[data-set-theme]');

allThemeButtons.forEach(el => {
	const theme = el.dataset.setTheme;

	allThemes.push(theme);

	el.addEventListener('click', e => {
		allThemes.forEach(t => document.documentElement.classList.remove('theme-' + t));
		allThemeButtons.forEach(tb => tb.classList.remove('active'));

		document.documentElement.classList.add('theme-' + theme);
		el.classList.add('active');
	});
});

////////////////////
// Highlight visible
document.querySelectorAll('[data-highlight-visible]').forEach(el => {
	const links = el.querySelectorAll('a[href^="#"]');
	const targets = document.querySelectorAll(Array.from(links).map(link => link.getAttribute('href')).join(', '));
	const observer = new IntersectionObserver(entries => entries.forEach(entry => {
		if (entry.isIntersecting) {
			links.forEach(l => l.classList.remove('active'));
			Array.from(links).filter(l => l.getAttribute('href') === '#' + entry.target.id)[0].classList.add('active');
		}
		else {
			Array.from(links).filter(l => l.getAttribute('href') === '#' + entry.target.id)[0].classList.remove('active');
		}
	}), {threshold: 0.25});

	targets.forEach(t => observer.observe(t));
});