'use strict';


//当前选中的节点 UUID, 可以是多个
var getSelectedNodeUuids = function () {
    // curGlobalActivate 只能获取单个选择
    // Editor.Selection.curGlobalActivate();
    return Editor.Selection.curSelection('node');
}

let event = {
    'event-node' () {
        const uuids = getSelectedNodeUuids();
        if(uuids.length == 0){
          Editor.log("没有选择节点！");
          return;
        }

        let name = 'node';
        for(let i=0; i<uuids.length; i++){
          Editor.Ipc.sendToPanel('scene', 'scene:create-node-by-classid', name, '', uuids[i]);
        }

    },

    'event-sprite' () {
      const uuids = getSelectedNodeUuids();
      if(uuids.length == 0){
        Editor.log("没有选择节点！");
        return;
      }
      
      let name = 'sprite';
      for(let i=0; i<uuids.length; i++){
        let rootNode = cc.engine.getInstanceById(uuids[i]);

        let node = new cc.Node(name);
        rootNode.addChild(node);
        if (!node.getComponent(cc.Sprite)) { node.addComponent(cc.Sprite);}
      }

    },

    'event-button' () {
      const uuids = getSelectedNodeUuids();
      if(uuids.length == 0){
        Editor.log("没有选择节点！");
        return;
      }

      let name = 'button';
      for(let i=0; i<uuids.length; i++){
        let rootNode = cc.engine.getInstanceById(uuids[i]);

        let node = new cc.Node(name);
        rootNode.addChild(node);
        if (!node.getComponent(cc.Button)) { node.addComponent(cc.Button);}
      }

    },

    'event-label' () {
        const uuids = getSelectedNodeUuids();
        if(uuids.length == 0){
          Editor.log("没有选择节点！");
          return;
        }
  
        let name = 'label';
        for(let i=0; i<uuids.length; i++){
            let rootNode = cc.engine.getInstanceById(uuids[i]);
    
            let node = new cc.Node(name);
            rootNode.addChild(node);
            if (!node.getComponent(cc.Label)) { node.addComponent(cc.Label);}
        }
    
  
      }
 
 
};

module.exports = event;