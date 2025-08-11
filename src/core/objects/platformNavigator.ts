import * as THREE from 'three';
import { Platform } from './platform';

export class PlatformNavigator {
    platforms: Platform[];

    constructor(platforms: Platform[]) {
        this.platforms = platforms;
    }

    findCurrentPlatform(playerPosition: THREE.Vector3): Platform | null {
        for (const platform of this.platforms) {
            if (platform.isInside(playerPosition)) {
                if (platform.getY(new THREE.Vector2(playerPosition.x, playerPosition.z))-1 < playerPosition.y) {
                    return platform;
                }
            }
        }
        return null;
    }

    findY(playerPosition: THREE.Vector3, currentPlatform: Platform): number {
        if (currentPlatform) {
            return currentPlatform.getY(new THREE.Vector2(playerPosition.x, playerPosition.z));
        }
        return 0; //default height if no platform found
    }

    canStepTo(targetPosition: THREE.Vector3, currentPlatform: Platform): boolean {
        const targetPlatform: Platform | null = this.findCurrentPlatform(targetPosition);
        if (targetPlatform && currentPlatform) {
            if (currentPlatform === targetPlatform) {
                //console.log("same platform");
                return true; // can step to the same platform
            } else {
                console.log("not the same platform");
                if (currentPlatform.isConnectedTo(targetPlatform)) {
                    console.log("connected to another platform");
                    return true; // can step to the same platform or connected platform
                }
            }
        }
        return false;
    }


    /*
    updateCurrentPlatform(playerPosition: THREE.Vector3) {
        this.currentPlatform = this.findCurrentPlatform(playerPosition);
    } */
    
}