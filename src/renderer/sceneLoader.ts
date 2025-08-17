import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Platform, Slope } from '../core/objects/platform';
import { Hitbox } from '../core/objects/hitbox';
import { GameObject } from '../core/objects/gameObject';

const loader = new GLTFLoader();
const pathToAssets = '../../assets/';

async function loadGLTFModel(file: string, isEmissive: boolean = false): Promise<THREE.Object3D> {
    return new Promise((resolve, reject) => {
        loader.load(
            file,
            (gltf) => {
                gltf.scene.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        const mesh = child as THREE.Mesh;
                        mesh.geometry.computeVertexNormals();

                        // Material aus dem GLTF übernehmen
                        const mat = mesh.material as THREE.MeshStandardMaterial;
                        mat.flatShading = false;

                        if (isEmissive) {
                            mat.emissive = new THREE.Color(0xffffff); // volle Helligkeit
                            mat.emissiveIntensity = 1.0;
                            if (mat.map) {
                                mat.emissiveMap = mat.map; // gleiche Textur als Emissive-Map
                            }
                        }

                        mat.needsUpdate = true;
                    }
                });
                resolve(gltf.scene);
            },
            undefined,
            reject
        );
    });
}

async function loadModel(file: string, position: THREE.Vector3, scale: number = 1, isEmissive: boolean = false): Promise<THREE.Object3D> {
    const model = await loadGLTFModel(file, isEmissive);
    model.position.copy(position);
    model.scale.set(scale, scale, scale);
    return model;
}

async function repeatAddModel(amount: number, offset: THREE.Vector3, scene: THREE.Scene, file: string, position: THREE.Vector3, scale: number = 1, isEmissive: boolean = false) {
    const promises = [];
    for (let i = 0; i < amount; i++) {
        const pos = position.clone().add(offset.clone().multiplyScalar(i));
        promises.push(scene.add(await loadModel(file, pos, scale, isEmissive))); // Directly adding the model to the scene
    }
    await Promise.all(promises);
}


export async function createMain(listener: THREE.AudioListener): Promise<THREE.Scene> {
    const scene = new THREE.Scene();
    scene.userData = {
        listener: listener
    };

    let playerDist = 0.25;

    // Platforms
    let platforms = [
        new Platform(new THREE.Vector3(-4+playerDist, 0, -4),new THREE.Vector3(4-playerDist, 0, 4)),
        new Platform(new THREE.Vector3(-4, 0, 8),new THREE.Vector3(12, 0, 12)),
        new Slope(new THREE.Vector3(4, 0, 4), new THREE.Vector3(8, 3, 8), false),
        new Platform(new THREE.Vector3(8, 3, 8),new THREE.Vector3(12, 3, -4)),
        new Platform(new THREE.Vector3(-4, 3, -4),new THREE.Vector3(8, 3, 4))
    ];
    for (const p of platforms) {
        p.updateConnections(platforms);
    }
    scene.userData.platforms = platforms;

    // Models
    scene.add(await loadModel(pathToAssets + 'models/level/levels/room_1.gltf', new THREE.Vector3(0, 0, 0)));
    scene.add(await loadModel(pathToAssets + 'models/level/objects/ball.gltf', new THREE.Vector3(0, 2.5, 0), 1, true));

    const barrel = await loadModel(pathToAssets + 'models/level/objects/barrel.gltf', new THREE.Vector3(2, 0, 1));
    scene.add(barrel);

    const ac_unit = new GameObject(new THREE.Vector3(-4,0,0), listener);
    ac_unit.add(await loadModel(pathToAssets + 'models/level/objects/ac_unit.gltf', new THREE.Vector3(0, 0, 0)));
    ac_unit.rotation.y =- Math.PI/2;
    scene.add(ac_unit);
    ac_unit.playSound(pathToAssets + 'sounds/scene/machinery/rattly_noise.mp3', true, 1, 3);

    // Colliders
    let colliders = [];
    const barrelCollider = new Hitbox((new THREE.Vector3(2-0.125-playerDist, 0, 1-0.125-playerDist)),(new THREE.Vector3(2+0.125+playerDist, 1, 1+0.125+playerDist)));
    colliders.push(barrelCollider);
    scene.userData.colliders = colliders;


    //visualizePlatforms(scene);

    // Light
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 8, 50);
    pointLight.position.set(0, 2.5, 0);
    scene.add(pointLight);


    return scene;
}

function visualizePlatforms(scene: THREE.Scene) {
    const platforms: Platform[] = scene.userData.platforms || [];
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });

    platforms.forEach(platform => {
        const verts = platform.getVertices();
        const points = [...verts, verts[0]];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        scene.add(line);
    });
}


