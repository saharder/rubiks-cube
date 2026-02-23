import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import {
  BLACK_MESH,
  FACE_COLORS_ORIENTATION,
  FACE_ROTATIONS,
} from "./constants";
import { getStickerFace } from "./textures";
import type { CubePieceColors, FaceDirections } from "./types";

/**
 * Rounds each component of a vector to the nearest integer.
 * This is useful to eliminate floating-point errors after rotations.
 * @param vector - The vector to round
 */
function roundVector(vector: THREE.Vector3): void {
  vector.x = Math.round(vector.x);
  vector.y = Math.round(vector.y);
  vector.z = Math.round(vector.z);
}

export class RubiksCubeAnimation {
  // Private properties

  // The scene
  private scene: THREE.Scene;

  // The camera used to render the scene.
  private camera: THREE.Camera;

  // The renderer of the cube
  private renderer: THREE.WebGLRenderer;

  // The controls provide click and drag rotation of the cube
  private controls: OrbitControls;

  // Stats is used to display live stats like fps for analyzing the 3d render's performance
  private stats = new Stats();

  // The individual pieces of the cube
  private pieces: THREE.Mesh[];

  // ANIMATION VARIABLES

  private animationProgress = 0; // From [0,1]
  private isAnimating = false;
  private animationQuaternion: THREE.Quaternion = new THREE.Quaternion(); // The animation amount
  private animationFace: THREE.Group = new THREE.Group();

  // This tracks rotations that have been requested. When animating the rotations,
  // we can't start the next rotation until the previous one has finished.
  private rotationQueue: FaceDirections[] = [];

  /**
   * Constructor for a new RubiksCubeAnimation instance. This handles
   * setting up the scene, camera, and rendering loop.
   * @param canvas - The canvas element in which to render the animation
   */
  constructor(canvas: HTMLCanvasElement) {
    // Render stats for debugging in development only
    if (import.meta.env.DEV) {
      document.body.appendChild(this.stats.dom);
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#232323");

    this.renderer = this.initRenderer(canvas);
    this.camera = this.initCamera(canvas);
    this.controls = this.initControls(canvas, this.camera);

    // Render the cube
    this.pieces = this.getCubePieces();
    this.scene.add(...this.pieces);
  }

  private initRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(canvas.width, canvas.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Start the animation loop
    renderer.setAnimationLoop(() => this.animationLoop());
    return renderer;
  }

  /**
   * Initializes a camera looking down the z axis in the negative direction.
   * @param canvas - canvas element the cube is rendered in
   * @returns camera
   */
  private initCamera(canvas: HTMLCanvasElement) {
    const camera = new THREE.PerspectiveCamera(
      75,
      canvas.width / canvas.height,
      0.1,
      10
    );

    // Set initial camera position
    camera.position.z = 6;

    return camera;
  }

  /**
   * Initializes orbital controls that can be used to move the
   * camera around the cube via click and drag.
   * @param canvas - Canvas element the cube is rendered in.
   * @param camera - The camera to maniuplate with the controls
   * @returns orbital controls object
   */
  private initControls(canvas: HTMLCanvasElement, camera: THREE.Camera) {
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    // Configure controls for rotation only
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.update();

    return controls;
  }

  // Reset the controls and camera
  public Reset(): void {
    this.controls.reset();
  }

  /**
   * Given a face and a piece, this returns true if the piece is
   * part of that face.
   * @param piece - The piece in question
   * @param face - The direction of the face
   * @returns
   */
  private isPartOfFace(piece: THREE.Mesh, face: FaceDirections) {
    const pos = piece.position;
    switch (face) {
      case "posX":
        return pos.x > 0;
      case "negX":
        return pos.x < 0;
      case "posY":
        return pos.y > 0;
      case "negY":
        return pos.y < 0;
      case "posZ":
        return pos.z > 0;
      case "negZ":
        return pos.z < 0;
    }
  }

  public Rotate(...faces: FaceDirections[]) {
    this.rotationQueue.push(...faces);
  }

  private startAnimation(face: FaceDirections) {
    this.isAnimating = true;
    this.animationProgress = 0;
    this.animationFace = this.getFaceGroup(face);
    this.scene.add(this.animationFace);
    this.animationQuaternion = FACE_ROTATIONS[face];
  }

  private updateAnimation() {
    if (this.animationProgress > 1) {
      this.finishAnimation();
      return;
    }

    this.animationProgress += 0.05;
    this.animationFace.quaternion.slerpQuaternions(
      new THREE.Quaternion().identity(),
      this.animationQuaternion,
      this.animationProgress
    );
  }

  private finishAnimation() {
    while (this.animationFace.children.length > 0) {
      const piece = this.animationFace.children[0] as THREE.Mesh;

      const worldPosition = new THREE.Vector3();
      const worldQuaternion = new THREE.Quaternion();
      piece.getWorldPosition(worldPosition);
      piece.getWorldQuaternion(worldQuaternion);

      this.animationFace.remove(piece);

      // Round position to fix floating-point errors from rotation
      roundVector(worldPosition);
      piece.position.copy(worldPosition);
      piece.quaternion.copy(worldQuaternion);

      this.scene.add(piece);
    }

    this.rotationQueue.shift(); // pop most recent rotation off queue
    this.isAnimating = false;
  }

  /**
   * Retrieves all the pieces that are part of a face.
   * @param face
   * @returns
   */
  private getFaceGroup(face: FaceDirections) {
    const facePieces = this.pieces.filter((piece) => {
      return this.isPartOfFace(piece, face);
    });

    const group = new THREE.Group();
    facePieces.forEach((piece) => {
      // Remove from scene and add to group
      this.scene.remove(piece);
      group.add(piece);
    });

    return group;
  }

  /**
   * getCubePieces creates all the three js mesh objects for each of the
   * rubiks cube's 26 pieces.
   * @returns An array of all the pieces.
   */
  private getCubePieces() {
    const vals = [-1, 0, 1];
    const pieces: THREE.Mesh[] = new Array();

    for (const x of vals) {
      for (const y of vals) {
        for (const z of vals) {
          if (x === 0 && y === 0 && z === 0) {
            continue;
          }

          const pieceColors: CubePieceColors = {
            posX: x > 0 ? FACE_COLORS_ORIENTATION.posX : undefined,
            negX: x < 0 ? FACE_COLORS_ORIENTATION.negX : undefined,
            posY: y > 0 ? FACE_COLORS_ORIENTATION.posY : undefined,
            negY: y < 0 ? FACE_COLORS_ORIENTATION.negY : undefined,
            posZ: z > 0 ? FACE_COLORS_ORIENTATION.posZ : undefined,
            negZ: z < 0 ? FACE_COLORS_ORIENTATION.negZ : undefined,
          };

          const piece = createCubePiece(pieceColors);
          piece.position.set(x, y, z);
          pieces.push(piece);
        }
      }
    }
    // Add all corners to the scene at once
    return pieces;
  }

  // This method is called repeatedly on each render of the scene
  // It contains all the logic for animating the cube if an animation
  // is queued up.
  private animationLoop(): void {
    const { stats, controls, renderer, scene, camera, rotationQueue } = this;

    if (import.meta.env.DEV) {
      stats.update();
    }
    controls.update();

    if (this.isAnimating) {
      this.updateAnimation();
    } else {
      if (rotationQueue.length > 0) {
        this.startAnimation(rotationQueue[0]);
      }
    }

    renderer.render(scene, camera);
  }

  public cleanUp(): void {
    this.renderer.dispose();
    this.stats.end();
    if (import.meta.env.DEV && this.stats.dom.parentElement) {
      this.stats.dom.parentElement.removeChild(this.stats.dom);
    }
  }
}

/**
 * This function creates a single three.js cube object for each
 * cubelet. The three colors are applied with the default orientation
 * of +x, +y, +z.
 * @param size - The side length of the cube
 * @param color - A map of colors for each side. If no color is provided,
 * defaults to black (i.e. blank).
 */
function createCubePiece(colors: CubePieceColors, size: number = 1) {
  // Create a cube with the correct dimensions
  const geometry = new THREE.BoxGeometry(size, size, size);

  // Draw the sides - reuse the same black material for all 6 faces
  const materials = [
    colors.posX ? getStickerFace(colors.posX) : BLACK_MESH,
    colors.negX ? getStickerFace(colors.negX) : BLACK_MESH,
    colors.posY ? getStickerFace(colors.posY) : BLACK_MESH,
    colors.negY ? getStickerFace(colors.negY) : BLACK_MESH,
    colors.posZ ? getStickerFace(colors.posZ) : BLACK_MESH,
    colors.negZ ? getStickerFace(colors.negZ) : BLACK_MESH,
  ];

  return new THREE.Mesh(geometry, materials);
}
