import * as THREE from 'three';
import { Player } from './objects/player';

export class GameManager {
    private player: Player;
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.player = new Player(scene);
    }

    update() {
        this.player.update();
    }

    setScene(scene: THREE.Scene) {
        this.scene = scene;
        this.player.updateColliders();
    }

    getBody(): THREE.Object3D {
        return this.player.body;
    }

    getHead(): THREE.Object3D {
        return this.player.head;
    }
}
