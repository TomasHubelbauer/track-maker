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
/**
 * @param {string[]} hints
 * @param {HTMLTextAreaElement} textArea
 */
export default function renderHints(hints, textArea) {
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
