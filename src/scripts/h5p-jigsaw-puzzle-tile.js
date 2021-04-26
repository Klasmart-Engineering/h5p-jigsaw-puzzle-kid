import Util from './h5p-jigsaw-puzzle-util';

/** Class representing a puzzle tile */
export default class JigsawPuzzleTile {
  /**
   * @constructor
   * @param {object} params Parameters.
   * @param {object} callbacks Callbacks.
   * @param {function} callbacks.onTileCreated Callback for when tile is created.
   * @param {function} callbacks.onTileMoveStart Callback for when tile is about to be moved.
   * @param {function} callbacks.onTileMove Callback for when tile is moved.
   * @param {function} callbacks.onTileMoveEnd Callback for when tile is dropped.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = params;

    this.callbacks = callbacks;
    this.callbacks.onPuzzleTileCreated = this.callbacks.onPuzzleTileCreated || (() => {});
    this.callbacks.onPuzzleTileMoveStart = this.callbacks.onPuzzleTileMoveStart || (() => {});
    this.callbacks.onPuzzleTileMove = this.callbacks.onPuzzleTileMove || (() => {});
    this.callbacks.onPuzzleTileMoveEnd = this.callbacks.onPuzzleTileMoveEnd || (() => {});

    this.pathBorders = {};

    this.moveInitialX = null;
    this.moveInitialY = null;
    this.deltaX = null;
    this.deltaY = null;

    this.backgroundImage = new Image();
    this.backgroundImage.addEventListener('load', () => {
      this.handleImageLoaded();
    });
    // Use the same crossOrigin policy as the initial image used.
    this.backgroundImage.crossOrigin = params.imageCrossOrigin;
    this.backgroundImage.src = params.imageSource;

    this.handleTileMoveStart = this.handleTileMoveStart.bind(this);
    this.handleTileMove = this.handleTileMove.bind(this);
    this.handleTileMoveEnd = this.handleTileMoveEnd.bind(this);
    this.handleAnimationMoveEnded = this.handleAnimationMoveEnded.bind(this);

    this.tile = document.createElement('div');
    this.tile.classList.add('h5p-jigsaw-puzzle-tile');

    this.setScale(1);
  }

  /**
   * Return the DOM for tile.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.tile;
  }

  /**
   * Return the outer HTML for tile.
   * @return {string} Outer HTML for tile.
   */
  getHTML() {
    return this.tile.outerHTML;
  }

  /**
   * Build SVG element.
   * @param {object} params Parameters.
   * @return {HTMLElement} SVG element.
   */
  buildSVG(params = {}) {
    const svg = document.createElement('svg');

    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${params.width + params.stroke} ${params.height + params.stroke}`);

    const defs = document.createElement('defs');
    const pattern = document.createElement('pattern');
    pattern.setAttribute('id', `h5p-jigsaw-puzzle-${this.params.uuid}-pattern-${this.params.id}`);
    pattern.setAttribute('x', '0');
    pattern.setAttribute('y', '0');
    pattern.setAttribute('width', '1');
    pattern.setAttribute('height', '1');
    const image = document.createElement('image');
    image.setAttribute('width', params.image.naturalWidth);
    image.setAttribute('height', params.image.naturalHeight);
    image.setAttribute('href', params.image.src);
    pattern.appendChild(image);
    defs.appendChild(pattern);
    svg.appendChild(defs);

    const path = document.createElement('path');
    path.setAttribute('fill', `url(#h5p-jigsaw-puzzle-${this.params.uuid}-pattern-${this.params.id})`);
    path.setAttribute('stroke-opacity', '0');
    path.setAttribute('stroke-width', params.stroke);
    path.setAttribute('d', this.buildPathDash({
      width: params.baseWidth,
      height: params.baseHeight,
      type: params.type,
      stroke: params.stroke
    }));
    svg.appendChild(path);

    ['top', 'right', 'bottom', 'left'].forEach(side => {
      this.pathBorders[side] = this.buildPathDOM({
        stroke: params.stroke,
        color: this.params.borderColor,
        width: params.baseWidth,
        height: params.baseHeight,
        orientation: this.params.borders[side].orientation,
        opacity: this.params.borders[side].opacity,
        side: side,
        gridPosition: {
          x: this.params.gridPosition.x,
          y: this.params.gridPosition.y
        }
      });

      svg.appendChild(this.pathBorders[side]);
    });

    return svg;
  }

  /**
   * Build DOM element for SVG path.
   * @param {object} params Parameters.
   * @return {HTMLElement} DOM for SVG path.
   */
  buildPathDOM(params = {}) {
    const pathDOM = document.createElement('path');
    pathDOM.setAttribute('fill-opacity', '0');
    pathDOM.setAttribute('stroke', params.color);
    pathDOM.setAttribute('stroke-width', params.stroke);
    pathDOM.setAttribute('stroke-opacity', params.opacity);
    pathDOM.setAttribute('d', this.buildPathSegment({
      width: params.width,
      height: params.height,
      orientation: params.orientation,
      stroke: params.stroke,
      side: params.side,
      gridPosition: {
        x: this.params.gridPosition.x,
        y: this.params.gridPosition.y
      }
    }));

    return pathDOM;
  }

  /**
   * Build SVG segment.
   * @param {object} params Parameters.
   * @return {string} SVG path.
   */
  buildPathSegment(params = {}) {
    const knob = Math.min(params.width, params.height) / 2;

    // Offset for side and knob
    let offsetX = (params.side === 'right') ? params.width : 0;
    if (params.gridPosition.x !== 0) {
      offsetX += params.stroke / 2 + knob / 2;
    }

    let offsetY = (params.side === 'bottom') ? params.height : 0;
    if (params.gridPosition.y !== 0) {
      offsetY += params.stroke / 2 + knob / 2;
    }

    // Start position
    const offset = `M ${offsetX}, ${offsetY}`;
    const pathSide = (params.side === 'top' || params.side === 'bottom') ? 'horizontal' : 'vertical';

    const path = JigsawPuzzleTile.PATHS_BORDER[`${pathSide}-${params.orientation}`];

    return `${offset} ${path}`
      .replace(/@w/g, params.width)
      .replace(/@h/g, params.height)
      .replace(/@knob/g, knob)
      .replace(/@gapw/g, (params.width - knob) / 2)
      .replace(/@gaph/g, (params.height - knob) / 2);
  }

  /**
   * Build SVG path dash.
   * @param {object} params Parameters.
   * @param {string} params.type Puzzle tile type.
   * @param {number} params.width Width.
   * @param {number} params.height Height.
   */
  buildPathDash(params = {}) {
    const knob = Math.min(params.width, params.height) / 2;

    return JigsawPuzzleTile.PATHS[params.type]
      .replace(/@offknob/g, params.stroke / 2 + knob / 2)
      .replace(/@off/g, params.stroke / 2)
      .replace(/@w/g, params.width)
      .replace(/@h/g, params.height)
      .replace(/@knob/g, knob)
      .replace(/@gapw/g, (params.width - knob) / 2)
      .replace(/@gaph/g, (params.height - knob) / 2);
  }

  /**
   * Update parameters.
   * @param {object} params Parameters.
   */
  updateParams(params) {
    this.params = Util.extend(this.params, params);
  }

  /**
   * Set CSS z-index.
   * @param {number} [index=''] Z-index or empty to reset.
   */
  setZIndex(index = '') {
    if (index !== '' && typeof index !== 'number') {
      return;
    }

    this.tile.style.zIndex = index;
  }

  /**
   * Get grid position.
   * @return {object} Grid position.
   */
  getGridPosition() {
    return {
      x: this.params.gridPosition.x,
      y: this.params.gridPosition.y
    };
  }

  /**
   * Get tile id.
   * @return {number} Tile id.
   */
  getId() {
    return this.params.id;
  }

  /**
   * Set size by scale relative to original size.
   * @param {number} scale Scale.
   */
  setScale(scale) {
    if (typeof scale !== 'number' || scale < 0) {
      return;
    }

    this.scale = scale;

    this.width = this.scale * this.params.width;
    this.height = this.scale * this.params.height;
    this.knob = this.scale * this.params.knobSize;
    this.stroke = this.scale * this.params.stroke;

    this.tile.style.width = `${this.width + this.stroke}px`;
    this.tile.style.height = `${this.height + this.stroke}px`;
  }

  /**
   * Get size.
   * @return {object|null} Size.
   */
  getSize() {
    if (!this.tile.style.width || !this.tile.style.height) {
      return null;
    }

    return {
      baseWidth: this.params.baseWidth,
      baseHeight: this.params.baseHeight,
      width: this.width,
      height: this.height,
      knob: this.knob,
      stroke: this.stroke
    };
  }

  /**
   * Get position.
   * @return {object|null} Position.
   */
  getPosition() {
    if (!this.tile.style.left || !this.tile.style.top) {
      return null;
    }

    return {
      x: parseFloat(this.tile.style.left),
      y: parseFloat(this.tile.style.top)
    };
  }

  /**
   * Set position.
   * @param {object} position Position.
   * @param {number} position.x X-position.
   * @param {number} position.y Y-position.
   */
  setPosition(position = {}) {
    if (typeof position.x !== 'number' || typeof position.y !== 'number') {
      return;
    }

    this.tile.style.left = `${position.x}px`;
    this.tile.style.top = `${position.y}px`;
  }

  /**
   * Set tile done.
   * @param {boolean} [done=true] Done state.
   */
  setDone(done = true) {
    this.isDone = done;
  }

  /**
   * Ghost tile.
   */
  ghost() {
    this.tile.classList.add('ghosted');
  }

  /**
   * Unghost tile.
   */
  unghost() {
    this.tile.classList.remove('ghosted');
  }

  /**
   * Enable tile.
   */
  enable() {
    this.tile.removeAttribute('disabled', 'disabled');
    this.isDisabled = false;
  }

  /**
   * Disable tile.
   */
  disable() {
    this.isDisabled = true;
    this.tile.setAttribute('disabled', 'disabled');
  }

  /**
   * Put tile in background.
   */
  putInBackground() {
    this.tile.classList.remove('onTop');
  }

  /**
   * Put tile on top.
   */
  putOnTop() {
    this.tile.classList.add('onTop');
  }

  /**
   * Animate moving until moving ended.
   * @param {object} params Parameters.
   * @param {number} [params.duration=0.5] CSS transition duration in seconds.
   */
  animateMove(params = {}) {
    params.duration = params.duration || 0.5;

    this.tile.removeEventListener('transitionend', this.handleAnimationMoveEnded);
    this.tile.addEventListener('transitionend', this.handleAnimationMoveEnded);
    if (params.duration !== 0.5) {
      this.tile.style.transitionDuration = `${params.duration}s`;
    }

    this.tile.classList.add('animate-move');
  }

  /**
   * Repaint the svg content.
   */
  repaintSVG() {
    this.tile.innerHTML = '';

    const svg = this.buildSVG({
      id: this.params.id,
      gridPosition: this.params.gridPosition,
      baseWidth: this.params.baseWidth,
      baseHeight: this.params.baseHeight,
      width: this.params.width,
      height: this.params.height,
      stroke: this.params.stroke,
      image: this.backgroundImage,
      type: this.params.type
    });

    this.tile.innerHTML = svg.outerHTML;
  }

  /**
   * Handle image was loaded.
   */
  handleImageLoaded() {
    this.setScale(this.scale);

    this.repaintSVG();

    this.callbacks.onPuzzleTileCreated(this);

    this.tile.addEventListener('touchstart', this.handleElementMoveStart, false);
    this.tile.addEventListener('mousedown', this.handleTileMoveStart, false);
  }

  /**
   * Handle tile starts moving.
   * @param {Event} event MouseEvent|TouchEvent.
   */
  handleTileMoveStart(event) {
    if (this.isDisabled) {
      return;
    }

    event = event || window.event;
    event.preventDefault();

    // Keep track of starting click position in absolute pixels
    if (event.type === 'touchstart') {
      this.moveInitialX = event.touches[0].clientX;
      this.moveInitialY = event.touches[0].clientY;
    }
    else {
      this.moveInitialX = event.clientX;
      this.moveInitialY = event.clientY;
    }

    document.addEventListener('mousemove', this.handleTileMove);
    document.addEventListener('mouseup', this.handleTileMoveEnd);

    this.callbacks.onPuzzleTileMoveStart(this);
  }

  /**
   * Handle tile moves.
   * @param {Event} event MouseEvent|TouchEvent.
   */
  handleTileMove(event) {
    event = event || window.event;
    event.preventDefault();

    let deltaX = 0;
    let deltaY = 0;

    if (event.type === 'touchmove') {
      deltaX = this.moveInitialX - event.touches[0].clientX;
      deltaY = this.moveInitialY - event.touches[0].clientY;
      this.moveInitialX = event.touches[0].clientX;
      this.moveInitialY = event.touches[0].clientY;
    }
    else {
      deltaX = this.moveInitialX - event.clientX;
      deltaY = this.moveInitialY - event.clientY;
      this.moveInitialX = event.clientX;
      this.moveInitialY = event.clientY;
    }

    // TODO: Don't get this from DOM here
    const puzzleArea = document.querySelector('.h5p-jigsaw-puzzle-puzzle-area');
    const minX = puzzleArea.offsetLeft;
    const maxX = puzzleArea.offsetLeft + puzzleArea.offsetWidth - this.width;

    const minY = puzzleArea.offsetTop;
    const maxY = puzzleArea.offsetTop + puzzleArea.offsetHeight - this.height;

    this.setPosition({
      x: Math.min(Math.max(minX, this.getPosition().x - deltaX), maxX),
      y: Math.min(Math.max(minY, this.getPosition().y - deltaY), maxY)
    });

    this.callbacks.onPuzzleTileMove(this);
  }

  /**
   * Handle tile stops moving.
   * @param {Event} event MouseEvent|TouchEvent.
   */
  handleTileMoveEnd() {
    document.removeEventListener('mousemove', this.handleTileMove);
    document.removeEventListener('mouseup', this.handleTileMoveEnd);

    this.callbacks.onPuzzleTileMoveEnd(this);
  }

  /**
   * Handle moving animation ended.
   */
  handleAnimationMoveEnded() {
    this.tile.style.transitionDuration = '';
    this.tile.classList.remove('animate-move');
    this.tile.removeEventListener('transitionend', this.handleAnimationMoveEnded);
  }
}

// TODO: Could this be made simpler by using percentages?

/** constant {object} SVG path for complete tiles */
JigsawPuzzleTile.PATHS = {
  'top-left': 'M @off, @off l @w, 0 l 0, @gaph a 1 1 0 0 0 0 @knob l 0, @gaph l -@gapw, 0 a 1 1 0 0 0 -@knob 0 l -@gapw, 0 l 0 -@h Z',
  'top-inner': 'M @offknob, @off l @w, 0 l 0, @gaph a 1 1 0 0 0 0 @knob l 0, @gaph l -@gapw, 0 a 1 1 0 0 0 -@knob 0 l -@gapw, 0 l 0, -@gaph a 1 1 0 0 1 0 -@knob l 0, -@gaph Z',
  'top-right': 'M @offknob, @off l @w, 0 l 0, @h l -@gapw, 0 a 1 1 0 0 0 -@knob 0 l -@gapw, 0 l 0, -@gaph a 1 1 0 0 1 0 -@knob l 0, -@gaph Z',
  'inner-left': 'M @off, @offknob l @gapw, 0 a 1 1 0 0 1 @knob 0 l @gapw, 0 l 0, @gaph a 1 1 0 0 0 0 @knob l 0, @gaph l -@gapw, 0 a 1 1 0 0 0 -@knob 0 l -@gapw, 0 l 0, -@h Z',
  'inner-inner': 'M @offknob, @offknob l @gapw, 0 a 1 1 0 0 1 @knob 0 l @gapw, 0 l 0, @gaph a 1 1 0 0 0 0 @knob l 0, @gaph l -@gapw, 0 a 1 1 0 0 0 -@knob 0 l -@gapw, 0 l 0, -@gaph a 1 1 0 0 1 0 -@knob l 0, -@gaph Z',
  'inner-right': 'M @offknob, @offknob l @gapw, 0 a 1 1 0 0 1 @knob 0 l @gapw, 0 l 0, @h l -@gapw, 0 a 1 1 0 0 0 -@knob 0 l -@gapw, 0 l 0, -@gaph a 1 1 0 0 1 0 -@knob l 0, -@gaph Z',
  'bottom-left': 'M @off, @offknob l @gapw, 0 a 1 1 0 0 1 @knob 0 l @gapw, 0 l 0, @gaph a 1 1 0 0 0 0 @knob l 0, @gaph l -@w, 0 l 0, -@h Z',
  'bottom-inner': 'M @offknob, @offknob l @gapw, 0 a 1 1 0 0 1 @knob 0 l @gapw, 0 l 0, @gaph a 1 1 0 0 0 0 @knob l 0, @gaph l -@w, 0 l 0, -@gaph a 1 1 0 0 1 0 -@knob l 0, -@gaph Z',
  'bottom-right': 'M @offknob, @offknob l @gapw, 0 a 1 1 0 0 1 @knob 0 l @gapw, 0 l 0, @h l -@w, 0 l 0, -@gaph a 1 1 0 0 1 0 -@knob l 0, -@gaph Z'
};

/** constant {object} Single SVG path border segments */
JigsawPuzzleTile.PATHS_BORDER = {
  'horizontal-straight': 'l @w, 0',
  'horizontal-up': 'l @gapw, 0 a 1 1 0 0 1 @knob 0 l @gapw, 0',
  'horizontal-down': 'l @gapw, 0 a 1 1 0 0 0 @knob 0 l @gapw, 0',
  'vertical-straight': 'l 0, @h',
  'vertical-left': 'l 0, @gaph a 1 1 0 0 0 0 @knob l 0, @gaph',
  'vertical-right': 'l 0, @gaph a 1 1 0 0 1 0 @knob l 0, @gaph'
};
