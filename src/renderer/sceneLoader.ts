import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Platform } from '../core/objects/platform';
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

    // Light
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 10, 75);
    pointLight.position.set(0, 2.5, 0);
    scene.add(pointLight);

    // Platform
    let platforms = [];

    const platform1 = new Platform(new THREE.Vector3(-4, 0, -4),new THREE.Vector3(-4, 0, 4),new THREE.Vector3(4, 0, -4));
    const platform2 = new Platform(new THREE.Vector3(4, 0, -4),new THREE.Vector3(4, 0, 4),new THREE.Vector3(8, 0, -4));
    scene.add(await loadModel(pathToAssets + 'models/level/floor/floor_1.gltf', platform1.getCenter()));
    const platform3 = new Platform(new THREE.Vector3(-4, 0, 4),new THREE.Vector3(4, 0, 4),new THREE.Vector3(-4, 2, 6));
    const platform4 = new Platform(new THREE.Vector3(-4, 2, 6),new THREE.Vector3(4, 2, 6),new THREE.Vector3(-4, 2, 10));
    const platform5 = new Platform(new THREE.Vector3(4, 2, 6),new THREE.Vector3(8, 2, 6),new THREE.Vector3(4, 2, 10));
    const platform6 = new Platform(new THREE.Vector3(4, 2, 6),new THREE.Vector3(8, 2, 6),new THREE.Vector3(4, 2, -4));
    platforms.push(platform6, platform5, platform4, platform3, platform2, platform1);

    scene.userData.platforms = platforms;

    visualizePlatforms(scene);

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


