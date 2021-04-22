import JigsawPuzzleTile from './h5p-jigsaw-puzzle-tile';

/** Class representing the content */
export default class JigsawPuzzleContent {
  /**
   * @constructor
   * @param {object} params Parameters.
   * @param {H5P.Image} params.puzzleImageInstance Background image.
   * @param {string} params.uuid UUID for multiple instances in one iframe.
   * @param {object} params.size Number of tiles (width x height).
   * @param {number} params.size.width Number of tiles horizontally.
   * @param {number} params.size.height Number of tiles vertically.
   * @param {number} params.sortingSpace Percentage of white space for sorting.
   * @param {object} params.previousState Previous state.
   * @param {number} params.stroke Stroke width.
   * @param {object} callbacks Callbacks.
   * @param {function} callbacks.onResize Callback for triggering content resize.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = params;

    this.callbacks = callbacks;
    this.callbacks.onResize = this.callbacks.onResize || (() => {});

    // Puzzle tiles, instance + position
    this.tiles = [];

    // Original image size
    this.originalSize = null;

    // Border size;
    this.borderWidth = null;

    // Main content
    this.content = document.createElement('div');
    this.content.classList.add('h5p-jigsaw-puzzle-puzzle-area');

    // Area where puzzle tiles need to be put
    this.puzzleDropzone = document.createElement('div');
    this.puzzleDropzone.classList.add('h5p-jigsaw-puzzle-tile-container');
    window.requestAnimationFrame(() => {
      const styles = window.getComputedStyle(this.puzzleDropzone);
      this.borderWidth = parseFloat(styles.getPropertyValue('border-width'));
    });
    this.content.appendChild(this.puzzleDropzone);

    // Optional sorting area for better overview
    const sortingArea = document.createElement('div');
    sortingArea.classList.add('h5p-jigsaw-puzzle-sorting-area');
    sortingArea.style.width = `${(100 * this.params.sortingSpace) / (100 - this.params.sortingSpace)}%`;
    this.content.appendChild(sortingArea);

    // Image to be used for tiles and background
    this.image = document.createElement('img');
    this.image.addEventListener('load', () => {
      this.handleImageLoaded();
    });
    this.imageCrossOrigin = typeof H5P.getCrossOrigin === 'function' ?
      H5P.getCrossOrigin(params.puzzleImageInstance.source) :
      'Anonymous';
    this.image.src = params.puzzleImageInstance.source;
    this.canvas = document.createElement('canvas');
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.content;
  }

  /**
   * Get cropped image.
   * @param {HTMLElement} canvas Canvas.
   * @param {number} x Start position x.
   * @param {number} y Start position y.
   * @param {number} width Width.
   * @param {number} height Height.
   * @return {string} Image source base64.
   */
  getCroppedImageSrc(canvas, x, y, width, height) {
    const canvasBuffer = document.createElement('canvas');
    const canvasBufferContext = canvasBuffer.getContext('2d');
    canvasBuffer.width = width;
    canvasBuffer.height = height;

    canvasBufferContext.beginPath();
    canvasBufferContext.rect(0, 0, width, height);
    canvasBufferContext.fillStyle = 'white';
    canvasBufferContext.fill();

    canvasBufferContext.drawImage(canvas, x, y, width, height, 0, 0, width, height);

    return canvasBuffer.toDataURL();
  }

  /**
   * Create puzzle tile.
   * @param {object} params Parameters.
   * @param {number} params.x Tile grid position horizontally.
   * @param {number} params.y Tile grid position vertically.
   * @return {JigsawPuzzleTile} Puzzle tile.
   */
  createPuzzleTile(params) {
    const baseWidth = this.image.naturalWidth / this.params.size.width;
    const baseHeight = this.image.naturalHeight / this.params.size.height;
    const knobSize = Math.min(baseWidth, baseHeight) / 2;
    const tileWidth = baseWidth + ((params.x > 0) ? knobSize / 2 : 0);
    const tileHeight = baseHeight + ((params.y > 0) ? knobSize / 2 : 0);

    // Border types
    const borders = {
      top: {
        orientation: (params.y === 0) ? 'straight' : 'up',
        opacity: 1
      },
      right: {
        orientation: (params.x + 1 === this.params.size.width) ? 'straight' : 'left',
        opacity: 1
      },
      bottom: {
        orientation: (params.y + 1 === this.params.size.height) ? 'straight' : 'up',
        opacity: 1
      },
      left: {
        orientation: (params.x === 0) ? 'straight' : 'left',
        opacity: 1
      }
    };

    // Alignment
    let verticalAlignment = 'inner';
    if (params.y === 0) {
      verticalAlignment = 'top';
    }
    else if (params.y + 1 === this.params.size.height) {
      verticalAlignment = 'bottom';
    }
    let horizontalAlignment = 'inner';
    if (params.x === 0) {
      horizontalAlignment = 'left';
    }
    else if (params.x + 1 === this.params.size.width) {
      horizontalAlignment = 'right';
    }
    const type = `${verticalAlignment}-${horizontalAlignment}`;

    // Image
    const imageSource = this.getCroppedImageSrc(
      this.canvas,
      params.x * baseWidth - Math.sign(params.x) * knobSize / 2,
      params.y * baseHeight - Math.sign(params.y) * knobSize / 2,
      tileWidth,
      tileHeight
    );

    return new JigsawPuzzleTile(
      {
        id: params.y * this.params.size.width + params.x,
        baseWidth: baseWidth,
        baseHeight: baseHeight,
        width: tileWidth,
        height: tileHeight,
        gridPosition: {x: params.x, y: params.y},
        knobSize: knobSize,
        imageSource: imageSource,
        imageCrossOrigin: this.imageCrossOrigin,
        type: type,
        stroke: this.params.stroke,
        borderColor: this.params.tileBorderColor,
        borders: borders,
        uuid: this.params.uuid,
        container: this.content
      },
      {
        onPuzzleTileCreated: ((tile) => {
          this.handlePuzzleTileCreated(tile);
        }),
        onPuzzleTileMoveStart: ((tile) => {
          this.handlePuzzleTileMoveStart(tile);
        }),
        onPuzzleTileMove: ((tile) => {
          this.handlePuzzleTileMove(tile);
        }),
        onPuzzleTileMoveEnd: ((tile) => {
          this.handlePuzzleTileMoveEnd(tile);
        })
      }
    );
  }

  /**
   * Set tile position.
   * @param {JigsawPuzzleTile} Puzzle tile.
   * @param {number} x Absolute x position.
   * @param {number} y Absolute y position.
   */
  setTilePosition(tile, x, y) {
    if (!tile) {
      return;
    }

    if (typeof x !== 'number' || x < 0) {
      return;
    }

    if (typeof y !== 'number' || y < 0) {
      return;
    }

    // Required for resizing, relative position of tile in puzzle dropzone
    this.tiles[tile.getId()].position = {
      x: (x - this.puzzleDropzone.offsetLeft) / this.puzzleDropzone.offsetWidth,
      y: (y - this.puzzleDropzone.offsetTop) / this.puzzleDropzone.offsetHeight
    };

    // Absolute tile position on screen
    tile.setPosition({
      x: x,
      y: y
    });
  }

  /**
   * Reset.
   */
  reset() {
    this.tiles.forEach(tile => {
      tile.instance.enable();
      this.randomizeTile(tile.instance);
    });
  }

  /**
   * Randomize tile position.
   * @param {JigsawPuzzleTile} tile Puzzle tile.
   */
  randomizeTile(tile) {
    // Position tile randomly depending on space available
    const tileSize = tile.getSize();
    const left = (this.content.offsetWidth * this.params.sortingSpace / 100 < tileSize.width) ?
      Math.max(0, Math.random() * (this.content.offsetWidth - tile.getSize().width)) :
      Math.max(0, this.content.offsetLeft + this.content.offsetWidth * (1 - this.params.sortingSpace / 100) + Math.random() * (this.content.offsetWidth * (1 - this.params.sortingSpace / 100) - tileSize.width));
    const top = Math.max(0, Math.random() * (this.content.offsetHeight - tileSize.height));

    this.setTilePosition(tile, left, top);
  }

  /**
   * Hide neighboring tile borders
   * @param {JigsawPuzzleTile} tile Tile whose neighbors will be checked.
   */
  hideTileBorders(tile) {
    // top
    if (tile.getId() < this.params.size.width) {
      // Tile is in top row
      tile.updateParams({borders: {top: {opacity: 0}}});
      tile.repaintSVG();
    }
    else {
      const neighbor = this.tiles[tile.getId() - this.params.size.width].instance;

      if (neighbor.isDisabled) {
        tile.updateParams({borders: {top: {opacity: 0}}});
        tile.repaintSVG();
        neighbor.updateParams({borders: {bottom: {opacity: 0}}});
        neighbor.repaintSVG();
      }
    }

    // right
    if (tile.getId() % this.params.size.width === this.params.size.width - 1) {
      // Tile is in outer right column
      tile.updateParams({borders: {right: {opacity: 0}}});
      tile.repaintSVG();
    }
    else {
      const neighbor = this.tiles[tile.getId() + 1].instance;
      if (neighbor.isDisabled) {
        tile.updateParams({borders: {right: {opacity: 0}}});
        tile.repaintSVG();
        neighbor.updateParams({borders: {left: {opacity: 0}}});
        neighbor.repaintSVG();
      }
    }

    // bottom
    if (this.params.size.width * (this.params.size.height - 1) - 1 < tile.getId()) {
      // Tile is in bottom row
      tile.updateParams({borders: {bottom: {opacity: 0}}});
      tile.repaintSVG();
    }
    else {
      const neighbor = this.tiles[tile.getId() + this.params.size.width].instance;
      if (neighbor.isDisabled) {
        tile.updateParams({borders: {bottom: {opacity: 0}}});
        tile.repaintSVG();
        neighbor.updateParams({borders: {top: {opacity: 0}}});
        neighbor.repaintSVG();
      }
    }

    // left
    if (tile.getId() % this.params.size.width === 0) {
      // Tile is in outer left column
      tile.updateParams({borders: {left: {opacity: 0}}});
      tile.repaintSVG();
    }
    else {
      const neighbor = this.tiles[tile.getId() - 1].instance;
      if (neighbor.isDisabled) {
        tile.updateParams({borders: {left: {opacity: 0}}});
        tile.repaintSVG();
        neighbor.updateParams({borders: {right: {opacity: 0}}});
        neighbor.repaintSVG();
      }
    }
  }

  /**
   * Handle puzzle image loaded.
   */
  handleImageLoaded() {
    this.originalSize = {
      width: this.image.naturalWidth,
      height: this.image.naturalHeight
    };

    this.canvas.setAttribute('width', this.image.naturalWidth);
    this.canvas.setAttribute('height', this.image.naturalHeight);

    // Canvas is used to grab the background for each puzzle tile
    const canvasContext = this.canvas.getContext('2d');
    canvasContext.drawImage(this.image, 0, 0);

    for (let y = 0; y < this.params.size.height; y++) {
      for (let x = 0; x < this.params.size.width; x++) {
        this.tiles.push({
          instance: this.createPuzzleTile({
            x: x,
            y: y
          }),
          position: {
            x: 0,
            y: 0
          }
        });
      }
    }

    if (this.params.showBackground) {
      // Apply transparency on background image and use it as background
      const imageData = canvasContext.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const pixels = imageData.data;
      for (let i = 0; i < pixels.length; i += 4) {
        pixels[i + 3] = 16;
      }
      canvasContext.putImageData(imageData, 0, 0);
      this.puzzleDropzone.style.backgroundImage = `url(${this.canvas.toDataURL()})`;
    }

    // Resize now that the content is created
    this.handleResize();
  }

  /**
   * Handle resize.
   */
  handleResize() {
    if (this.originalSize) {
      this.scale = (this.puzzleDropzone.offsetWidth - this.borderWidth) / this.originalSize.width;
      this.puzzleDropzone.style.height = `${this.scale * this.originalSize.height - this.borderWidth}px`;

      this.tiles.forEach(tile => {
        tile.instance.setScale(this.scale);

        // Recompute position with offset
        tile.instance.setPosition({
          x: tile.position.x * this.puzzleDropzone.offsetWidth + this.puzzleDropzone.offsetLeft,
          y: tile.position.y * this.puzzleDropzone.offsetHeight + this.puzzleDropzone.offsetTop
        });
      });
    }

    this.callbacks.onResize();
  }

  /**
   * Handle puzzle tile being about to be moved.
   * @param {JigsawPuzzleTile} tile Puzzle tile.
   */
  handlePuzzleTileMoveStart(tile) {
    // Ghost all enabled tiles to allow comfortable positioning
    this.tiles.forEach(tile => {
      tile.instance.putInBackground();
      if (!tile.instance.isDisabled) {
        tile.instance.ghost();
      }
    });

    // Put dragged tile on top and unghost
    tile.putOnTop();
    tile.unghost();
  }

  /**
   * Handle puzzle tile being moved.
   * @param {JigsawPuzzleTile} tile Puzzle tile.
   */
  handlePuzzleTileMove() {
    // TODO: Coule be useful for showing hints
  }

  /**
   * Handle puzzle tile being dropped.
   * @param {JigsawPuzzleTile} tile Puzzle tile.
   */
  handlePuzzleTileMoveEnd(tile) {
    // Unghost all tiles to show everything
    this.tiles.forEach(tile => {
      tile.instance.unghost();
    });

    // Get current tile geometry
    const currentPosition = tile.getPosition();
    const currentSize = tile.getSize();
    const currentGridPosition = tile.getGridPosition();

    // Update position
    this.tiles[tile.getId()].position = currentPosition;

    const targetPosition = {
      x: this.puzzleDropzone.offsetLeft + currentGridPosition.x * currentSize.width - Math.sign(currentGridPosition.x) * currentSize.knob / 2 - currentGridPosition.x * currentSize.knob / 2,
      y: this.puzzleDropzone.offsetTop + currentGridPosition.y * currentSize.height - Math.sign(currentGridPosition.y) * currentSize.knob / 2 - currentGridPosition.y * currentSize.knob / 2
    };

    // Close enough, snap and disable
    const slack = Math.min(currentSize.baseWidth, currentSize.baseHeight) / JigsawPuzzleContent.slackFactor;
    if (
      (Math.abs(currentPosition.x - targetPosition.x) < slack) &&
      (Math.abs(currentPosition.y - targetPosition.y) < slack)
    ) {
      this.setTilePosition(tile, targetPosition.x, targetPosition.y);

      tile.disable();
      tile.putInBackground();

      this.hideTileBorders(tile);
    }
  }

  /**
   * Handle puzzle tile was created.
   * @param {JigsawPuzzleTile} tile Puzzle tile.
   */
  handlePuzzleTileCreated(tile) {
    // Position tile randomly depending on space available
    this.randomizeTile(tile);

    this.content.appendChild(tile.getDOM());

    // When all tiles are loaded, resize
    if (tile.getId() + 1 === this.params.size.width * this.params.size.height) {
      window.requestAnimationFrame(() => {
        this.handleResize();
      });
    }
  }
}
/** @constant {number} Slack factor for snapping tiles to grid */
JigsawPuzzleContent.slackFactor = 10;
