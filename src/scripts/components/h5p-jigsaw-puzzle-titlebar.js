// Import required classes
import JiggsawPuzzleButton from './h5p-jigsaw-puzzle-button';
import JiggsawPuzzleStatusInfo from './h5p-jigsaw-puzzle-status-info';
import Util from './../h5p-jigsaw-puzzle-util';

import './h5p-jigsaw-puzzle-titlebar.scss';

/** Class representing the content */
export default class JiggsawPuzzleTitlebar {
  /**
   * @constructor
   *
   * @param {object} params Parameter from editor.
   * @param {string} params.title Title.
   * @param {string} params.dateString Date.
   * @param {object} params.a11y Accessibility strings.
   * @param {string} params.a11y.buttonToggleActive Text for inactive button.
   * @param {string} params.a11y.buttonToggleInactive Text for inactive button.
   * @param {object} callbacks Callbacks.
   * @param {function} callbacks.handlebuttonToggle Handles click.
   */
  constructor(params = {}, callbacks = {}) {
    // Set missing params
    this.params = Util.extend({
      a11y: {
        buttonFullscreenEnter: 'Enter fullscreen mode',
        buttonFullscreenExit: 'Exit fullscreen mode',
        buttonAudioMute: 'Mute background music',
        buttonAudioUnmute: 'Unmute background music'
      }
    }, params);

    // Set missing callbacks
    this.callbacks = Util.extend({
      onButtonFullscreenClicked: () => {
        console.warn('A function for handling the fullscreen button is missing.');
      },
      onButtonAudioClicked: () => {
        console.warn('A function for handling the audio button is missing.');
      }
    }, callbacks);

    this.titleBar = document.createElement('div');
    this.titleBar.classList.add('h5p-jigsaw-puzzle-title-bar');

    this.statusInfo = new JiggsawPuzzleStatusInfo();
    this.titleBar.appendChild(this.statusInfo.getDOM());

    // Audio button
    this.buttonAudio = new JiggsawPuzzleButton(
      {
        type: 'toggle',
        classes: [
          'h5p-jigsaw-puzzle-button',
          'h5p-jigsaw-puzzle-button-audio'
        ],
        disabled: true,
        a11y: {
          active: this.params.a11y.buttonAudioMute,
          inactive: this.params.a11y.buttonAudioUnmute
        }
      },
      {
        onClick: ((event) => {
          this.callbacks.onButtonAudioClicked(event);
        })
      }
    );
    this.titleBar.appendChild(this.buttonAudio.getDOM());

    // Fullscreen button
    this.buttonFullscreen = new JiggsawPuzzleButton(
      {
        type: 'toggle',
        classes: [
          'h5p-jigsaw-puzzle-button',
          'h5p-jigsaw-puzzle-button-fullscreen'
        ],
        disabled: true,
        a11y: {
          active: this.params.a11y.buttonFullscreenExit,
          inactive: this.params.a11y.buttonFullscreenEnter
        }
      },
      {
        onClick: (() => {
          this.callbacks.onButtonFullscreenClicked();
        })
      }
    );
    this.titleBar.appendChild(this.buttonFullscreen.getDOM());
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.titleBar;
  }

  /**
   * Set number of hints used.
   * @param {number} hintsUsed Number of hints used.
   */
  setHintsUsed(hintsUsed) {
    this.statusInfo.setHintsUsed(hintsUsed);
  }

  /**
   * Set time left.
   * @param {number} time Time left in seconds.
   */
  setTimeLeft(time) {
    this.statusInfo.setTimeLeft(time);
  }

  /**
   * Enable fullscreen button.
   */
  enableFullscreenButton() {
    this.buttonFullscreen.enable();
  }

  /**
   * Enable audio button.
   */
  enableAudioButton() {
    this.buttonAudio.enable();
  }

  /**
   * Get audio button state.
   * @return {boolean} True if audio button is active.
   */
  getAudioButtonState() {
    return this.buttonAudio.isActive();
  }

  /**
   * Set fullscreen button state.
   * @param {string|boolean} state enter|false for enter, exit|true for exit.
   */
  toggleFullscreenButton(state) {
    if (typeof state === 'string') {
      if (state === 'enter') {
        state = false;
      }
      else if (state === 'exit') {
        state = true;
      }
    }

    if (typeof state === 'boolean') {
      this.buttonFullscreen.toggle(state);
    }
  }

  /**
   * Set audio button state.
   * @param {string|boolean} state mute|false for mute, unmute|true for unmute.
   */
  toggleAudioButton(state) {
    if (typeof state === 'string') {
      if (state === 'mute') {
        state = false;
      }
      else if (state === 'unmute') {
        state = true;
      }
    }

    if (typeof state === 'boolean') {
      this.buttonAudio.toggle(state);
    }
  }
}
