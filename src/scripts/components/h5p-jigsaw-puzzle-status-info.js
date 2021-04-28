// Import required classes
import Util from './../h5p-jigsaw-puzzle-util';

import './h5p-jigsaw-puzzle-status-info.scss';

/** Class representing the content */
export default class JiggsawPuzzleStatusInfo {
  /**
   * @constructor
   *
   * @param {object} params Parameter from editor.
   */
  constructor(params = {}) {
    // Set missing params
    this.params = Util.extend({
      l10n: {
        timeLeft: 'Time left:',
        hintsUsed: 'Hints used:'
      },
      timeLeft: false,
      hintsUsed: 0
    }, params);

    this.statusInfo = document.createElement('div');
    this.statusInfo.classList.add('h5p-jigsaw-puzzle-status-info');

    // Time left
    this.statusTime = document.createElement('div');
    this.statusTime.classList.add('h5p-jigsaw-puzzle-status');
    this.statusTime.classList.add('hidden');

    const statusIconTime = document.createElement('div');
    statusIconTime.classList.add('h5p-jigsaw-puzzle-status-icon');
    statusIconTime.classList.add('h5p-jigsaw-puzzle-status-icon-time');
    this.statusTime.appendChild(statusIconTime);

    this.statusTextTime = document.createElement('div');
    this.statusTime.appendChild(this.statusTextTime);

    this.statusInfo.appendChild(this.statusTime);

    // Hints
    this.statusHint = document.createElement('div');
    this.statusHint.classList.add('h5p-jigsaw-puzzle-status');
    this.statusHint.classList.add('hidden');

    const statusIconHint = document.createElement('div');
    statusIconHint.classList.add('h5p-jigsaw-puzzle-status-icon');
    statusIconHint.classList.add('h5p-jigsaw-puzzle-status-icon-hint');
    this.statusHint.appendChild(statusIconHint);

    this.statusTextHint = document.createElement('div');
    this.statusHint.appendChild(this.statusTextHint);

    this.statusInfo.appendChild(this.statusHint);
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.statusInfo;
  }

  /**
   * Set hints used.
   * @param {number|string} seconds Number of seconds left or message.
   */
  setTimeLeft(time) {
    this.statusTime.classList.remove('hidden');
    this.statusTextTime.innerHTML = typeof time === 'number' ? this.formatTime(time) : time;
  }

  /**
   * Set hints used.
   * @param {number} hints Number of hints used.
   */
  setHintsUsed(hints) {
    this.statusHint.classList.remove('hidden');
    this.statusTextHint.innerHTML = hints;
  }

  /**
   * Format time.
   * @param {number} time Time in seconds.
   * @return {string} Time formatted.
   */
  formatTime(time) {
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
}
