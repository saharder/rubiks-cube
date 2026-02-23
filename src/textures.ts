import * as THREE from "three";
import type { RubiksColors } from "./types";
import { FACE_COLORS_HEX } from "./constants";

// A map from colors to a colored mesh of the rubiks cube sticker. We define
// this once and reuse the sticker faces across the cube.
let _stickerFaces: Record<RubiksColors, THREE.MeshBasicMaterial> | null = null;

/**
 * Getter for the colored sticker face meshes. We lazily initialize this
 * since we don't want to initialize it during server side rendering (since
 * it requires a canvas element for createStickerTexture).
 * @param color
 * @returns
 */
export function getStickerFace(color: RubiksColors): THREE.MeshBasicMaterial {
  if (!_stickerFaces) {
    _stickerFaces = Object.fromEntries(
      Object.entries(FACE_COLORS_HEX).map(([color, hexColor]) => [
        color,
        createStickerMaterial(hexColor),
      ])
    ) as Record<RubiksColors, THREE.MeshBasicMaterial>;
  }
  return _stickerFaces[color];
}

/**
 * createStickerTexture creates a THREE.CanvasTexture object that
 * looks like the face of a rubiks cube piece with a sticker on it.
 * @param stickerColor - The color of the sticker
 * @param background - The color of the underlying face. Defaults to black.
 * @param size - The number of pixels of each side.
 * This will show at the edges of the piece.
 */
function createStickerMaterial(stickerColor: string, size: number = 150) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // Create a square canvas with background color fill
  canvas.width = canvas.height = size;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, size, size);

  const padding = 10;
  const sideLength = size - 2 * padding;

  drawSticker(
    stickerColor,
    sideLength,
    4,
    new THREE.Vector2(padding, padding),
    ctx
  );

  return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) });
}

/**
 * Draws a square that has its upper left corner at the origin (assuming
 * the standard canvas layout.)
 * @param fill - Fill color for the square
 * @param sideLength - Length of each side of the square
 * @param cornerRadius - Radius of the rounded corners
 * @param ctx - Canvas rendering context
 */
function drawSticker(
  fill: string,
  sideLength: number,
  cornerRadius: number,
  anchor: THREE.Vector2,
  ctx: CanvasRenderingContext2D
) {
  // Save off the context since we're going to translate
  // the square and don't want to affect other drawings.
  ctx.save();
  ctx.translate(anchor.x, anchor.y);

  const r = cornerRadius;
  const s = sideLength;

  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(s - r, 0);
  ctx.arcTo(s, 0, s, r, r);
  ctx.lineTo(s, s - r);
  ctx.arcTo(s, s, s - r, s, r);
  ctx.lineTo(r, s);
  ctx.arcTo(0, s, 0, s - r, r);
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
