import * as THREE from 'three';
import { PlayerController } from './playerController';
import { getSelectedColliders } from '../manager/colliderManager';
import { get } from 'http';
import { GameObject } from './gameObject';

export class Player{
    scene: THREE.Scene;
    playerController: PlayerController;
    body: THREE.Object3D;
    head: THREE.Object3D;
    collisionRadius: number = 0.3; // radius of the player for collision detection

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.playerController = new PlayerController(0.04);
        this.updateColliders() // Initialize colliders for the player controller
        this.body = new THREE.Object3D();
        this.head = new THREE.Object3D();
        this.head.position.set(0, 1.65, 0);
    }

    //update the colliders and pass them to the player controller
    updateColliders(){
        let updatedColliders = getSelectedColliders(this.scene.userData.colliders || []);
        this.playerController.colliders = updatedColliders;
    }
    
    update() {
        this.playerController.updatePos(this.body, this.collisionRadius);
        this.playerController.updateRot(this.body, this.head);
    }
}