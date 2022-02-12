import checkArguments from './checkArguments.js';

/**
 * @param {string[]} args 
 * @param {{ x: number; y: number; }} cursor 
 * @param {CanvasRenderingContext2D} context
 * @param {number} panX 
 * @param {number} panY 
 * @param {number} zoom 
 * @param {(hint: boolean) => void} render 
 */
export default function renderQuadraticCurve(args, cursor, context, panX, panY, zoom, render) {
  const { hint, values: { x, y, radius, flip } } = checkArguments(args, [
    { name: 'x', type: 'number' },
    { name: 'y', type: 'number' },
    { name: 'radius', type: 'number' }
  ], [
    { name: 'flip', type: 'boolean' }
  ]);

  if (hint) {
    return hint;
  }

  // TODO: Implement as per https://stackoverflow.com/a/58824801/2715716
  // TODO: Figure out how to translate to https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/arcTo
  const shiftX = radius * Math.sign(x * (flip ? 1 : -1));
  const shiftY = radius * Math.sign(y * (flip ? 1 : -1));
  const controlX = panX + (cursor.x + (x / 2) + shiftX) * zoom;
  const controlY = panY + (cursor.y + (y / 2) - shiftY) * zoom;
  context.fillText('. control', controlX, controlY);

  cursor.x += x;
  cursor.y += y;

  context.arcTo(controlX, controlY, panX + cursor.x * zoom, panY + cursor.y * zoom, radius);
  return `${cursor.x}×${cursor.y}`;
}
