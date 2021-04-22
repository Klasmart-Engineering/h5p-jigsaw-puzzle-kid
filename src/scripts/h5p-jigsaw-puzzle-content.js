import JigsawPuzzleTile from './h5p-jigsaw-puzzle-tile';

/** Class representing the content */
export default class JigsawPuzzleContent {
  /**
   * @constructor
   */
  constructor(params = {}, callbacks = {}) {
    this.params = params;

    this.params.stroke = window.innerWidth / 750;

    this.callbacks = callbacks;
    this.callbacks.onResize = this.callbacks.onResize || (() => {});

    this.tiles = [];

    this.content = document.createElement('div');
    this.content.classList.add('h5p-jigsaw-puzzle-puzzle-area');

    this.puzzleDropzone = document.createElement('div');
    this.puzzleDropzone.classList.add('h5p-jigsaw-puzzle-tile-container');
    this.content.appendChild(this.puzzleDropzone);

    this.image = document.createElement('img');
    this.image.addEventListener('load', () => {
      this.handleImageLoaded();
    });
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

  getCroppedImageSrc(canvas, x, y, width, height) {
    const canvasBuffer = document.createElement('canvas');
    const canvasBufferContext = canvasBuffer.getContext('2d');
    canvasBuffer.width = width;
    canvasBuffer.height = height;

    canvasBufferContext.beginPath();
    canvasBufferContext.rect(0, 0, width, height);
    canvasBufferContext.fillStyle = 'white'; // TODO: Variable BG color?
    canvasBufferContext.fill();

    canvasBufferContext.drawImage(canvas, x, y, width, height, 0, 0, width, height);

    // TODO: Check for anonymous foo
    return canvasBuffer.toDataURL();
  }

  createPuzzleTile(params) {
    return new JigsawPuzzleTile(
      params,
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

  handleImageLoaded() {
    this.originalSize = {
      width: this.image.naturalWidth,
      height: this.image.naturalHeight
    };

    this.canvas.setAttribute('width', this.image.naturalWidth);
    this.canvas.setAttribute('height', this.image.naturalHeight);

    const canvasContext = this.canvas.getContext('2d');
    canvasContext.drawImage(this.image, 0, 0);

    for (let y = 0; y < this.params.size.height; y++) {
      for (let x = 0; x < this.params.size.width; x++) {
        const tileParameters = this.computeTileParameters({
          widthImage: this.image.naturalWidth,
          heightImage: this.image.naturalHeight,
          widthPuzzle: this.params.size.width,
          heightPuzzle: this.params.size.height,
          x: x,
          y: y,
          stroke: this.params.stroke,
          uuid: this.params.uuid
        });

        this.tiles.push({
          instance: this.createPuzzleTile(tileParameters),
          position: {
            x: 0,
            y: 0
          }
        });
      }
    }

    // Apply transparency
    let imageData = canvasContext.getImageData(0, 0, this.canvas.width, this.canvas.height);
    let pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i + 3] = 16;
    }
    canvasContext.putImageData(imageData, 0, 0);

    this.puzzleDropzone.style.backgroundImage = `url(${this.canvas.toDataURL()})`;

    this.handleResize();
  }

  /**
   * Handle resize.
   */
  handleResize() {
    if (this.originalSize) {

      // TODO: Consider top/left margin for puzzle dropzone!!!
      this.scale = this.content.offsetWidth * (1 - this.params.sortingSpace) / this.originalSize.width;

      // TODO: 2 * BorderWidth
      this.puzzleDropzone.style.width = `${this.scale * this.originalSize.width - 4}px`;
      this.puzzleDropzone.style.height = `${this.scale * this.originalSize.height - 4}px`;

      this.tiles.forEach(tile => {
        tile.instance.setScale(this.scale);

        tile.instance.setPosition({
          x: tile.position.x * this.puzzleDropzone.offsetWidth,
          y: tile.position.y * this.puzzleDropzone.offsetHeight
        });
      });
    }

    this.callbacks.onResize();
  }

  handlePuzzleTileMoveStart(tile) {
    this.tiles.forEach(tile => {
      tile.instance.putInBackground();
      if (!tile.instance.isDisabled) {
        tile.instance.ghost();
      }
    });

    tile.putOnTop();
    tile.unghost();
  }

  handlePuzzleTileMove(tile) {
    // TODO: Coule be useful for hints
  }

  handlePuzzleTileMoveEnd(tile) {
    this.tiles.forEach(tile => {
      tile.instance.unghost();
    });

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
    // TODO: Magic number 10
    const slack = Math.min(currentSize.baseWidth, currentSize.baseHeight) / 10;
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
   * Hide neighboring tile borders
   * @param {JigsawPuzzleTile} tile Tile whose neighbors will be checked.
   */
  hideTileBorders(tile) {
    // top
    if (tile.getId() < this.params.size.width) {
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
      tile.updateParams({borders: {right: {opacity: 0}}});
      tile.repaintSVG();
    }
    else {
      if (tile.getId() === (this.params.size.width * this.params.size.height - 1)) {
        return;
      }
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
      tile.updateParams({borders: {left: {opacity: 0}}});
      tile.repaintSVG();
    }
    else {
      if (tile.getId() === 0) {
        return;
      }
      const neighbor = this.tiles[tile.getId() - 1].instance;
      if (neighbor.isDisabled) {
        tile.updateParams({borders: {left: {opacity: 0}}});
        tile.repaintSVG();
        neighbor.updateParams({borders: {right: {opacity: 0}}});
        neighbor.repaintSVG();
      }
    }
  }

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

    // TODO: Offset for puzzle dropzone top/left margin!!!

    // Required for resizing
    this.tiles[tile.getId()].position = {
      x: x / this.puzzleDropzone.offsetWidth,
      y: y / this.puzzleDropzone.offsetHeight
    };

    tile.setPosition({
      x: x,
      y: y
    });
  }

  computeTileParameters(params) {
    const baseWidth = params.widthImage / params.widthPuzzle;
    const baseHeight = params.heightImage / params.heightPuzzle;
    const knobSize = Math.min(baseWidth, baseHeight) / 2;
    const tileWidth = baseWidth + ((params.x > 0) ? knobSize / 2 : 0);
    const tileHeight = baseHeight + ((params.y > 0) ? knobSize / 2 : 0);

    const borders = {
      top: {
        orientation: (params.y === 0) ? 'straight' : 'up',
        opacity: 1
      },
      right: {
        orientation: (params.x + 1 === params.widthPuzzle) ? 'straight' : 'left',
        opacity: 1
      },
      bottom: {
        orientation: (params.y + 1 === params.heightPuzzle) ? 'straight' : 'up',
        opacity: 1
      },
      left: {
        orientation: (params.x === 0) ? 'straight' : 'left',
        opacity: 1
      }
    };

    // Compute alignment
    let verticalAlignment = 'inner';
    if (params.y === 0) {
      verticalAlignment = 'top';
    }
    else if (params.y + 1 === params.heightPuzzle) {
      verticalAlignment = 'bottom';
    }
    let horizontalAlignment = 'inner';
    if (params.x === 0) {
      horizontalAlignment = 'left';
    }
    else if (params.x + 1 === params.widthPuzzle) {
      horizontalAlignment = 'right';
    }
    const type = `${verticalAlignment}-${horizontalAlignment}`;

    const imageSource = this.getCroppedImageSrc(
      this.canvas,
      params.x * baseWidth - Math.sign(params.x) * knobSize / 2,
      params.y * baseHeight - Math.sign(params.y) * knobSize / 2,
      tileWidth,
      tileHeight
    );

    return {
      id: params.y * params.widthPuzzle + params.x,
      baseWidth: baseWidth,
      baseHeight: baseHeight,
      width: tileWidth,
      height: tileHeight,
      gridPosition: {x: params.x, y: params.y},
      knobSize: knobSize,
      imageSource: imageSource,
      type: type,
      stroke: params.stroke,
      borders: borders,
      uuid: params.uuid,
      container: this.content
    };
  }

  handlePuzzleTileCreated(tile) {
    // Position tiles randomly depending on space available
    const left = (this.content.offsetWidth * this.params.sortingSpace < tile.getSize().width) ?
      Math.max(0, Math.random() * (this.content.offsetWidth - tile.getSize().width)) :
      Math.max(0, this.content.offsetWidth * (1 - this.params.sortingSpace) + Math.random() * (this.content.offsetWidth * (1 - this.params.sortingSpace) - tile.getSize().width));
    const top = Math.max(0, Math.random() * (this.content.offsetHeight - tile.getSize().height));
    this.setTilePosition(tile, left, top);

    this.content.appendChild(tile.getDOM());

    if (tile.getId() + 1 === this.params.size.width * this.params.size.height) {
      window.requestAnimationFrame(() => {
        this.handleResize();
      });
    }
  }
}
