import checkArguments from './checkArguments.js';
import { get, set } from './references.js';

const canvas = document.querySelector('canvas');
const textArea = document.querySelector('textarea');

/** @param {number} panX */
/** @param {number} panY */
/** @param {number} zoom */
export default function render(panX, panY, zoom) {
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);

  let cursorX = 0;
  let cursorY = 0;
  context.moveTo(panX, panY);

  const hints = [];
  const lines = textArea.value.split('\n').map(line => line.trim());
  next: for (const line of lines) {
    // Skip commented out or empty lines but push a hint to keep 1:1 with lines
    if (line === '' || line.startsWith('//')) {
      hints.push('');
      continue;
    }

    const [command, ...args] = line.split(' ').map(part => part.trim());
    switch (command) {
      case 'reference': case 'ref': {
        const { hint, values: { url, x, y } } = checkArguments(args, [
          { name: 'url', type: 'string' }
        ], [
          { name: 'x', type: 'number', default: 0 },
          { name: 'y', type: 'number', default: 0 }
        ]);

        if (hint) {
          hints.push(hint);
          break next;
        }

        const { miss, status, img } = get(url);
        if (miss) {
          hints.push('downloading…');
          set(url);
        }
        else {
          hints.push(status);
          if (img) {
            context.drawImage(img, panX + x * zoom, panY + y * zoom, img.naturalWidth * zoom, img.naturalHeight * zoom);
          }
        }

        break;
      }
      case 'horizontal-line': case 'h': case 'x': {
        const { hint, values: { x } } = checkArguments(args, [
          { name: 'x', type: 'number' }
        ]);

        if (hint) {
          hints.push(hint);
          break next;
        }

        cursorX += x;
        context.lineTo(panX + cursorX * zoom, panY + cursorY * zoom);
        hints.push(`${cursorX}×${cursorY}`);
        break;
      }
      case 'vertical-line': case 'v': case 'y': {
        const { hint, values: { y } } = checkArguments(args, [
          { name: 'y', type: 'number' }
        ]);

        if (hint) {
          hints.push(hint);
          break next;
        }

        cursorY += y;
        context.lineTo(panX + cursorX * zoom, panY + cursorY * zoom);
        hints.push(`${cursorX}×${cursorY}`);
        break;
      }
      case 'line': case 'l': {
        const { hint, values: { x, y } } = checkArguments(args, [
          { name: 'x', type: 'number' },
          { name: 'y', type: 'number' }
        ]);

        if (hint) {
          hints.push(hint);
          break next;
        }

        cursorX += x;
        cursorY += y;
        context.lineTo(panX + cursorX * zoom, panY + cursorY * zoom);
        hints.push(`${cursorX}×${cursorY}`);
        break;
      }
      case 'arc': case 'a': {
        const { hint, values: { x, y, radius, flip } } = checkArguments(args, [
          { name: 'x', type: 'number' },
          { name: 'y', type: 'number' },
          { name: 'radius', type: 'number' }
        ], [
          { name: 'flip', type: 'boolean' }
        ]);

        if (hint) {
          hints.push(hint);
          break next;
        }

        // TODO: Implement as per https://stackoverflow.com/a/58824801/2715716
        // TODO: Figure out how to translate to https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/arcTo
        const shiftX = radius * Math.sign(x * (flip ? 1 : -1));
        const shiftY = radius * Math.sign(y * (flip ? 1 : -1));
        const controlX = panX + (cursorX + (x / 2) + shiftX) * zoom;
        const controlY = panY + (cursorY + (y / 2) - shiftY) * zoom;
        context.fillText('. control', controlX, controlY);

        cursorX += x;
        cursorY += y;

        context.quadraticCurveTo(controlX, controlY, panX + cursorX * zoom, panY + cursorY * zoom);
        hints.push(`${cursorX}×${cursorY}`);
        break;
      }
      default: {
        hints.push(`unknown command '${command}'`);
      }
    }
  }

  context.stroke();
  return hints;
}
