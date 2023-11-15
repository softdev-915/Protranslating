/**
 * isElementVisible checks if an element is visible
 * @param {DOMElement} elem - Element to check visibility.
 * @returns {boolean} true if it is visible, otherwise false.
 */
const isElementVisible = (elem) => {
  const width = elem.offsetWidth;
  const height = elem.offsetHeight;
  // TODO: check if getComputedStyle should be replaced by
  // currentStyle property in IE
  return (width === 0 && height === 0)
    || ((elem.style && elem.style.display) || window.getComputedStyle(elem).display === 'none');
};

/**
 * getResponsiveBreakpoint detects the current viewport
 * @returns {string} returns the current bootstrap viewport.
 */
const getResponsiveBreakpoint = () => {
  const envs = ['xs', 'sm', 'md', 'lg'];
  const element = document.createElement('div');
  const body = document.getElementsByTagName('body')[0];
  body.appendChild(element);
  let env;
  for (let i = envs.length - 1; i >= 0; i--) {
    env = envs[i];
    element.className = `hidden-${env}-up`;
    if (isElementVisible(element)) {
      break; // env detected
    }
  }
  try {
    element.remove();
  } catch (e) {
    // guess which browser does not support element.remove()
    // IE 11 of course.
    element.removeNode();
  }
  return env;
};

export default getResponsiveBreakpoint;
