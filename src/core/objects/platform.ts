import * as THREE from 'three';

export class Platform {
    from: THREE.Vector3;
    to: THREE.Vector3;
    offset: THREE.Vector3;
    connections: Platform[] = []; // other platforms that are connected to this one

    constructor(from: THREE.Vector3, to: THREE.Vector3) {
        this.from = from.clone();
        this.to = to.clone()

        this.offset = this.to.clone().sub(this.from);
    }

    /** Alle vier Eckpunkte (zur Anzeige oder Kollisionsvisualisierung) */
    getVertices(): THREE.Vector3[] {
        const v1 = this.from.clone();
        const v2 = this.from.clone().add(new THREE.Vector3(this.offset.x, 0, 0));
        const v3 = this.to.clone();
        const v4 = this.from.clone().add(new THREE.Vector3(0, 0, this.offset.z));
        return [v1, v2, v3, v4];
    }

    getCenter(): THREE.Vector3 {
        return this.from.clone().add(this.offset.clone().multiplyScalar(0.5));
    }

    /** Gibt die Y-Position der Plattform an einem XZ-Punkt zurück */
    getY(pos: THREE.Vector3): number {
        //if (!this.isInside(pos)) return NaN; //check if pos is inside platform

        return this.from.y; // assuming horizontal platform
    }

    /** Prüft, ob ein Punkt innerhalb der Plattform liegt */
    isInside(pos: THREE.Vector3): boolean {
        const minX = Math.min(this.from.x, this.to.x);
        const maxX = Math.max(this.from.x, this.to.x);
        const minZ = Math.min(this.from.z, this.to.z);
        const maxZ = Math.max(this.from.z, this.to.z);

        return (
            minX <= pos.x && pos.x <= maxX &&
            minZ <= pos.z && pos.z <= maxZ
        );
    }


    isConnectedTo(other: Platform): boolean {
        for (const connection of this.connections) {
            if (connection === other) {
                return true;
            }
        }
        return false;
    }


    updateConnections(allPlatforms: Platform[]) {
        const eps = 0.001;
    
        for (const other of allPlatforms) {
            if (other === this) continue;

            let checkVertical: boolean = true;
            let checkHorizontal: boolean = true;
            if (!(this instanceof Slope || other instanceof Slope)) {
                //Y must be same
                if (Math.abs(this.from.y - other.from.y) > eps) {
                    continue;
                }
            } else {
                if (this instanceof Slope) {
                    checkHorizontal = this.towardsZ;
                    checkVertical = !this.towardsZ;
                }
                if (other instanceof Slope) {
                    if (checkHorizontal) checkHorizontal = other.towardsZ;
                    if (checkVertical) checkVertical = !other.towardsZ;
                }
            }

            // X/Z bounds for both
            const x1min = Math.min(this.from.x, this.to.x);
            const x1max = Math.max(this.from.x, this.to.x);
            const z1min = Math.min(this.from.z, this.to.z);
            const z1max = Math.max(this.from.z, this.to.z);
    
            const x2min = Math.min(other.from.x, other.to.x);
            const x2max = Math.max(other.from.x, other.to.x);
            const z2min = Math.min(other.from.z, other.to.z);
            const z2max = Math.max(other.from.z, other.to.z);
    
            // Check if one edge is touching vertically
            let shareVerticalEdge = false;
            if (checkVertical) {
                shareVerticalEdge =
                (Math.abs(x1min - x2max) < eps || Math.abs(x1max - x2min) < eps) &&
                (Math.max(z1min, z2min) < Math.min(z1max, z2max) - eps);
            }
            // Or horizontally
            let shareHorizontalEdge = false;
            if (checkHorizontal) {
                shareHorizontalEdge =
                (Math.abs(z1min - z2max) < eps || Math.abs(z1max - z2min) < eps) &&
                (Math.max(x1min, x2min) < Math.min(x1max, x2max) - eps);
            }
    
            if ((shareVerticalEdge || shareHorizontalEdge)) {
                if (!this.connections.includes(other)) {
                    this.connections.push(other);
                }
            }
        }
    }
    
    
    

    getIntersection(start: THREE.Vector3, end: THREE.Vector3): {
        point: THREE.Vector3;
        normal: THREE.Vector3;
        t: number; // param along start->end (0..1)
        edgeA: THREE.Vector3;
        edgeB: THREE.Vector3;
    } | null {
        const verts = this.getVertices(); // expected order [v1,v2,v3,v4]
        const edges: [THREE.Vector3, THREE.Vector3][] = [
            [verts[0], verts[1]],
            [verts[1], verts[2]],
            [verts[2], verts[3]],
            [verts[3], verts[0]],
        ];

        const p1 = new THREE.Vector2(start.x, start.z);
        const p2 = new THREE.Vector2(end.x, end.z);

        let closest: {
            point: THREE.Vector3;
            normal: THREE.Vector3;
            t: number;
            edgeA: THREE.Vector3;
            edgeB: THREE.Vector3;
        } | null = null;

        const centerXZ = new THREE.Vector2(this.getCenter().x, this.getCenter().z);
        const eps = 1e-9;

        for (const [a3, b3] of edges) {
            const a = new THREE.Vector2(a3.x, a3.z);
            const b = new THREE.Vector2(b3.x, b3.z);

            const denom = (b.y - a.y) * (p2.x - p1.x) - (b.x - a.x) * (p2.y - p1.y);
            if (Math.abs(denom) < eps) continue; // parallel / nearly parallel

            const ua = ((b.x - a.x) * (p1.y - a.y) - (b.y - a.y) * (p1.x - a.x)) / denom;
            const ub = ((p2.x - p1.x) * (p1.y - a.y) - (p2.y - p1.y) * (p1.x - a.x)) / denom;

            // ua: param on movement segment, ub: param on edge segment
            if (ua < 0 || ua > 1 || ub < 0 || ub > 1) continue;

            const ix = p1.x + ua * (p2.x - p1.x);
            const iz = p1.y + ua * (p2.y - p1.y);

            // edge direction 3D
            const edge3 = new THREE.Vector3().subVectors(b3, a3);
            // horizontal normal: cross(up, edge) => (edge.z, 0, -edge.x)
            const normal = new THREE.Vector3(edge3.z, 0, -edge3.x).normalize();

            // decide inward/outward by checking direction from intersection to center
            const toCenter = new THREE.Vector2(centerXZ.x - ix, centerXZ.y - iz);
            const dot = toCenter.dot(new THREE.Vector2(normal.x, normal.z));
            if (dot < 0) normal.negate(); // make it point inward

            const point3 = new THREE.Vector3(ix, 0, iz); // y will be handled by caller

            // pick closest (smallest ua)
            if (!closest || ua < closest.t) {
                closest = {
                    point: point3,
                    normal,
                    t: ua,
                    edgeA: a3.clone(),
                    edgeB: b3.clone(),
                };
            }
        }

        return closest;
    }

}

export class Slope extends Platform {
    towardsZ: boolean;

    constructor(from: THREE.Vector3, to: THREE.Vector3, towardsZ: boolean) {
        super(from, to);
        this.towardsZ = towardsZ;
    }

    getVertices(): THREE.Vector3[] {
        const v1 = this.from.clone();
        const v3 = this.to.clone();
        let v2, v4;
        if (this.towardsZ) {
            v2 = this.from.clone().add(new THREE.Vector3(this.offset.x, 0, 0));
            v4 = this.from.clone().add(new THREE.Vector3(0, this.offset.y, this.offset.z));
        } else {
            v2 = this.from.clone().add(new THREE.Vector3(0, 0, this.offset.z));
            v4 = this.from.clone().add(new THREE.Vector3(this.offset.x, this.offset.y, 0));
        }
        return [v1, v2, v3, v4];
    }

    getY(pos: THREE.Vector3): number {
        if (!this.isInside(pos)) return NaN;
        if (this.towardsZ) {
            const t = (pos.z - this.from.z) / (this.to.z - this.from.z);
            return this.from.y + t * (this.to.y - this.from.y);
        } else {
            const t = (pos.x - this.from.x) / (this.to.x - this.from.x);
            return this.from.y + t * (this.to.y - this.from.y);
        }
    }
}
