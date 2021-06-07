var H5PUpgrades = H5PUpgrades || {};

H5PUpgrades['H5P.JigsawPuzzleKID'] = (function () {
  return {
    0: {
      /**
       * Asynchronous content upgrade hook.
       * Add default parameter for showPuzzleOutlines
       *
       * @param {Object} parameters
       * @param {function} finished
       */
      4: function (parameters, finished, extras) {
        if (parameters && parameters.behaviour) {
          parameters.behaviour.showPuzzleOutlines = false;
        }

        finished(null, parameters, extras);
      }
    }
  };
})();
