const textArea = document.querySelector('textarea');

const references = {};

export function get(name) {
  if (references[name]) {
    return references[name];
  }

  return { miss: true };
}

/** @param {string} url */
/** @param {string} name */
export function set(url, name) {
  const img = document.createElement('img');
  img.src = url;

  img.addEventListener('load', () => {
    const metadata = `${img.naturalWidth}×${img.naturalHeight}`;
    references[name ?? url] = { status: 'downloaded, ' + metadata, img };
    textArea.dispatchEvent(new Event('input'));
    references[name ?? url] = { status: 'cached, ' + metadata, img };
  });

  img.addEventListener('error', () => {
    references[name ?? url] = { status: 'failed to download' };
    textArea.dispatchEvent(new Event('input'));
  });
}
