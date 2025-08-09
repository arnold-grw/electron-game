import * as THREE from 'three';
import { Player } from './player';

export class GameManager {
    private player: Player;

    constructor() {
        this.player = new Player();
    }

    update() {
        this.player.update();
    }

    getBody(): THREE.Object3D {
        return this.player.body;
    }

    getHead(): THREE.Object3D {
        return this.player.head;
    }
}
