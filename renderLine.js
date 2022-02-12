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
export default function renderLine(args, cursor, context, panX, panY, zoom, render) {
  const { hint, values: { x, y } } = checkArguments(args, [
    { name: 'x', type: 'number' },
    { name: 'y', type: 'number' }
  ]);

  if (hint) {
    return hint;
  }

  cursor.x += x;
  cursor.y += y;
  context.lineTo(panX + cursor.x * zoom, panY + cursor.y * zoom);
  return `${cursor.x}×${cursor.y}`;
}
