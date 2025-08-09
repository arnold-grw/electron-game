import * as THREE from 'three';
import { PlayerController } from './playerController';

export class Player {
    playerController: PlayerController;
    body: THREE.Object3D;
    head: THREE.Object3D;

    constructor() {
        this.playerController = new PlayerController(0.04);
        this.body = new THREE.Object3D();
        this.head = new THREE.Object3D();
        this.head.position.set(0, 1.65, 0);
    }
    
    update() {
        this.playerController.updatePos(this.body);
        this.playerController.updateRot(this.body, this.head);
    }
}