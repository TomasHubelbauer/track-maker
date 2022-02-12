import renderHints from './renderHints.js';
import renderHorizontalLine from './renderHorizontalLine.js';
import renderVerticalLine from './renderVerticalLine.js';
import renderLine from './renderLine.js';
import renderArc from './renderArc.js';
import renderReference from './renderReference.js';

/** @type {{ [name: string]: (args: string[], cursor: { x: number; y: number; }, context: CanvasRenderingContext2D, panX: number, panY: number, zoom: number, render: (hint: boolean) => void) => string; }} */
const commands = {
  x: renderHorizontalLine,
  h: renderHorizontalLine,
  horizontalLine: renderHorizontalLine,
  y: renderVerticalLine,
  v: renderVerticalLine,
  verticalLine: renderVerticalLine,
  l: renderLine,
  line: renderLine,
  a: renderArc,
  arc: renderArc,
  ref: renderReference,
  reference: renderReference,
};

/**
 * @param {number} panX
 * @param {number} panY
 * @param {number} zoom
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLTextAreaElement} textArea
 */
export default function render(panX, panY, zoom, canvas, textArea, hint) {
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);

  const cursor = { x: 0, y: 0 };
  context.moveTo(panX, panY);

  const hints = [];
  const lines = textArea.value.split('\n').map(line => line.trim());
  for (const line of lines) {
    // Skip commented out or empty lines but push a hint to keep 1:1 with lines
    if (line === '' || line.startsWith('//')) {
      hints.push('');
      continue;
    }

    const [command, ...args] = line.split(' ').map(part => part.trim());
    if (!commands[command]) {
      hints.push(`unknown command '${command}'`);
    }
    else {
      hints.push(commands[command](args, cursor, context, panX, panY, zoom, hint => render(panX, panY, zoom, canvas, textArea, hint)));
    }
  }

  context.stroke();
  if (hint) {
    renderHints(hints, textArea);
  }
}
