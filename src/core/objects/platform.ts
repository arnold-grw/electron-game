import * as THREE from 'three';

export class Platform {
    origin: THREE.Vector3;
    edge1: THREE.Vector3;
    edge2: THREE.Vector3;
    normal: THREE.Vector3;
    planeConstant: number;

    constructor(origin: THREE.Vector3, edge1: THREE.Vector3, edge2: THREE.Vector3) {
        this.origin = origin.clone();
        this.edge1 = edge1.clone().add(this.origin.clone().multiplyScalar(-1));
        this.edge2 = edge2.clone().add(this.origin.clone().multiplyScalar(-1));

        // Normale berechnen (garantiert eindeutig)
        this.normal = new THREE.Vector3().crossVectors(this.edge1, this.edge2).normalize();
        this.planeConstant = -this.normal.dot(this.origin);
    }

    /** Alle vier Eckpunkte (zur Anzeige oder Kollisionsvisualisierung) */
    getVertices(): THREE.Vector3[] {
        const v1 = this.origin.clone();
        const v2 = this.origin.clone().add(this.edge1);
        const v3 = this.origin.clone().add(this.edge2);
        const v4 = this.origin.clone().add(this.edge1).add(this.edge2);
        return [v1, v2, v4, v3]; // Reihenfolge für Rechteck (v4 statt v3, damit Reihenfolge im Uhrzeigersinn)
    }

    getCenter(): THREE.Vector3 {
        return this.origin.clone().add(this.edge1.clone().multiplyScalar(0.5)).add(this.edge2.clone().multiplyScalar(0.5));
    }

    /** Gibt die Y-Position der Plattform an einem XZ-Punkt zurück */
    getY(pos: THREE.Vector3): number;
    getY(pos: THREE.Vector2): number;
    getY(pos: THREE.Vector2 | THREE.Vector3): number {
        const point2D = pos instanceof THREE.Vector3 ? new THREE.Vector2(pos.x, pos.z) : pos;

        if (!this.isInside(point2D)) return NaN;

        const a = this.normal.x;
        const b = this.normal.y;
        const c = this.normal.z;
        const d = this.planeConstant;

        return (-d - a * point2D.x - c * point2D.y) / b;
    }

    /** Prüft, ob ein XZ-Punkt innerhalb der Plattform liegt */
    isInside(pos: THREE.Vector3): boolean;
    isInside(pos: THREE.Vector2): boolean;
    isInside(pos: THREE.Vector2 | THREE.Vector3): boolean {
        const point2D = pos instanceof THREE.Vector3 ? new THREE.Vector2(pos.x, pos.z) : pos;

        // Lokale Koordinaten relativ zu origin berechnen
        const rel = new THREE.Vector3(point2D.x - this.origin.x, 0, point2D.y - this.origin.z);

        // Projektion auf edge1 und edge2
        const edge1XZ = new THREE.Vector2(this.edge1.x, this.edge1.z);
        const edge2XZ = new THREE.Vector2(this.edge2.x, this.edge2.z);

        const dot11 = edge1XZ.dot(edge1XZ);
        const dot22 = edge2XZ.dot(edge2XZ);
        const dot12 = edge1XZ.dot(edge2XZ);

        const relXZ = new THREE.Vector2(rel.x, rel.z);
        const dot1p = edge1XZ.dot(relXZ);
        const dot2p = edge2XZ.dot(relXZ);

        // Skalarfaktoren in beide Richtungen bestimmen
        const det = dot11 * dot22 - dot12 * dot12;
        if (det === 0) return false;

        const u = (dot22 * dot1p - dot12 * dot2p) / det;
        const v = (dot11 * dot2p - dot12 * dot1p) / det;

        return u >= 0 && u <= 1 && v >= 0 && v <= 1;
    }

    isConnectedTo(other: Platform): boolean {
        const vertices = this.getVertices();
        const otherVertices = other.getVertices();
        let sharedCount = 0;
        const threshold = 0.001;
        for (const v1 of vertices) {
            for (const v2 of otherVertices) {
                if (v1.distanceTo(v2) < threshold) {
                    sharedCount++;
                    if (sharedCount >= 2) {
                        return true; // at least two vertices are shared
                    }
                }
            }
        }
        return false;
    }
}
