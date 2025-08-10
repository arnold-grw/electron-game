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

    intersectSegment(start: THREE.Vector3, end: THREE.Vector3): { point: THREE.Vector3; normal: THREE.Vector3 } | null {
        // Fix Y to a constant height (e.g., player's standing height)
        const fixedY = start.y+0.1; // or a constant like 0 if Boden ist immer 0
        const start2D = new THREE.Vector3(start.x, fixedY, start.z);
        const end2D = new THREE.Vector3(end.x, fixedY, end.z);

        const dir = new THREE.Vector3().subVectors(end2D, start2D);
        const invDir = new THREE.Vector3(
            1 / (dir.x !== 0 ? dir.x : 1e-10),
            0, // ignore Y
            1 / (dir.z !== 0 ? dir.z : 1e-10)
        );

        let tmin = (this.min.x - start2D.x) * invDir.x;
        let tmax = (this.max.x - start2D.x) * invDir.x;
        if (tmin > tmax) [tmin, tmax] = [tmax, tmin];

        // Skip Y check!

        let tzmin = (this.min.z - start2D.z) * invDir.z;
        let tzmax = (this.max.z - start2D.z) * invDir.z;
        if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

        if ((tmin > tzmax) || (tzmin > tmax)) return null;
        if (tzmin > tmin) tmin = tzmin;
        if (tzmax < tmax) tmax = tzmax;

        if (tmin < 0 || tmin > 1) {
            if (tmax < 0 || tmax > 1) return null;
            else {
                const point = start2D.clone().add(dir.clone().multiplyScalar(tmax));
                point.y = fixedY; // restore Y
                return { point, normal: this._calculateNormal(point) };
            }
        }

        const point = start2D.clone().add(dir.clone().multiplyScalar(tmin));
        point.y = fixedY; // restore Y
        return { point, normal: this._calculateNormal(point) };
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