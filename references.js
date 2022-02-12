const references = {};

/**
 * @param {string} name
 */
export function get(name) {
  if (references[name]) {
    return references[name];
  }

  return { miss: true };
}

/**
 * @param {string} url
 * @param {string} name
 * @param {() => void} render
 */
export function set(url, name, render) {
  const img = document.createElement('img');
  img.src = url;

  img.addEventListener('load', () => {
    const metadata = `${img.naturalWidth}×${img.naturalHeight}`;
    references[name] = { status: 'downloaded, ' + metadata, img };
    render();
    references[name] = { status: 'cached, ' + metadata, img };
  });

  img.addEventListener('error', () => {
    references[name] = { status: 'failed to download' };
    render();
  });
}
