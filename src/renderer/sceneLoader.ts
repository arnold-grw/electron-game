import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

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


async function addModelToScene(scene: THREE.Scene, file: string, position: THREE.Vector3, scale: number = 1, isEmissive: boolean = false) {
    const model = await loadGLTFModel(file, isEmissive);
    model.position.copy(position);
    model.scale.set(scale, scale, scale);
    scene.add(model);
}

async function repeatAddModel(amount: number, offset: THREE.Vector3, scene: THREE.Scene, file: string, position: THREE.Vector3, scale: number = 1, isEmissive: boolean = false) {
    const promises = [];
    for (let i = 0; i < amount; i++) {
        const pos = position.clone().add(offset.clone().multiplyScalar(i));
        promises.push(addModelToScene(scene, file, pos, scale, isEmissive));
    }
    await Promise.all(promises);
}


export async function createMain(): Promise<THREE.Scene> {
    const scene = new THREE.Scene();

    // Light
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 4, 50);
    pointLight.position.set(0, 2.5, 0);
    scene.add(pointLight);

    // load Models
    await Promise.all([
        addModelToScene(scene, pathToAssets + 'models/level/floor/floor_1.gltf', new THREE.Vector3(0, 0, 0)),
        addModelToScene(scene, pathToAssets + 'models/level/floor/floor_1.gltf', new THREE.Vector3(0, 3, 0)),
        repeatAddModel(4, new THREE.Vector3(2, 0, 0), scene, pathToAssets + 'models/level/walls/wall_1.gltf', new THREE.Vector3(-3, 0, -4)),
        repeatAddModel(4, new THREE.Vector3(2, 0, 0), scene, pathToAssets + 'models/level/walls/wall_1.gltf', new THREE.Vector3(-3, 0, 4)),
        addModelToScene(scene, pathToAssets + 'models/level/objects/barrel.gltf', new THREE.Vector3(-1, 0, -1)),
        addModelToScene(scene, pathToAssets + 'models/level/objects/barrel.gltf', new THREE.Vector3(2, 0, 0.75)),
        addModelToScene(scene, pathToAssets + 'models/level/objects/ball.gltf', new THREE.Vector3(0, 2.5, 0), 1, true), // Emissive ball
    ]);

    return scene;
}
