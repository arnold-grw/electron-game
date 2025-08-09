import * as THREE from 'three';
import { InputManager } from './inputManager';

export class PlayerController {
    input: InputManager;
    walkingSpeed: number;
    mouseSensitivity: number = 0.002;

    yaw: number = 0;
    pitch: number = 0;

    velocity: THREE.Vector3 = new THREE.Vector3(); // current velocity
    acceleration: number = 0.1;
    damping: number = 0.8;

    constructor(walkingSpeed: number) {
        this.walkingSpeed = walkingSpeed;
        this.input = new InputManager();
    }

    updatePos(body: THREE.Object3D) {
        const direction = this.getWASD();
        let targetVelocity = new THREE.Vector3();

        if (direction.length() > 0) {
            const moveDir = new THREE.Vector3(direction.x, 0, direction.z);
            moveDir.applyEuler(new THREE.Euler(0, body.rotation.y, 0));
            targetVelocity.copy(moveDir).multiplyScalar(this.walkingSpeed);
        }

        // smooth transition to target velocity
        this.velocity.lerp(targetVelocity, this.acceleration);

        // apply damping if no input
        if (direction.length() === 0) {
            this.velocity.multiplyScalar(this.damping);
        }

        body.position.add(this.velocity);
    }

    updateRot(body: THREE.Object3D, head: THREE.Object3D) {
        const delta = this.input.mouseDelta;

        this.yaw -= delta.x * this.mouseSensitivity;
        this.pitch -= delta.y * this.mouseSensitivity;

        const pitchLimit = Math.PI / 2 - 0.01;
        this.pitch = Math.max(-pitchLimit, Math.min(pitchLimit, this.pitch));

        head.rotation.x = this.pitch;
        body.rotation.y = this.yaw;

        this.input.resetDeltas();
    }

    getWASD(): THREE.Vector3 {
        const direction = new THREE.Vector3();
        if (this.input.isKeyDown('KeyW')) direction.z = -1;
        if (this.input.isKeyDown('KeyS')) direction.z = 1;
        if (this.input.isKeyDown('KeyA')) direction.x = -1;
        if (this.input.isKeyDown('KeyD')) direction.x = 1;
        direction.normalize();
        return direction;
    }
}
