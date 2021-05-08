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
    this.addTimeLeftBlock();

    // Hints
    this.addHintsUsedBlock();
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.statusInfo;
  }

  /**
   * Add the block for time left info.
   */
  addTimeLeftBlock() {
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
  }

  /**
   * Add the block for hints used info.
   */
  addHintsUsedBlock() {
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
   * Set hints used.
   * @param {number|string} seconds Number of seconds left or message.
   */
  setTimeLeft(time) {
    this.statusTime.classList.remove('hidden');
    this.statusTextTime.innerHTML = typeof time === 'number' ? Util.formatTime(time) : time;
  }

  /**
   * Set hints used.
   * @param {number} hints Number of hints used.
   */
  setHintsUsed(hints) {
    this.statusHint.classList.remove('hidden');
    this.statusTextHint.innerHTML = hints;
  }
}
