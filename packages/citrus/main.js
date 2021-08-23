'use strict';

module.exports = {
  load() {

  },
  unload() {
    // execute when package unloaded
  },
  // register your ipc messages here
  messages: {
    'NodeActiveDis'() {
      Editor.Scene.callSceneScript('citrus', 'citrus-active', {});
    },
    'GetNodeThree'() {
      Editor.Scene.callSceneScript('citrus', 'citrus-getThree', {});
    },
    'GetNodeImageThree'() {
      Editor.Scene.callSceneScript('citrus', 'citrus-getImageThree', {});
    },
    'LoadingImagee'() {
      Editor.Scene.callSceneScript('citrus', 'citrus-LoadingImagee', {});
    },
    'ReplaceImagee'() {
      Editor.Scene.callSceneScript('citrus', 'citrus-ReplaceImagee', {});
    },
    'Nodejson'() {
      Editor.Scene.callSceneScript('citrus', 'citrus-Nodejson', {});
    },
    'RestSetName'() {
      Editor.Scene.callSceneScript('citrus', 'citrus-RestSetName', {});
    },
  },
};

