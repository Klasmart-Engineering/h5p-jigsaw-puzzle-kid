/** Class for utility functions */
class Util {
  /**
   * Extend an array just like JQuery's extend.
   * @param {object} arguments Objects to be merged.
   * @return {object} Merged objects.
   */
  static extend() {
    for (let i = 1; i < arguments.length; i++) {
      for (let key in arguments[i]) {
        if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
          if (typeof arguments[0][key] === 'object' && typeof arguments[i][key] === 'object') {
            this.extend(arguments[0][key], arguments[i][key]);
          }
          else {
            arguments[0][key] = arguments[i][key];
          }
        }
      }
    }
    return arguments[0];
  }

  /**
   * Retrieve true string from HTML encoded string.
   * @param {string} input Input string.
   * @return {string} Output string.
   */
  static htmlDecode(input) {
    var dparser = new DOMParser().parseFromString(input, 'text/html');
    return dparser.documentElement.textContent;
  }

  /**
   * Retrieve string without HTML tags.
   * @param {string} input Input string.
   * @return {string} Output string.
   */
  static stripHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  /**
   * Format time.
   * @param {number} time Time in seconds.
   * @return {string} Time formatted as hhh:mm:ss.
   */
  static formatTime(time) {
    const segments = [];

    let hours = Math.floor(time / 3600);
    let minutes = Math.floor((time - hours * 3600) / 60);
    let seconds = time - hours * 3600 - minutes * 60;

    if (hours > 0) {
      if (hours < 10) {
        hours = `0${hours}`;
      }
      segments.push(`${hours}`);
    }

    if (minutes < 10) {
      minutes = `0${minutes}`;
    }
    segments.push(`${minutes}`);

    if (seconds < 10) {
      seconds = `0${seconds}`;
    }
    segments.push(`${seconds}`);

    return segments.join(':');
  }

  /**
   * Convert seconds to ISO 8601 time period.
   * @param {number} time Time in seconds >= 0.
   * @return {string || null} ISO 8601 time period or null.
   */
  static toISO8601TimePeriod(time) {
    if (typeof time !== 'number' || time < 0) {
      return null;
    }

    const segments = [];

    let hours = Math.floor(time / 3600);
    let minutes = Math.floor((time - hours * 3600) / 60);
    let seconds = time - hours * 3600 - minutes * 60;

    if (hours > 0) {
      if (hours < 10) {
        hours = `0${hours}`;
      }
      segments.push(`${hours}H`);
    }

    if (minutes > 0 || minutes === 0 && hours > 0) {
      if (minutes < 10) {
        minutes = `0${minutes}`;
      }
      segments.push(`${minutes}M`);
    }

    if (seconds < 10) {
      seconds = `0${seconds}`;
    }
    segments.push(`${seconds}S`);

    return `PT${segments.join('')}`;
  }

  /**
   * Get closest parent node by selector.
   * @param {HTMLElement} node Node.
   * @param {string} selector CSS classname, id or tagname.
   * @return {HTMLElement|null} Closest parent node by selector or null.
   */
  static closestParent(node, selector) {
    if (typeof node !== 'object' || typeof selector !== 'string') {
      return null; // missing or invalid value
    }

    if (!node.parentNode) {
      return null; // no parent left
    }

    if (selector.substr(0, 1) === '.') { // classnames
      const selectors = selector.split('.').filter(selector => selector !== '');
      if (selectors.every(selector => node.parentNode?.classList?.contains(selector))) {
        return node.parentNode;
      }
    }
    else if (selector.substr(0, 1) === '#') { // id
      if (
        typeof node.parentNode.getAttribute === 'function' &&
        node.parentNode.getAttribute('id') === selector.substr(1)
      ) {
        return node.parentNode;
      }
    }
    else if (node.parentNode.tagName.toLowerCase() === selector.toLowerCase()) { // tagname
      return node.parentNode;
    }

    return this.closestParent(node.parentNode, selector);
  }

  /**
   * Shuffle array.
   * @param {object[]} array Array.
   * @return {object[]} Shuffled array.
   */
  static shuffleArray(array) {
    const newArray = [...array]; // Shallow clone

    let j, x, i;
    for (i = newArray.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = newArray[i];
      newArray[i] = newArray[j];
      newArray[j] = x;
    }

    return newArray;
  }

  /**
   * Get relative position from absolute position for reference.
   * @param {object} absolutePosition Absolute position.
   * @param {number} absolutePosition.x Absolute x position.
   * @param {number} absolutePosition.y Absolute y position.
   * @param {HTMLElement} referenceElement Reference element.
   * @return {object} Relative position.
   */
  static getRelativePosition(absolutePosition, referenceElement) {
    if (
      !absolutePosition?.x || !absolutePosition?.y ||
      typeof referenceElement?.getBoundingClientRect !== 'function'
    ) {
      return null;
    }

    const elementSize = referenceElement.getBoundingClientRect();

    return {
      x: absolutePosition.x / elementSize.width,
      y: absolutePosition.y / elementSize.height
    };
  }

  /**
   * Get absolute position from relative position for reference.
   * @param {object} relativePosition Relative position.
   * @param {number} relativePosition.x Relative x position.
   * @param {number} relativePosition.y Relative y position.
   * @param {HTMLElement} referenceElement Reference element.
   * @return {object} Absolute position.
   */
  static getAbsolutePosition(relativePosition, referenceElement) {
    if (
      !relativePosition?.x || !relativePosition?.y ||
      typeof referenceElement?.getBoundingClientRect !== 'function'
    ) {
      return null;
    }

    const elementSize = referenceElement.getBoundingClientRect();

    return {
      x: relativePosition.x * elementSize.width,
      y: relativePosition.y * elementSize.height
    };
  }
}

export default Util;
