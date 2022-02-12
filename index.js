/** @type {HTMLInputElement} */
const fileInput = document.querySelector('#fileInput');
/** @type {HTMLInputElement} */
const referenceInput = document.querySelector('#referenceInput');
/** @type {HTMLAnchorElement} */
const saveA = document.querySelector('#saveA');
/** @type {HTMLButtonElement} */
const openButton = document.querySelector('#openButton');
/** @type {HTMLButtonElement} */
const saveButton = document.querySelector('#saveButton');
/** @type {HTMLButtonElement} */
const generateOpenScadButton = document.querySelector('#generateOpenScadButton');
/** @type {HTMLButtonElement} */
const generateGCodeButton = document.querySelector('#generateGCodeButton');
/** @type {HTMLButtonElement} */
const exportButton = document.querySelector('#exportButton');
/** @type {HTMLButtonElement} */
const renderButton = document.querySelector('#renderButton');
/** @type {HTMLButtonElement} */
const referenceButton = document.querySelector('#referenceButton');
/** @type {HTMLInputElement} */
const nameInput = document.querySelector('#nameInput');
const canvas = document.querySelector('canvas');
const textArea = document.querySelector('textarea');
/** @type {HTMLDivElement} */
const zoomDiv = document.querySelector('#zoomDiv');
/** @type {HTMLDivElement} */
const coordsDiv = document.querySelector('#coordsDiv');

const cache = {};

// Center the origin within the viewport at startup (coerce to whole numbers)
let panX = ~~(canvas.clientWidth / 2);
let panY = ~~(canvas.clientHeight / 2);

let zoom = 1;

fileInput.addEventListener('change', async () => {
  if (fileInput.files.length === 0) {
    return;
  }

  if (fileInput.files.length > 1) {
    alert('Too many files have been selected. Please select only one.');
    return;
  }

  const file = fileInput.files[0];
  nameInput.value = file.name.endsWith('.thtm') ? file.name.slice(0, -'.thtm'.length) : file.name;
  textArea.value = await file.text();
  textArea.dispatchEvent(new Event('input'));
});

referenceInput.addEventListener('change', () => {
  if (referenceInput.files.length === 0) {
    return;
  }

  if (referenceInput.files.length > 1) {
    alert('Too many files have been selected. Please select only one.');
    return;
  }

  const file = referenceInput.files[0];
  const url = URL.createObjectURL(file);
  cacheReference(url, file.name);

  textArea.value = `reference ${file.name} 0 0\n` + textArea.value;
});

saveA.addEventListener('click', () => {
  // Free memory occupied by the blob, but only after it has been downloaded
  // Note that the setTimeout is required as freeing immediately would prevent
  // the browser (Firefox, at least) from offering the file fow download as it
  // would have been free'd already by the time the browser downloader attempted
  // to fetch it.
  window.setTimeout(() => URL.revokeObjectURL(saveA.href), 0);
});

openButton.addEventListener('click', () => fileInput.click());

saveButton.addEventListener('click', () => {
  const blob = new Blob([textArea.value], { type: 'text/plain' });
  download(blob, 'thtm');
});

generateOpenScadButton.addEventListener('click', () => {
  alert('OpenSCAD export is not implemented yet.');
});

generateGCodeButton.addEventListener('click', () => {
  alert('GCode export is not implemented yet.');
});

exportButton.addEventListener('click', () => {
  alert('STL export is not implemented yet.');
});

renderButton.addEventListener('click', () => {
  try {
    canvas.toBlob(blob => download(blob, 'png'));
  }
  catch (error) {
    alert('Problem exporting. Sketches with URL references cannot currently be exported to an image due to CORS.');
  }
});

referenceButton.addEventListener('click', () => referenceInput.click());

canvas.addEventListener('mousemove', event => {
  coordsDiv.textContent = `${event.offsetX - panX}×${event.offsetY - panY}`;

  if (event.buttons !== 1) {
    return;
  }

  panX += event.movementX;
  panY += event.movementY;

  // Discard rendering hints as the source code has not changed by panning
  render();
});

canvas.addEventListener('mouseleave', () => coordsDiv.textContent = '0×0');
canvas.addEventListener('wheel', event => {
  // Prevent the whole page from zooming in and out or scrolling if scrollable
  event.preventDefault();

  // Handle pinch-to-zoom on the touch pad which presents as wheel+the Ctrl key
  if (event.ctrlKey) {
    // Reverse the sign of the delta as in this case it seems to be opposite…
    zoom += -event.deltaY / 100;
  }
  else {
    zoom += event.deltaY / 100;
  }

  // Prevent negative zoom as it results in flipping the sketch around
  if (zoom < 0) {
    zoom = 0;
  }

  // Display the current zoom level in the status bar
  zoomDiv.textContent = ~~(zoom * 100) + ' %';

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

zoomDiv.addEventListener('click', () => {
  zoom = 1;

  // Display the current zoom level in the status bar
  zoomDiv.textContent = ~~(zoom * 100) + ' %';

  // Discard rendering hints as the source code has not changed by panning
  render();
});

coordsDiv.addEventListener('click', () => {
  // Center the origin within the viewport at startup (coerce to whole numbers)
  panX = ~~(canvas.clientWidth / 2);
  panY = ~~(canvas.clientHeight / 2);

  // Discard rendering hints as the source code has not changed by panning
  render();
});

// Dispatch `input` event even for initial text recovery so the associated event
// handler runs even on the initial page load.
textArea.dispatchEvent(new Event('input'));

function render() {
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);

  let cursorX = 0;
  let cursorY = 0;
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
      case 'reference': case 'ref': {
        const { hint, values: { url, x, y } } = checkArguments(args, { name: 'url', type: 'string' }, { name: 'x', type: 'number' }, { name: 'y', type: 'number' });
        if (hint) {
          hints.push(hint);
          break next;
        }

        if (cache[url]) {
          const { status, img } = cache[url];
          hints.push(status);
          if (img) {
            context.drawImage(img, panX + x * zoom, panY + y * zoom, img.naturalWidth * zoom, img.naturalHeight * zoom);
          }
        }
        else {
          hints.push('downloading…');
          cacheReference(url);
        }

        break;
      }
      case 'horizontal-line': case 'h': case 'x': {
        const { hint, values: { x } } = checkArguments(args, { name: 'x', type: 'number' });
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
        const { hint, values: { y } } = checkArguments(args, { name: 'y', type: 'number' });
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
        const { hint, values: { x, y } } = checkArguments(args, { name: 'x', type: 'number' }, { name: 'y', type: 'number' });
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
        const { hint, values: { x, y, radius, flip } } = checkArguments(args, { name: 'x', type: 'number' }, { name: 'y', type: 'number' }, { name: 'radius', type: 'number' }, { name: 'flip', type: 'boolean' });
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

/** @param {string} url */
/** @param {string} name */
function cacheReference(url, name) {
  const img = document.createElement('img');
  img.src = url;

  img.addEventListener('load', () => {
    const metadata = `${img.naturalWidth}×${img.naturalHeight}`;
    cache[name ?? url] = { status: 'downloaded, ' + metadata, img };
    textArea.dispatchEvent(new Event('input'));
    cache[name ?? url] = { status: 'cached, ' + metadata, img };
  });

  img.addEventListener('error', () => {
    cache[name ?? url] = { status: 'failed to download' };
    textArea.dispatchEvent(new Event('input'));
  });
}

/** @param {Blob} blob */
/** @param {string} extension */
function download(blob, extension) {
  saveA.href = URL.createObjectURL(blob);
  if (nameInput.value !== '') {
    saveA.download = nameInput.value.endsWith('.' + extension) ? nameInput.value : nameInput.value + '.' + extension;
  }
  else {
    saveA.download = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-') + '.' + extension;
  }

  saveA.click();
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
/** @param {({ name: string; } & ({ type: 'string'; } | { type: 'number'; } | { type: 'enum'; options: string[]; }))[]} params */
function checkArguments(args, ...params) {
  const values = {};
  const hints = [];

  for (let index = 0; index < params.length; index++) {
    const arg = args[index];
    const param = params[index];

    // Short-circuit in case not all arguments are provided yet, are `undefined`
    if (arg === undefined) {
      hints.push('argument missing: ' + param.name);
      break;
    }

    switch (param.type) {
      // Pass string arguments as-is, no parsing is needed
      case 'string': {
        values[param.name] = arg;
        break;
      }
      // Convert numerical arguments to actual JavaScript numbers
      case 'number': {
        const value = +arg;

        if (Number.isNaN(value)) {
          hints.push(`${param.name}: '${arg}' is not a number`);
        }
        else {
          values[param.name] = value;
        }

        break;
      }
      case 'enum': {
        if (!param.options.includes(arg)) {
          hints.push(`${param.name}: '${arg}' is not in ${param.options}`);
        }
        else {
          values[param.name] = value;
        }

        break;
      }
      case 'boolean': {
        if (arg !== 'true' && arg !== 'false' && arg !== '0' && arg !== '1') {
          hints.push(`${param.name}: '${arg}' is not a boolean (true/false, 1/0)`);
        }
        else {
          values[param.name] = arg === 'true' || arg === '1';
        }

        break;
      }
      default: {
        throw new Error(`Invalid '${param.name}' param type '${param.type}'! Need one of string, number, enum.`);
      }
    }
  }

  if (args.length > params.length) {
    hints.push((args.length - params.length) + ' too many arguments');
  }

  return { hint: hints.join(' | '), values };
}
