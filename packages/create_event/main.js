'use strict';

module.exports = {
  load () {
    // execute when package loaded
  },

  unload () {
    // execute when package unloaded
  },

  //当前选中的节点 UUID, 可以是多个
  getSelectedNodeUuids() {
    // curGlobalActivate 只能获取单个选择
    // Editor.Selection.curGlobalActivate();
    return Editor.Selection.curSelection('node');
  },

  // register your ipc messages here
  messages: {

    'create_node' () {
      Editor.Scene.callSceneScript('create_event', 'event-node', {});
    },

    'create_sprite' () {
      Editor.Scene.callSceneScript('create_event', 'event-sprite', {});

    },

    'create_button' () {
      Editor.Scene.callSceneScript('create_event', 'event-button', {});
    },

    'create_label' () {
      Editor.Scene.callSceneScript('create_event', 'event-label', {});
    },

  },
};