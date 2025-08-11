import * as THREE from 'three';
import { InputManager } from '../manager/inputManager';
import { Platform } from './platform';
import { Hitbox } from './hitbox';
import { PlatformNavigator } from './platformNavigator';

export class PlayerController {
    input: InputManager;
    platforms: Platform[] = [];
    colliders: Hitbox[] = [];
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

    updatePos(body: THREE.Object3D, collisionRadius: number) {
        const direction = this.getWASD();
        let targetVelocity = new THREE.Vector3();
        let moveDir = new THREE.Vector3();


        if (direction.length() > 0) {
            moveDir = new THREE.Vector3(direction.x, 0, direction.z);
            moveDir.applyEuler(new THREE.Euler(0, body.rotation.y, 0));
            targetVelocity.copy(moveDir).multiplyScalar(this.walkingSpeed);
        }

        // smooth transition to target velocity
        this.velocity.lerp(targetVelocity, this.acceleration);

        // apply damping if no input
        if (direction.length() === 0) {
            this.velocity.multiplyScalar(this.damping);
        }


        // when moving
        if (this.velocity.length() > 0) {
            const platformNavigator = new PlatformNavigator(this.platforms);
            const currentPlatform = platformNavigator.findCurrentPlatform(body.position);
            if (currentPlatform) {
                body.position.y = platformNavigator.findY(body.position, currentPlatform);

                if (!platformNavigator.canStepTo(body.position.clone().add(this.velocity), currentPlatform)) {
                    this.velocity.set(0, 0, 0); // stop movement if can't step to target position
                }
            }




            /*
            //collision
            for (const collider of this.colliders) {
            const start = body.position.clone();
            const middle = start.clone().add(moveDir.clone().multiplyScalar(collisionRadius));
            const end = middle.clone().add(this.velocity);

            const intersection = collider.intersectSegment(start, end);
            if (intersection) {
                const { point, normal } = intersection;

                // Vector from intersection point to intended position
                const penetrationVector = end.clone().sub(point);

                // Project velocity onto the plane defined by the collision normal (slide along surface)
                const slideVelocity = this.velocity.clone().projectOnPlane(normal);

                this.velocity.copy(slideVelocity);
            }
        }
        */
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

    updateWalkCycle() {
        // Implement walk cycle logic if needed
    }
}
