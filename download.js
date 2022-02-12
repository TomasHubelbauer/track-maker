/**
 * @param {Blob} blob
 * @param {string} extension
 * @param {HTMLAnchorElement} downloadA
 * @param {HTMLInputElement} nameInput
 */
export default function download(blob, extension, downloadA, nameInput) {
  downloadA.href = URL.createObjectURL(blob);
  if (nameInput.value !== '') {
    downloadA.download = nameInput.value.endsWith('.' + extension) ? nameInput.value : nameInput.value + '.' + extension;
  }
  else {
    downloadA.download = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-') + '.' + extension;
  }

  downloadA.click();
}
