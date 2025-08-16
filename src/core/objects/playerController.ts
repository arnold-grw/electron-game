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
    acceleration: number = 0.99; //between 0 and 1
    damping: number = 0.001; //between 0 and 1

    constructor(walkingSpeed: number) {
        this.walkingSpeed = walkingSpeed;
        this.input = new InputManager();
    }

    updatePos(body: THREE.Object3D, collisionRadius: number, deltaTime: number) {
        const direction = this.getWASD();
        const moveDir = new THREE.Vector3();
        const targetVelocity = new THREE.Vector3();

        // prepare movement
        if (direction.lengthSq() > 0) {
            moveDir.set(direction.x, 0, direction.z)
                .applyEuler(new THREE.Euler(0, body.rotation.y, 0))
                .normalize();
            targetVelocity.copy(moveDir).multiplyScalar(this.walkingSpeed);
        }

        // smooth transition to target velocity
        //this.velocity.lerp(targetVelocity, this.acceleration);
        const lerpFactor = 1 - Math.pow(1 - this.acceleration, deltaTime);
        this.velocity.lerp(targetVelocity, lerpFactor);

        // damping
        if (direction.lengthSq() === 0) {
            const dampingFactor = Math.pow(this.damping, deltaTime);
            this.velocity.multiplyScalar(dampingFactor);
        }

        // tiny threshold to skip work
        if (this.velocity.lengthSq() < 1e-8) return;

        const platformNavigator = new PlatformNavigator(this.platforms);

        // start position and remaining movement for this frame
        let start = body.position.clone();
        // ensure player's height matches current platform (if any)
        const currentPlatform = platformNavigator.findCurrentPlatform(start);
        if (currentPlatform) {
            start.y = platformNavigator.findY(start, currentPlatform);
            body.position.y = start.y;
        }

        let remaining = this.velocity.clone().multiplyScalar(deltaTime); // full desired displacement this frame

        const MAX_ITER = 4;
        const eps = 0.001;

        for (let iter = 0; iter < MAX_ITER; iter++) {
            if (remaining.lengthSq() < 1e-8) break;

            const end = start.clone().add(remaining);

            // determine whether stepping into a new platform is allowed
            const targetPlatform = platformNavigator.findCurrentPlatform(end);
            const stepAllowed = (currentPlatform &&
                targetPlatform &&
                (currentPlatform === targetPlatform || currentPlatform.isConnectedTo(targetPlatform)));

            // find earliest collision across:
            //  - current platform edges (only if step not allowed)
            //  - other platforms (except when they are targetPlatform and connected to currentPlatform)
            //  - generic colliders
            let closestHit: {
                t: number;
                point: THREE.Vector3;
                normal: THREE.Vector3;
                platform?: Platform;
                edgeA?: THREE.Vector3;
                edgeB?: THREE.Vector3;
            } | null = null;

            // 1) platforms
            for (const platform of this.platforms) {
                // skip checking edges that represent allowed step between current and target
                if (currentPlatform && platform === currentPlatform && stepAllowed) continue;
                if (targetPlatform && platform === targetPlatform && currentPlatform && currentPlatform.isConnectedTo(targetPlatform)) continue;

                const hit = platform.getIntersection(start, end);
                if (!hit) continue;

                // decide if wall should block based on player's vertical position and the edge vertical extent
                const maxEdgeY = Math.max(hit.edgeA.y, hit.edgeB.y);
                const minEdgeY = Math.min(hit.edgeA.y, hit.edgeB.y);

                // player's foot y (we assume player stands on start.y)
                const playerY = start.y;

                // block if player's foot is <= maxEdgeY + eps (i.e. not climbing over)
                if (playerY <= maxEdgeY + 0.01) {
                    if (!closestHit || hit.t < closestHit.t) {
                        closestHit = {
                            t: hit.t,
                            point: hit.point,
                            normal: hit.normal,
                            platform,
                            edgeA: hit.edgeA,
                            edgeB: hit.edgeB,
                        };
                    }
                }
            }

            // 2) other colliders
            for (const collider of this.colliders) {
                const hit = collider.getIntersection(start, end); // assumed same return shape: { point, normal, t }
                if (!hit) continue;
                if (!closestHit || hit.t < closestHit.t) {
                    closestHit = {
                        t: hit.t,
                        point: hit.point,
                        normal: hit.normal,
                    };
                }
            }

            // no collision -> consume whole movement and break
            if (!closestHit) {
                start.add(remaining);
                remaining.set(0, 0, 0);
                break;
            }

            // move to collision point (consuming movement up to t)
            // collision point is along start->end: start + remaining * t
            const consumed = remaining.clone().multiplyScalar(closestHit.t);
            start.add(consumed);

            // small push out to avoid re-hitting the same surface next iteration
            start.addScaledVector(closestHit.normal, eps);

            // compute remaining movement AFTER collision (1 - t)
            remaining.multiplyScalar(1 - closestHit.t);

            // slide: project remaining on collision plane (remove normal component)
            remaining = remaining.projectOnPlane(closestHit.normal);

            // update currentPlatform after small move (so next iteration knows if we stepped onto new platform)
            const maybePlatform = platformNavigator.findCurrentPlatform(start);
            if (maybePlatform) {
                start.y = platformNavigator.findY(start, maybePlatform);
                body.position.y = start.y;
            }
        }

        // finalize position & velocity
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
