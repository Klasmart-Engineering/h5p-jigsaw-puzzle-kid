// Import required classes
import JigsawPuzzleContent from './h5p-jigsaw-puzzle-content';
import Util from './h5p-jigsaw-puzzle-util';

/**
 * Class holding a full JigsawPuzzle.
 *
 * - Extends H5P.Question which offers functions for setting the DOM
 * - Implements the question type contract necessary for reporting and for
 *   making the content type usable in compound content types like Question Set
 *   Cpm. https://h5p.org/documentation/developers/contracts
 * - Implements getCurrentState to allow continuing a user's previous session
 * - Uses a separate content class to organitze files
 */
export default class JigsawPuzzle extends H5P.Question {
  /**
   * @constructor
   *
   * @param {object} params Parameters passed by the editor.
   * @param {number} contentId Content's id.
   * @param {object} [extras] Saved state, metadata, etc.
   */
  constructor(params, contentId, extras = {}) {
    super('jigsaw-puzzle'); // CSS class selector for content's iframe: h5p-jigsaw-puzzle

    this.params = params;
    this.contentId = contentId;
    this.extras = extras;

    /*
     * this.params.behaviour.enableSolutionsButton and this.params.behaviour.enableRetry
     * are used by H5P's question type contract.
     * @see {@link https://h5p.org/documentation/developers/contracts#guides-header-8}
     * @see {@link https://h5p.org/documentation/developers/contracts#guides-header-9}
     */

    // Make sure all variables are set
    this.params = Util.extend({
      tilesHorizontal: 4,
      tilesVertical: 3,
      behaviour: {
        sortingSpace: 50,
        enableComplete: true,
        enableHint: true,
        enableSolutionsButton: true,
        enableRetry: true,
        showBackground: true
      },
      l10n: {
        complete: 'Complete',
        hint: 'Hint',
        tryAgain: 'Retry'
      },
      a11y: {
        buttonFullscreenEnter: 'Enter fullscreen mode',
        buttonFullscreenExit: 'Exit fullscreen mode',
        buttonAudioMute: 'Mute background music',
        buttonAudioUnmute: 'Unmute background music',
        complete: 'Complete the puzzle. All tiles will be put to their correct position.',
        hint: 'Receive a visual hint to where a puzzle tile needs to go.',
        tryAgain: 'Retry the puzzle. All puzzle tiles will be shuffled on the canvas.',
        disabled: 'Disabled',
        close: 'Close'
      }
    }, this.params);

    // this.previousState now holds the saved content state of the previous session
    this.previousState = this.extras.previousState || {};

    this.uuid = H5P.createUUID();

    // TODO: Sanitizing
    this.puzzleImageInstance = H5P.newRunnable(this.params.puzzleImage, this.contentId);

    // Handle resize from H5P core
    this.on('resize', () => {
      this.handleResize();
    });
  }

  /**
   * Register the DOM elements with H5P.Question
   */
  registerDomElements() {
    this.content = new JigsawPuzzleContent(
      {
        contentId: this.contentId,
        puzzleImageInstance: this.puzzleImageInstance,
        imageFormat: this.params.puzzleImage.params.file.mime,
        uuid: this.uuid,
        size: {
          width: this.params.tilesHorizontal,
          height: this.params.tilesVertical
        },
        sortingSpace: this.params.behaviour.sortingSpace,
        previousState: this.previousState,
        stroke: Math.max(window.innerWidth / 750, 1.75),
        tileBorderColor: 'rgba(88, 88, 88, 0.5)',
        showBackground: this.params.behaviour.showBackground,
        sound: this.params.sound || {},
        timeLimit: this.params.behaviour.timeLimit || null,
        a11y: {
          buttonFullscreenEnter: this.params.a11y.buttonFullscreenEnter,
          buttonFullscreenExit: this.params.a11y.buttonFullscreenExit,
          buttonAudioMute: this.params.a11y.buttonAudioMute,
          buttonAudioUnmute: this.params.a11y.buttonAudioUnmute,
          disabled: this.params.a11y.disabled,
          close: this.params.a11y.close
        }
      },
      {
        onResize: (() => {
          this.handleOnResize();
        }),
        onCompleted: ((params) => {
          this.handleCompleted(params);
        }),
        onButtonFullscreenClicked: (() => {
          this.toggleFullscreen();
        })
      }
    );

    // Register content with H5P.Question
    this.setContent(this.content.getDOM());

    // TODO: get parent h5p-container and use as basis for query selection

    // Register Buttons
    this.addButtons();

    // Wait for content DOM to be completed
    if (document.readyState === 'complete') {
      window.requestAnimationFrame(() => {
        this.handleInitialized();
      });
    }
    else {
      document.addEventListener('readystatechange', () => {
        if (document.readyState === 'complete') {
          window.requestAnimationFrame(() => {
            this.handleInitialized();
          });
        }
      });
    }

    // Resize fullscreen dimensions when rotating screen
    window.addEventListener('orientationchange', () => {
      if (H5P.isFullscreen) {
        setTimeout(() => { // Needs time to rotate for window.innerHeight
          this.content.setFixedHeight(true);
        }, 200);
      }
    }, false);
  }

  /**
   * Add all the buttons that shall be passed to H5P.Question.
   */
  addButtons() {
    // Toggle background music button
    this.addButton('complete', this.params.l10n.complete, () => {
      this.handleClickButtonComplete({xAPI: true});
    }, this.params.behaviour.enableComplete, {
      'aria-label': this.params.a11y.complete
    }, {});

    // Toggle background music button
    this.addButton('hint', this.params.l10n.hint, () => {
      this.handleClickButtonHint();
    }, this.params.behaviour.enableHint, {
      'aria-label': this.params.a11y.hint
    }, {});

    // Retry button
    this.addButton('try-again', this.params.l10n.tryAgain, () => {
      this.handleClickButtonRetry();
    }, this.params.behaviour.enableRetry, {
      'aria-label': this.params.a11y.tryAgain
    }, {});
  }

  /**
   * Disable all buttons.
   */
  disableButtons() {
    for (let id in this.buttons) {
      this.disableButton(id);
    }
  }

  /**
   * Disable a button.
   * @param {string} id Id of button to disable.
   */
  disableButton(id) {
    if (!this.buttons[id]) {
      return;
    }

    this.buttons[id].setAttribute('disabled', true);
    this.buttons[id].classList.add('disabled');
  }

  /**
   * Enable all buttons.
   */
  enableButtons() {
    for (let id in this.buttons) {
      this.enableButton(id);
    }
  }

  /**
   * Enable a button.
   * @param {string} id Id of button to enable.
   */
  enableButton(id) {
    if (!this.buttons[id]) {
      return;
    }

    this.buttons[id].removeAttribute('disabled');
    this.buttons[id].classList.remove('disabled');
  }

  /**
   * Toggle fullscreen button.
   * @param {string|boolean} state enter|false for enter, exit|true for exit.
   */
  toggleFullscreen(state) {
    if (!this.container) {
      return;
    }

    if (typeof state === 'string') {
      if (state === 'enter') {
        state = false;
      }
      else if (state === 'exit') {
        state = true;
      }
    }

    if (typeof state !== 'boolean') {
      state = !H5P.isFullscreen;
    }

    if (state === true) {
      H5P.fullScreen(H5P.jQuery(this.container), this);
    }
    else {
      H5P.exitFullScreen();
      setTimeout(() => {
        this.trigger('resize');
      }, 100); // Small images
      setTimeout(() => {
        this.trigger('resize');
      }, 500); // Large images take more time
    }
  }

  /**
   * Check if result has been submitted or input has been given.
   * @return {boolean} True, if answer was given.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-1}
   */
  getAnswerGiven() {
    return this.content.getAnswerGiven();
  }

  /**
   * Get latest score.
   * @return {number} latest score.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-2}
   */
  getScore() {
    return this.content.getScore();
  }

  /**
   * Get maximum possible score.
   * @return {number} Score necessary for mastering.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
   */
  getMaxScore() {
    return this.params.tilesHorizontal * this.params.tilesVertical;
  }

  /**
   * Show solutions.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-4}
   */
  showSolutions() {
    this.handleClickButtonComplete({xAPI: false});

    this.trigger('resize');
  }

  /**
   * Reset task.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-5}
   */
  resetTask() {
    if (this.params.behaviour.enableComplete) {
      this.showButton('complete');
    }

    if (this.params.behaviour.enableHint) {
      this.showButton('hint');
    }

    this.content.reset();

    this.trigger('resize');
  }

  /**
   * Get xAPI data.
   * @return {object} XAPI statement.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   */
  getXAPIData() {
    return ({
      statement: this.getXAPIAnsweredEvent().data.statement
    });
  }

  /**
   * Build xAPI completed event.
   * @return {H5P.XAPIEvent} XAPI answer event.
   */
  getXAPIAnsweredEvent() {
    const xAPIEvent = this.createXAPIEvent('answered');

    xAPIEvent.setScoredResult(this.getScore(), this.getMaxScore(), this,
      true, this.isPassed());

    return xAPIEvent;
  }

  /**
   * Create an xAPI event for Jigsaw Puzzle.
   * @param {string} verb Short id of the verb we want to trigger.
   * @return {H5P.XAPIEvent} Event template.
   */
  createXAPIEvent(verb) {
    const xAPIEvent = this.createXAPIEventTemplate(verb);
    Util.extend(
      xAPIEvent.getVerifiedStatementValue(['object', 'definition']),
      this.getxAPIDefinition());
    return xAPIEvent;
  }

  /**
   * Get the xAPI definition for the xAPI object.
   * @return {object} XAPI definition.
   */
  getxAPIDefinition() {
    const definition = {};
    definition.name = {'en-US': this.getTitle()};
    definition.description = {'en-US': this.getDescription()};
    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
    definition.interactionType = 'other';

    return definition;
  }

  /**
   * Determine whether the task has been passed by the user.
   * @return {boolean} True if user passed or task is not scored.
   */
  isPassed() {
    return this.getScore() >= this.getMaxScore();
  }

  /**
   * Get tasks title.
   * @return {string} Title.
   */
  getTitle() {
    let raw;
    if (this.extras.metadata) {
      raw = this.extras.metadata.title;
    }
    raw = raw || JigsawPuzzle.DEFAULT_DESCRIPTION;

    // H5P Core function: createTitle
    return H5P.createTitle(raw);
  }

  /**
   * Get tasks description.
   * @return {string} Description.
   */
  getDescription() {
    return this.params.taskDescription || JigsawPuzzle.DEFAULT_DESCRIPTION;
  }

  /**
   * Answer call to return the current state.
   * @return {object} Current state.
   */
  getCurrentState() {
    return this.content.getCurrentState();
  }

  /**
   * Handle content initialized
   */
  handleInitialized() {
    // Add fullscreen button on first call after H5P.Question has created the DOM
    this.container = document.querySelector('.h5p-container');
    if (this.container) {
      this.content.enableFullscreenButton();

      this.on('enterFullScreen', () => {
        setTimeout(() => { // Needs time to get into fullscreen for window.innerHeight
          this.content.toggleFullscreen(true);
        }, 200);
      });

      this.on('exitFullScreen', () => {
        this.content.toggleFullscreen(false);
      });

      this.buttons = {};
      this.buttons['complete'] = this.container.querySelector('.h5p-question-complete');
      this.buttons['hint'] = this.container.querySelector('.h5p-question-hint');
      this.buttons['try-again'] = this.container.querySelector('.h5p-question-try-again');
    }
  }

  /**
   * Own resize handler.
   */
  handleResize() {
    if (this.bubblingUpwards || !this.content) {
      return; // Prevent send event back down.
    }

    this.content.handleResize();
  }

  /**
   * Resize callback for children (content).
   */
  handleOnResize() {
    // Prevent target from sending event back down
    this.bubblingUpwards = true;

    this.trigger('resize');

    // Reset
    this.bubblingUpwards = false;
  }

  /**
   * Handle puzzle completed.
   * @param {object} [params] Parameters.
   * @param {boolean} xAPI It true. will trigger xAPI.
   */
  handleCompleted(params = {}) {
    this.hideButton('complete');
    this.hideButton('hint');

    if (params.xAPI) {
      this.trigger(this.getXAPIAnsweredEvent());
    }
  }

  /**
   * Handle click on button complete.
   */
  handleClickButtonComplete(params) {
    this.content.handlePuzzleCompleted(params);
    this.content.finishTiles();
  }

  /**
   * Handle click on button hint.
   */
  handleClickButtonHint() {
    this.content.showHint(() => {
      this.enableButtons();
    });
    this.disableButtons();
  }

  /**
   * Handle click on button retry.
   */
  handleClickButtonRetry() {
    this.resetTask();
  }
}

/** @constant {string} */
JigsawPuzzle.DEFAULT_DESCRIPTION = 'Jigsaw Puzzle';
