import download from './download.js';
import { set } from './references.js';
import render from './render.js';

/** @type {HTMLInputElement} */
const fileInput = document.querySelector('#fileInput');
/** @type {HTMLInputElement} */
const referenceInput = document.querySelector('#referenceInput');
/** @type {HTMLAnchorElement} */
const downloadA = document.querySelector('#downloadA');
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
  set(url, file.name, paint);

  textArea.value = `reference ${file.name} 0 0\n` + textArea.value;
});

downloadA.addEventListener('click', () => {
  // Free memory occupied by the blob, but only after it has been downloaded
  // Note that the setTimeout is required as freeing immediately would prevent
  // the browser (Firefox, at least) from offering the file fow download as it
  // would have been free'd already by the time the browser downloader attempted
  // to fetch it.
  window.setTimeout(() => URL.revokeObjectURL(downloadA.href), 0);
});

openButton.addEventListener('click', () => fileInput.click());

saveButton.addEventListener('click', () => {
  const blob = new Blob([textArea.value], { type: 'text/plain' });
  download(blob, 'thtm', downloadA, nameInput);
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
    canvas.toBlob(blob => download(blob, 'png', downloadA, nameInput));
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
  paint();
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

  paint();
});

textArea.addEventListener('input', () => {
  localStorage.setItem('code', textArea.value);
  paint(true);
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

  paint();
});

coordsDiv.addEventListener('click', () => {
  // Center the origin within the viewport at startup (coerce to whole numbers)
  panX = ~~(canvas.clientWidth / 2);
  panY = ~~(canvas.clientHeight / 2);

  paint();
});

/**
 * @param {boolean} hints 
 */
function paint(hints) {
  render(panX, panY, zoom, canvas, textArea, hints);
}

paint(true);
