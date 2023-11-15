
const FIREFOX_COMMAND_KEY = [224];
const OPERA_COMMAND_KEY = [17];
const SAFARI_CHROME_COMMAND_KEY = [91, 93];

export const commandKeyCodes = () => {
  if (window.navigator.appVersion.indexOf('Mac') !== -1) {
    const browser = window.getBrowserVersion(window.navigator.userAgent);
    const browserArray = browser.split(' ');
    const browserName = browserArray[0].toUpperCase();
    switch (browserName) {
      case 'FIREFOX':
        return FIREFOX_COMMAND_KEY;
      case 'OPERA':
        return OPERA_COMMAND_KEY;
      default:
        return SAFARI_CHROME_COMMAND_KEY;
    }
  }
  return [];
};

export const isScrollbarAtBottom = (tag) => {
  const { scrollHeight, scrollTop, clientHeight } = tag;
  const scrollDifference = scrollHeight - (scrollTop + clientHeight);
  return scrollDifference >= -5 && scrollDifference <= 0;
};

/**
 * Converts json object to url parameters string
 * @param {Object} obj JSON object to convert
 */
export const jsonToUrlParam = (obj) => Object.keys(obj)
  .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`).join('&');
