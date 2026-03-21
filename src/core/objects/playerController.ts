import * as THREE from 'three';
import { InputManager } from '../manager/inputManager';
import { Platform } from './platform';
import { Hitbox } from './hitbox';
import { PlatformNavigator } from './platformNavigator';
import { lerp } from '../utils';

export class PlayerController {
    input: InputManager;
    platforms: Platform[] = [];
    colliders: Hitbox[] = [];
    walkSpeed: number;
    crouchSpeed: number;
    mouseSensitivity: number = 0.002;

    isCrouching: boolean = false;

    yaw: number = 0;
    pitch: number = 0;

    currentSpeed: number = 2;
    velocity: THREE.Vector3 = new THREE.Vector3(); // current velocity
    acceleration: number = 0.99; //between 0 and 1
    damping: number = 0.001; //between 0 and 1

    currentHeadHeight: number;

    constructor(walkSpeed: number, crouchSpeed: number, normalHeadHeight: number) {
        this.walkSpeed = walkSpeed;
        this.crouchSpeed = crouchSpeed;
        this.input = new InputManager();
        this.currentHeadHeight = normalHeadHeight;
    }

    updateSpeed(){
        this.currentSpeed = this.walkSpeed;
        if (this.isCrouching) {
            this.currentSpeed = this.crouchSpeed;
        }
    }

    updatePos(body: THREE.Object3D, deltaTime: number) {
        this.updateSpeed();
        const direction = this.getWASD();
        const moveDir = new THREE.Vector3();
        const targetVelocity = new THREE.Vector3();
    
        // prepare movement
        if (direction.lengthSq() > 0) {
            moveDir.set(direction.x, 0, direction.z)
                .applyEuler(new THREE.Euler(0, body.rotation.y, 0))
                .normalize();
            targetVelocity.copy(moveDir).multiplyScalar(this.currentSpeed);
        }
    
        // smooth transition to target velocity
        const lerpFactor = 1 - Math.pow(1 - this.acceleration, deltaTime);
        this.velocity.lerp(targetVelocity, lerpFactor);
    
        // damping when no input
        if (direction.lengthSq() === 0) {
            const dampingFactor = Math.pow(this.damping, deltaTime);
            this.velocity.multiplyScalar(dampingFactor);
        }
    
        if (this.velocity.lengthSq() < 1e-8) return;
    
        const platformNavigator = new PlatformNavigator(this.platforms);
    
        // snap to current platform Y
        let start = body.position.clone();
        let currentPlatform = platformNavigator.findCurrentPlatform(start);
        if (currentPlatform) {
            start.y = platformNavigator.findY(start, currentPlatform);
            body.position.y = start.y;
        }
    
        let remaining = this.velocity.clone().multiplyScalar(deltaTime);
    
        const MAX_ITER = 4;
        const eps = 0.001;
    
        for (let iter = 0; iter < MAX_ITER; iter++) {
            if (remaining.lengthSq() < 1e-8) break;
    
            const end = start.clone().add(remaining);
    
            // where are we trying to go?
            const targetPlatform = platformNavigator.findCurrentPlatform(end);
    
            // can we step into target?
            const stepAllowed = (
                currentPlatform &&
                targetPlatform &&
                (currentPlatform === targetPlatform ||
                 currentPlatform.isConnectedTo(targetPlatform))
            );
    
            let closestHit: {
                t: number;
                point: THREE.Vector3;
                normal: THREE.Vector3;
            } | null = null;
    
            // test collisions against the current platform
            if (currentPlatform && !stepAllowed) {
                const hit = currentPlatform.getIntersection(start, end);
                if (hit) {
                    const maxEdgeY = Math.max(hit.edgeA.y, hit.edgeB.y);
                    const playerY = start.y;
    
                    // only block if player is at or below the edge height
                    if (playerY <= maxEdgeY + 0.01) {
                        closestHit = {
                            t: hit.t,
                            point: hit.point,
                            normal: hit.normal,
                        };
                    }
                }
            }
    
            // also test against generic colliders
            for (const collider of this.colliders) {
                const hit = collider.getIntersection(start, end);
                if (!hit) continue;
                if (!closestHit || hit.t < closestHit.t) {
                    closestHit = {
                        t: hit.t,
                        point: hit.point,
                        normal: hit.normal,
                    };
                }
            }
    
            if (!closestHit) {
                // no collision → move freely
                start.add(remaining);
                remaining.set(0, 0, 0);
                break;
            }
    
            // stop at collision point
            const consumed = remaining.clone().multiplyScalar(closestHit.t);
            start.add(consumed);
    
            // nudge out
            start.addScaledVector(closestHit.normal, eps);
    
            // compute remainder after collision
            remaining.multiplyScalar(1 - closestHit.t);
    
            // slide along surface
            remaining = remaining.projectOnPlane(closestHit.normal);
    
            // update platform snap
            const maybePlatform = platformNavigator.findCurrentPlatform(start);
            if (maybePlatform) {
                start.y = platformNavigator.findY(start, maybePlatform);
                body.position.y = start.y;
                currentPlatform = maybePlatform;
            }
        }
    
        body.position.copy(start);
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

    updateHeadHeight(head: THREE.Object3D, normalHeight: number, crouchHeight: number, deltaTime: number) {
        let targetHeight;
        if (this.input.isKeyDown('ControlLeft')) {
            this.isCrouching = true;
            targetHeight = crouchHeight;
        } else {
            this.isCrouching = false;
            targetHeight = normalHeight;
        }

        const lerpFactor = 5;
        this.currentHeadHeight = lerp(this.currentHeadHeight, targetHeight, lerpFactor*deltaTime);

        head.position.y = this.currentHeadHeight;
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
