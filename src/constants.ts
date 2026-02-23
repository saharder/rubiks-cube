import * as THREE from "three";
import type { FaceDirections, RubiksColors } from "./types";

// Map from the different faces to their colors in the initial solved cube
export const FACE_COLORS_ORIENTATION: Record<FaceDirections, RubiksColors> = {
  posX: "red",
  negX: "orange",
  posY: "white",
  negY: "yellow",
  posZ: "green",
  negZ: "blue",
};

// Map from the color strings to their hex values.
export const FACE_COLORS_HEX: Record<RubiksColors, string> = {
  red: "#b71234",
  green: "#009b48",
  blue: "#0046ad",
  yellow: "#ffd700",
  orange: "#ff5800",
  white: "#ffffff",
};

// Reusable mesh for when we need to render a black side of a cube.
// Having a single mesh saves on performance.
export const BLACK_MESH = new THREE.MeshBasicMaterial({
  color: "#000000",
});

// The quaternions corresponding to the different face rotations in clockwise directions
// We use quaternions so that we can use slerp interpolation
export const FACE_ROTATIONS: Record<FaceDirections, THREE.Quaternion> = {
  posX: new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1, 0, 0),
    -Math.PI / 2
  ),
  negX: new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1, 0, 0),
    Math.PI / 2
  ),
  posY: new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    -Math.PI / 2
  ),
  negY: new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    Math.PI / 2
  ),
  posZ: new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1),
    -Math.PI / 2
  ),
  negZ: new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1),
    Math.PI / 2
  ),
};
