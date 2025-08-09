import * as THREE from 'three';
import {createMain} from './sceneLoader';
import { GameManager } from '../core/gameManager';


const renderer = new THREE.WebGLRenderer({
    antialias: false
});

//set render size
renderer.setSize(640, 360, false);
//renderer.setSize(1900, 1080, false);
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
canvas.addEventListener('click', () => {
  canvas.requestPointerLock();
});
document.body.appendChild(canvas);

const scene = await createMain();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.01, 1000);
const gameManager = new GameManager();

// link camera to player body and head
const body = gameManager.getBody();
const head = gameManager.getHead();
body.add(head);
head.add(camera);
scene.add(body);


function animate() {
    requestAnimationFrame(animate);

    gameManager.update();

    renderer.render(scene, camera);
}
animate();
