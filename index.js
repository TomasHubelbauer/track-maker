const canvas = document.querySelector('canvas');
const textArea = document.querySelector('textarea');

// Center the origin within the viewport at startup
let panX = canvas.clientWidth / 2;
let panY = canvas.clientHeight / 2;

canvas.addEventListener('mousemove', event => {
  if (event.buttons !== 1) {
    return;
  }

  panX += event.movementX;
  panY += event.movementY;

  // Discard rendering hints as the source code has not changed by panning
  render();
});

textArea.addEventListener('input', () => {
  localStorage.setItem('code', textArea.value);
  const hints = render();
  renderHints(hints);
});

// Keep the background SVG image with hints in sync with the text area element's
// scroll position. We do this in `renderHints` as well when replacing the image
// URL used as background. This scroll handler is passive because we do not need
// to call `preventDefault` in it and negatively affect performance that way.
textArea.addEventListener('scroll', () => {
  textArea.style.backgroundPositionX = -textArea.scrollLeft + 'px';
  textArea.style.backgroundPositionY = -textArea.scrollTop + 'px';
}, { passive: true });

textArea.value = localStorage.getItem('code');
textArea.placeholder = 'line (l) / horizontal-line (h/x) / vertical-line (v/y) / arc (a)';

// Dispatch `input` event even for initial text recovery so the associated event
// handler runs even on the initial page load.
textArea.dispatchEvent(new Event('input'));

function render() {
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);

  let x = 0;
  let y = 0;
  context.moveTo(panX, panY);

  const hints = [];
  const lines = textArea.value.split('\n');
  next: for (const line of lines) {
    const [command, ...args] = line.trim().split(' ');
    switch (command) {
      // Skip over empty lines but still push empty hint to preserve 1:1 link
      case '': {
        hints.push('');
        break;
      }
      case '//': {
        hints.push('skipped');
        break;
      }

      case 'horizontal-line': case 'h': case 'x': {
        const error = checkArguments(args, 'x');
        if (error) {
          hints.push(error);
          break next;
        }

        x += +args[0];
        context.lineTo(panX + x, panY + y);
        hints.push(`${x}×${y}`);
        break;
      }
      case 'vertical-line': case 'v': case 'y': {
        const error = checkArguments(args, 'y');
        if (error) {
          hints.push(error);
          break next;
        }

        y += +args[0];
        context.lineTo(panX + x, panY + y);
        hints.push(`${x}×${y}`);
        break;
      }
      case 'line': case 'l': {
        const error = checkArguments(args, 'x', 'y');
        if (error) {
          hints.push(error);
          break next;
        }

        x += +args[0];
        y += +args[1];
        context.lineTo(panX + x, panY + y);
        hints.push(`${x}×${y}`);
        break;
      }
      case 'arc': case 'a': {
        const error = checkArguments(args, 'x', 'y', 'radius', 'flip');
        if (error) {
          hints.push(error);
          break next;
        }

        // TODO: Implement as per https://stackoverflow.com/a/58824801/2715716
        // TODO: Figure out how to translate to https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/arcTo
        const shiftX = +args[2] * Math.sign(+args[0] * (args[3] === 'true' ? 1 : -1));
        const shiftY = +args[2] * Math.sign(+args[1] * (args[3] === 'true' ? 1 : -1));
        const controlX = panX + x + (+args[0] / 2) + shiftX;
        const controlY = panY + y + (+args[1] / 2) - shiftY;
        context.fillText('. control', controlX, controlY);

        x += +args[0];
        y += +args[1];

        context.quadraticCurveTo(controlX, controlY, panX + x, panY + y);
        hints.push(`${x}×${y}`);
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

// Note that `gap` is the space between two lines of text and the text is placed
// in the middle of the line, so each line of text is surrounded by two measures
// of half of the gap, one at the top and one at the bottom. This means that the
// first line of the text in the text area is padded by the top padding but also
// the half of the line gap. When placing the hint lines directly below the text
// line in relationship to the line height, we need to calculate half of the gap
// to get to the top line of the text and then add two measures of the height of
// the line, one to skip over the actual line of text and another to specify the
// bottom line of the SVG text line, because in SVG the `text` element attribute
// `y` refers to the baseline of the text, not the ascent line.
//
// Note that while we could directly pass the SVG into the background URL in the
// form of a data URI, that looks ugly in the Elements pane. Instead, a blob can
// be used to give a blob URI to use in the CSS background URL. Care needs to be
// take to revoke the URL each time we are replacing it if there already was one
// in order to avoid memory leaks.
//
/** @param {string[]} hints */
function renderHints(hints) {
  const style = getComputedStyle(textArea);
  const { font, paddingLeft, paddingTop, fontSize, lineHeight, backgroundImage } = style;
  const text = +fontSize.slice(0, -'px'.length);
  const line = +lineHeight.slice(0, -'px'.length);
  const gap = line - text;
  const x = +paddingLeft.slice(0, -'px'.length);
  let y = +paddingTop.slice(0, -'px'.length) + (gap / 2) + text * 2;
  let svg = `<svg width="${textArea.scrollWidth}" height="${textArea.scrollHeight}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<style>text { fill: silver; font: ${font}; }</style>`;

  for (const hint of hints) {
    svg += `<text x="${x}" y="${y}">${hint}</text>`;
    y += line;
  }

  svg += '</svg>';

  let url = backgroundImage.slice('url('.length, -')'.length);
  if (url) {
    URL.revokeObjectURL(url);
  }

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  url = URL.createObjectURL(blob);

  textArea.style.background = `url('${url}') ${-textArea.scrollLeft + 'px'} ${-textArea.scrollTop + 'px'} no-repeat`;
}

/** @param {string[]} args */
/** @param {string[]} names */
function checkArguments(args, ...names) {
  if (names.length === args.length) {
    return;
  }

  if (args.length > names.length) {
    return (args.length - names.length) + ' too many arguments';
  }

  return 'argument needed: ' + names[args.length];
}
