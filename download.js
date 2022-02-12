/** @type {HTMLAnchorElement} */
const saveA = document.querySelector('#saveA');
/** @type {HTMLInputElement} */
const nameInput = document.querySelector('#nameInput');

/** @param {Blob} blob */
/** @param {string} extension */
export default function download(blob, extension) {
  saveA.href = URL.createObjectURL(blob);
  if (nameInput.value !== '') {
    saveA.download = nameInput.value.endsWith('.' + extension) ? nameInput.value : nameInput.value + '.' + extension;
  }
  else {
    saveA.download = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-') + '.' + extension;
  }

  saveA.click();
}
