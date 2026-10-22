import * as THREE from 'three';

export class InputManager {
  private keys: Record<string, boolean> = {};
  public mouseDelta: THREE.Vector2 = new THREE.Vector2(0, 0);
  public mousePosition: THREE.Vector2 = new THREE.Vector2(0, 0);
  public mouseButtons: Record<number, boolean> = {};

  private lastMousePos: THREE.Vector2 | null = null;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
  }

  // Keyboard event handlers.
  private onKeyDown = (event: KeyboardEvent) => {
    this.keys[event.code] = true;
  };

  private onKeyUp = (event: KeyboardEvent) => {
    this.keys[event.code] = false;
  };

  // Mouse event handlers.
  private onMouseDown = (event: MouseEvent) => {
    this.mouseButtons[event.button] = true;
  };

  private onMouseUp = (event: MouseEvent) => {
    this.mouseButtons[event.button] = false;
  };

  private onMouseMove = (event: MouseEvent) => {
    if (document.pointerLockElement === event.target) {
        // Use relative mouse movement.
        this.mouseDelta.set(event.movementX, event.movementY);
    } else {
        // Reset movement when pointer lock is inactive.
        this.mouseDelta.set(0, 0);
    }
    };


  // Input query methods.
  public isKeyDown(keyCode: string): boolean {
    return !!this.keys[keyCode];
  }

  public isMouseButtonDown(button: number): boolean {
    return !!this.mouseButtons[button];
  }

  // Reset mouse movement at the end of each frame.
  public resetDeltas() {
    this.mouseDelta.set(0, 0);
  }

  // Remove event listeners when the input manager is no longer needed.
  public dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
  }
}
