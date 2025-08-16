import * as THREE from 'three';

export class Hitbox {
    min: THREE.Vector3;
    max: THREE.Vector3;
    center: THREE.Vector3;
    constructor(min: THREE.Vector3, max: THREE.Vector3) {
        this.min = min.clone();
        this.max = max.clone();
        this.center = min.clone().add(max).multiplyScalar(0.5);
    }

    intersects(point: THREE.Vector3): boolean {
        return (
            point.x >= this.min.x && point.x <= this.max.x &&
            point.y >= this.min.y && point.y <= this.max.y &&
            point.z >= this.min.z && point.z <= this.max.z
        );
    }

    getIntersection(start: THREE.Vector3, end: THREE.Vector3): { point: THREE.Vector3; normal: THREE.Vector3; t: number } | null {
        // We perform a 2D segment vs AABB (XZ plane) intersection
        const fixedY = start.y + 0.1; // Y coordinate used for the intersection plane

        //skip if the hitbox is below or over the the player
        if (start.y < this.min.y || start.y > this.max.y) {
            return null;
        }

        const start2D = new THREE.Vector2(start.x, start.z);
        const end2D = new THREE.Vector2(end.x, end.z);

        const dir2D = new THREE.Vector2().subVectors(end2D, start2D);

        if (dir2D.lengthSq() < 1e-12) return null; // no movement

        // slab method for X and Z
        let tmin = 0;
        let tmax = 1;

        function updateInterval(minVal: number, maxVal: number, startVal: number, dirVal: number): boolean {
            if (Math.abs(dirVal) < 1e-10) {
                // Parallel movement
                return startVal >= minVal && startVal <= maxVal;
            }
            let t1 = (minVal - startVal) / dirVal;
            let t2 = (maxVal - startVal) / dirVal;
            if (t1 > t2) [t1, t2] = [t2, t1];
            if (t1 > tmin) tmin = t1;
            if (t2 < tmax) tmax = t2;
            return tmin <= tmax;
        }

        if (!updateInterval(this.min.x, this.max.x, start.x, end.x - start.x)) return null;
        if (!updateInterval(this.min.z, this.max.z, start.z, end.z - start.z)) return null;

        // Now tmin and tmax represent intervals where segment overlaps box in XZ
        // We want earliest t in [0,1]
        if (tmin > 1 || tmax < 0) return null;

        let t = Math.max(tmin, 0);
        if (t > 1) return null;

        // intersection point in 3D:
        const point = new THREE.Vector3(
            start.x + (end.x - start.x) * t,
            fixedY,
            start.z + (end.z - start.z) * t
        );

        // Calculate normal of the face hit by checking which side is closest to the point
        // We use same helper as before:

        const normal = this._calculateNormal(point);

        return { point, normal, t };
    }



    // Helper method to compute normal of the AABB face closest to the point
    private _calculateNormal(point: THREE.Vector3): THREE.Vector3 {
        const epsilon = 1e-4;
        const normals = [
            { dist: Math.abs(point.x - this.min.x), normal: new THREE.Vector3(-1, 0, 0) },
            { dist: Math.abs(point.x - this.max.x), normal: new THREE.Vector3(1, 0, 0) },
            { dist: Math.abs(point.y - this.min.y), normal: new THREE.Vector3(0, -1, 0) },
            { dist: Math.abs(point.y - this.max.y), normal: new THREE.Vector3(0, 1, 0) },
            { dist: Math.abs(point.z - this.min.z), normal: new THREE.Vector3(0, 0, -1) },
            { dist: Math.abs(point.z - this.max.z), normal: new THREE.Vector3(0, 0, 1) },
        ];

        normals.sort((a, b) => a.dist - b.dist);

        // Return the normal of the closest face
        return normals[0].normal.clone();
    }


}