const sanitizeHtml = require('sanitize-html');

const SANITIZE_OPTIONS = {
  allowedTags: ['style', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
    'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div', 'span',
    'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'br', 'hr'],
  allowedAttributes: {
    table: ['style', 'class', 'id'],
    th: ['style', 'class', 'colspan', 'data-e2e-type'],
    thead: ['class'],
    td: ['style', 'class', 'colspan', 'data-e2e-type'],
    style: ['type'],
    hr: ['class'],
    img: ['src'],
    div: ['class', 'id', 'data-e2e-type', 'style'],
    li: ['class', 'data-e2e-type'],
    ul: ['class'],
    span: ['style', 'class'],
    p: ['style', 'class'],
    h1: ['style', 'class'],
    h2: ['style', 'class'],
    h3: ['style', 'class'],
    h4: ['style', 'class'],
    h5: ['style', 'class'],
    h6: ['style', 'class'],
    pre: ['style', 'class'],
    a: ['href', 'rel', 'target', 'class'],
  },
  transformTags: {
    a: (tagName, attribs) => {
      // add noopener noreferrer to anchors
      const newAttribs = Object.assign({}, attribs, { rel: 'noopener noreferrer' });
      return {
        tagName: tagName,
        attribs: newAttribs,
      };
    },
  },
};
const sanitizeHTML = (html, options = SANITIZE_OPTIONS) => sanitizeHtml(html, options);

module.exports = {
  sanitizeHTML,
};
