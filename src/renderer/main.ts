import * as THREE from 'three';
import Stats from 'stats.js';  // assuming you installed stats.js
import { createMain } from './sceneLoader';
import { GameManager } from '../core/gameManager';
import { GameObject } from '../core/objects/gameObject';

const renderer = new THREE.WebGLRenderer({
    antialias: false
});

// set render size
renderer.setSize(640, 360, false);
// renderer.setSize(1900, 1080, false);
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
canvas.addEventListener('click', () => {
  canvas.requestPointerLock();
});
document.body.appendChild(canvas);

const listener = new THREE.AudioListener();
const scene = await createMain(listener);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
const gameManager = new GameManager(scene);

// link camera to player body and head
const body = gameManager.getBody();
const head = gameManager.getHead();
body.add(head);
head.add(camera);
scene.add(body);
// add audio listener to the camera
camera.add(listener);

// Setup Stats.js FPS display
const stats = new Stats();
stats.showPanel(0); // 0: fps
document.body.appendChild(stats.dom);

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    stats.begin();
    const deltaTime = clock.getDelta();

    gameManager.update(deltaTime);  // pass deltaTime
    renderer.render(scene, camera);

    stats.end();
}

animate();
