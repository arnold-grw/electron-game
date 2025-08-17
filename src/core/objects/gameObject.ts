import * as THREE from 'three';

export class GameObject extends THREE.Object3D {
    listener: THREE.AudioListener;

    constructor(pos: THREE.Vector3, listener: THREE.AudioListener) {
        super();
        this.position.copy(pos);
        this.listener = listener;
    }

    playSound(file: string, loop: boolean = false, refDistance: number = 5, maxDistance: number = 20) {
        const audio = new THREE.PositionalAudio(this.listener);
        const loader = new THREE.AudioLoader();
        loader.load(file, (buffer) => {
            audio.setBuffer(buffer);
            audio.setLoop(loop);
            //audio.setDistanceModel('linear');
            audio.setRefDistance(refDistance);
            audio.setMaxDistance(maxDistance);
            audio.play();
        });
        this.add(audio);
    }
}
