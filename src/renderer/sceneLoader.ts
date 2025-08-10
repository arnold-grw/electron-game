import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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


async function addModelToScene(scene: THREE.Scene, file: string, position: THREE.Vector3, scale: number = 1, isEmissive: boolean = false) {
    const model = await loadGLTFModel(file, isEmissive);
    model.position.copy(position);
    model.scale.set(scale, scale, scale);
    scene.add(model);
}

async function addModelToGameObject(gameObject: GameObject, file: string, position: THREE.Vector3, scale: number = 1, isEmissive: boolean = false) {
    const model = await loadGLTFModel(file, isEmissive);
    model.position.copy(position);
    model.scale.set(scale, scale, scale);
    gameObject.add(model);
}

async function repeatAddModel(amount: number, offset: THREE.Vector3, scene: THREE.Scene, file: string, position: THREE.Vector3, scale: number = 1, isEmissive: boolean = false) {
    const promises = [];
    for (let i = 0; i < amount; i++) {
        const pos = position.clone().add(offset.clone().multiplyScalar(i));
        promises.push(addModelToScene(scene, file, pos, scale, isEmissive));
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

    // load static Models
    await Promise.all([
        addModelToScene(scene, pathToAssets + 'models/level/floor/floor_1.gltf', new THREE.Vector3(0, 0, 0)),
        addModelToScene(scene, pathToAssets + 'models/level/floor/floor_1.gltf', new THREE.Vector3(0, 3, 0)),
        repeatAddModel(4, new THREE.Vector3(2, 0, 0), scene, pathToAssets + 'models/level/walls/wall_1.gltf', new THREE.Vector3(-3, 0, -4)),
        repeatAddModel(4, new THREE.Vector3(2, 0, 0), scene, pathToAssets + 'models/level/walls/wall_1.gltf', new THREE.Vector3(-3, 0, 4)),
        //objects
        addModelToScene(scene, pathToAssets + 'models/level/objects/barrel.gltf', new THREE.Vector3(-1, 0, -1)),
        addModelToScene(scene, pathToAssets + 'models/level/objects/barrel.gltf', new THREE.Vector3(2, 0, 0.75)),
        addModelToScene(scene, pathToAssets + 'models/level/objects/ball.gltf', new THREE.Vector3(0, 2.5, 0), 1, true), // Emissive ball
    ]);
    //load gameObjects
    let ac_unit = new GameObject(listener);
    ac_unit.position.set(2, 1, 3.875);
    addModelToGameObject(ac_unit, pathToAssets + 'models/level/objects/ac_unit.gltf', new THREE.Vector3(0, 0, 0));
    scene.add(ac_unit);
    ac_unit.playSound(pathToAssets + '/sounds/scene/machinery/rattly_noise.mp3', true, 0.1, 1);

    const colliders: Hitbox[] = [
        new Hitbox(new THREE.Vector3(-4, 0, 3.9), new THREE.Vector3(4, 3, 4.1)), // wall 1
        new Hitbox(new THREE.Vector3(-4, 0, -3.9), new THREE.Vector3(4, 3, -4.1)), // wall 2
        //objects
        new Hitbox(new THREE.Vector3(-1-0.25, 0, -1-0.25), new THREE.Vector3(-1+0.25, 1, -1+0.25)), // barrel 1
        new Hitbox(new THREE.Vector3(2-0.25, 0, 0.75-0.25), new THREE.Vector3(2+0.25, 1, 0.75+0.25)), // barrel 2
        new Hitbox(new THREE.Vector3(2-0.4, 0, 3.875-0.125), new THREE.Vector3(2+0.4, 2, 3.875+0.125)), // ac_unit
    ];
    scene.userData = {
        colliders: colliders
    };
    //visualizeCollirders(scene);

    return scene;
}

function visualizeCollirders(scene: THREE.Scene) {
    const colliders = scene.userData.colliders || [];
    colliders.forEach((collider: { max: THREE.Vector3Like; min: THREE.Vector3Like; }) => {
        const boxGeometry = new THREE.BoxGeometry(
            collider.max.x - collider.min.x,
            collider.max.y - collider.min.y,
            collider.max.z - collider.min.z
        );
        const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
        boxMesh.position.copy(collider.min).add(collider.max).multiplyScalar(0.5);
        scene.add(boxMesh);
    });
}
