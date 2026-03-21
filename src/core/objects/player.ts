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
    walkSpeed: number = 2;
    crouchSpeed: number = 1;

    headHeight: number = 1.65;
    crouchHeight: number = 1.15;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.playerController = new PlayerController(this.walkSpeed, this.crouchSpeed, this.headHeight);
        this.playerController.platforms = this.scene.userData.platforms || []; // Get platforms from scene data
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
    
    update(deltaTime: number) {
        this.playerController.updatePos(this.body, deltaTime);
        this.playerController.updateRot(this.body, this.head);
        this.playerController.updateHeadHeight(this.head, this.headHeight, this.crouchHeight, deltaTime);
    }
}