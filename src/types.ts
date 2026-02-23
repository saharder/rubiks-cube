// The list of colors on a rubiks cube. These include the
// sticker colors and the underlying color. These are used
// to key any maps we have based on color, so we can refer
// to colors by their names as opposed to hex values.
export type RubiksColors =
  | "red"
  | "green"
  | "blue"
  | "yellow"
  | "orange"
  | "white";

/**
 * This is the set of directions that the cube's faces face.
 * There is positive and negative x, y, and z directions,
 * since the cube is drawn parallel to the axes.
 */
export type FaceDirections =
  | "posX"
  | "negX"
  | "posY"
  | "negY"
  | "posZ"
  | "negZ";

/**
 * This is a type used to describe what parts of a cube piece
 * should have which colors. We use Partial since we don't
 * need all colors to be specified, since only some of the sides of
 * the cube are colored.
 */
export type CubePieceColors = Partial<Record<FaceDirections, RubiksColors>>;

/**
 * Event detail for the rubiks-cube-rotate custom event.
 * Contains either a single face or an array of faces to rotate,
 * along with the cube ID to target.
 */
export interface RubiksCubeRotateEventDetail {
  cubeId: string;
  face?: FaceDirections;
  faces?: FaceDirections[];
}

/**
 * Event detail for the rubiks-cube-reset custom event.
 * Contains the cube ID to target for reset.
 */
export interface RubiksCubeResetEventDetail {
  cubeId: string;
}

/**
 * Custom event type for cube rotation
 */
export type RubiksCubeRotateEvent = CustomEvent<RubiksCubeRotateEventDetail>;

/**
 * Custom event type for cube reset
 */
export type RubiksCubeResetEvent = CustomEvent<RubiksCubeResetEventDetail>;

/**
 * Augment the WindowEventMap to include our custom events
 */
declare global {
  interface WindowEventMap {
    "rubiks-cube-rotate": RubiksCubeRotateEvent;
    "rubiks-cube-reset": RubiksCubeResetEvent;
  }
}
