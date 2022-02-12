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
export default function renderHorizontalLine(args, cursor, context, panX, panY, zoom, render) {
  const { hint, values: { x } } = checkArguments(args, [
    { name: 'x', type: 'number' }
  ]);

  if (hint) {
    return hint;
  }

  cursor.x += x;
  context.lineTo(panX + cursor.x * zoom, panY + cursor.y * zoom);
  return `${cursor.x}×${cursor.y}`;
}
