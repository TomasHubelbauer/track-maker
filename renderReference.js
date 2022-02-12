import checkArguments from './checkArguments.js';
import { get, set } from './references.js';

/**
 * @param {string[]} args 
 * @param {{ x: number; y: number; }} cursor 
 * @param {CanvasRenderingContext2D} context
 * @param {number} panX 
 * @param {number} panY 
 * @param {number} zoom 
 * @param {(hint: boolean) => void} render 
 */
export default function renderReference(args, cursor, context, panX, panY, zoom, render) {
  const { hint, values: { url, x, y } } = checkArguments(args, [
    { name: 'url', type: 'string' }
  ], [
    { name: 'x', type: 'number', default: 0 },
    { name: 'y', type: 'number', default: 0 }
  ]);

  if (hint) {
    return hint;
  }

  const { miss, status, img } = get(url);
  if (miss) {
    set(url, url, () => render(true));
    return 'downloading…';
  }

  if (img) {
    context.drawImage(img, panX + x * zoom, panY + y * zoom, img.naturalWidth * zoom, img.naturalHeight * zoom);
  }

  return status;
}
