'use strict';
var CopyStr = function (str) {
  var input = str;
  const el = document.createElement('textarea');
  el.value = input;
  el.setAttribute('readonly', '');
  el.style.contain = 'strict';
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  el.style.fontSize = '12pt'; // Prevent zooming on iOS
  const selection = getSelection();
  var originalRange = false;
  if (selection.rangeCount > 0) {
    originalRange = selection.getRangeAt(0);
  }
  document.body.appendChild(el);
  el.select();
  el.selectionStart = 0;
  el.selectionEnd = input.length;
  var success = false;
  try {
    success = document.execCommand('copy');
  } catch (err) { }
  document.body.removeChild(el);
  if (originalRange) {
    selection.removeAllRanges();
    selection.addRange(originalRange);
  }
  return success;
}

//第三个参数是否需要let
var FindNodeParentName = function (CurrNode, ParentNode, HaveLet) {
  let temp_node = CurrNode
  let NameList = ""
  while (1) {
    if (temp_node.parent == ParentNode) {
      NameList += temp_node.name
      // NameList += temp_node.parent.name
      let c = NameList.split("-").reverse()
      let script_str
      if (HaveLet) {
        script_str = `let ${CurrNode.name} =this.node`
        for (let index = 0; index < c.length; index++) {
          const element = c[index];
          script_str += `.getChildByName("${element}")`
        }
      } else {
        script_str = []
        script_str.push(ParentNode.name)
        for (let index = 0; index < c.length; index++) {
          const element = c[index];
          script_str.push(element)
        }
      }
      return script_str
    } else {
      NameList += temp_node.name + "-"
      temp_node = temp_node.parent
    }
  }
}

//返回所有后代所有带精灵帧
var SumNode = []//sprite[]
var Return_ALL_Sp_By_Node = function (Curr_Node) {
  SumNode = []
  Return_ALL_Child(Curr_Node)
  return SumNode
}
//返回所有后代节点
var Return_ALL_Child = function (m_node) {
  if (m_node.getComponent(cc.Sprite)) {
    SumNode.push(m_node)
  }
  m_node.children.forEach(e => {
    if (e.childrenCount > 0) {
      Return_ALL_Child(e)
    } else {
      if (e.getComponent(cc.Sprite)) {
        SumNode.push(e)
      }
    }
  })
}
//判断是否是默认图片
var Check_Is_Default_Image = function (data) {
  let d = "atom@atom@default_panel@default_sprite@default-particle@default_scrollbar@default_btn_normal@default_editbox_bg@default_btn_pressed@default_progressbar@default_btn_disabled@default_scrollbar_bg@default_sprite_splash@default_toggle_normal@default_progressbar_bg@default_toggle_pressed@default_radio_button_on@default_toggle_disabled@default_radio_button_off@default_toggle_checkmark@default_scrollbar_vertical@default_scrollbar_vertical_bg"
  if (d.split("@").indexOf(data) > -1) {
    return true
  } else {
    return false
  }
}

//在资源文件夹得到资源文件夹里面的UUid的路径
var In_Assent_By_UUID_Return_DbPath = function (uuid) { return Editor.remote.assetdb.uuidToUrl(uuid) }

//在资源文件夹根据uuid获得名字
var In_Assent_By_UUID_Return_Name = function (uuid) {
  let d = Editor.assetdb.assetInfoByUuid(uuid).path.split("/")[c.length - 1]
  let c = d
  return c
}


//在场景中得到节点上的Sp的UUid
var In_Scene_By_Node_SpriteFrame_Return_UUID = function (m_node) { return m_node.getComponent(cc.Sprite).spriteFrame._uuid }

var Get_One_Prefab_Json = function (Curr_Node) {
  var Prefabjson = []
  Return_ALL_Sp_By_Node(Curr_Node).forEach(e => {
    //如果图片帧存在 并且不是默认图片
    if (e.getComponent(cc.Sprite).spriteFrame && !Check_Is_Default_Image(e.getComponent(cc.Sprite).spriteFrame.name)) {
      let subJson = {}
      let nameList
      if (e.uuid == Curr_Node.uuid) {
        nameList = Curr_Node.name
      } else {
        nameList = FindNodeParentName(e, Curr_Node, false)
      }

      subJson["FindMe"] = nameList
      let split_str_arry = In_Assent_By_UUID_Return_DbPath(In_Scene_By_Node_SpriteFrame_Return_UUID(e)).slice(5).split("/")
      let temp_ppp = ""
      for (let index = 0; index < split_str_arry.length - 1; index++) {
        const element = split_str_arry[index];
        if (index == split_str_arry.length - 2) {
          temp_ppp += element
          break
        }
        temp_ppp += element + "/"
      }
      subJson["ImagePath"] = temp_ppp
      // Alljson[Curr_Node.name + "-" + e.name] = subJson
      Prefabjson.push(subJson)

    }
  })
  return Prefabjson
}
var Get_One_Prefab_image = function (Curr_Node) {
  let Prefabimage = []
  Return_ALL_Sp_By_Node(Curr_Node).forEach(e => {
    //如果图片帧存在 并且不是默认图片
    if (e.getComponent(cc.Sprite).spriteFrame && !Check_Is_Default_Image(e.getComponent(cc.Sprite).spriteFrame.name)) {
      Prefabimage.push(e)
    }
  })
  return Prefabimage
}

var WriteFile = function (data) {
  Editor.assetdb.createOrSave('db://assets/citrus.json', data);
}
//获得URL的后缀   db://assets/Texture/HelloWorld.png  得到.png
var GetUrlType = function (url) {
  let temp = (url).split('.')
  return "." + temp[temp.length - 1]
}
//获得URL的名字  db://assets/Texture/HelloWorld.png  得到HelloWorld
var GetUrlName = function (url) {
  let temp = (url).split('/')
  return temp[temp.length - 1].replace(GetUrlType(url), "")
}
//获得URL的名字前的路径     db://assets/Texture/HelloWorld.png  得到  db://assets/Texture/
var GetUrlBeforeName = function (url) {
  return url.replace(GetUrlName(url) + GetUrlType(url), "")
}

//图片字典
var iamgeData = new Map();
//加载几个图片
var imageCount

let CitrusFuncs =
{
  //设置显示与否
  'citrus-active'(event) {
    let nodes = Editor.Selection.curSelection('node');
    if (nodes && nodes.length != 0) {
      let active = cc.engine.getInstanceById(nodes[0]).active;
      for (let i = 0; i < nodes.length; i++) {
        const id = nodes[i];
        let node = cc.engine.getInstanceById(id)
        if (node) {
          node.active = !active;
        }
      }
    }
  },
  'citrus-getThree'(event) {
    let CurrNodeThree = Editor.Selection.curSelection('node');
    if (CurrNodeThree.length > 1) {
      let Curr_Node_Parent = cc.engine.getInstanceById(CurrNodeThree[0])
      let citrus_script_str = ""
      for (let index = 1; index < CurrNodeThree.length; index++) {
        const element = cc.engine.getInstanceById(CurrNodeThree[index])
        citrus_script_str += FindNodeParentName(element, Curr_Node_Parent, true) + "\n"
      }
      CopyStr(citrus_script_str)
      Editor.info('Citrus_复制节点树成功!');
      return
    } else {
      Editor.info('Citrus_复制节点树失败!')
      return
    }
  },
  //不能有/ - @ 字符
  'citrus-getImageThree'(event) {
    // 检测面板焦点在资源管理器还是层级管理器
    let activeInfo = Editor.Selection.curGlobalActivate()
    let CurrNodeThree
    if (activeInfo && activeInfo.type == "node") {
      CurrNodeThree = Editor.Selection.curSelection('node');
      if (CurrNodeThree.length > 0) {
        var AllJson = {}
        for (let index = 0; index < CurrNodeThree.length; index++) {
          const element = cc.engine.getInstanceById(CurrNodeThree[index]);
          AllJson[element.name] = Get_One_Prefab_Json(element)
        }
        WriteFile(JSON.stringify(AllJson))
        Editor.info('Citrus_json树成功!')
      }
    }
    else if (activeInfo && activeInfo.type == "asset") {
      CurrNodeThree = Editor.Selection.curSelection('asset');
    }
  },
  'citrus-LoadingImagee'(event) {
    cc.log('Citrus_你等我会儿!')
    //先加载图片
    Editor.assetdb.queryAssets('db://assets/CitrusImage/**\/*', 'sprite-frame', function (err, results) {
      imageCount = results.length
      results.forEach(function (result, iindex) {
        let temp = (result.url).split('/')
        let imageName = temp[temp.length - 1]
        cc.loader.load({ uuid: result.uuid }, (err, image) => {
          iamgeData.set(imageName, image);
          imageCount -= 1
          if (imageCount == 0) {
            Editor.info('Citrus_资源图片个数' + results.length)
            Editor.info('Citrus_资源加载完毕!')
          }
        });
      });
    });
  },
  //替换图片
  'citrus-ReplaceImagee'(event) {
    // 检测面板焦点在资源管理器还是层级管理器
    let activeInfo = Editor.Selection.curGlobalActivate()
    let CurrNodeThree
    if (activeInfo && activeInfo.type == "node") {
      CurrNodeThree = Editor.Selection.curSelection('node');
      if (CurrNodeThree.length > 0) {
        //赋值
        for (let index = 0; index < CurrNodeThree.length; index++) {
          const element = cc.engine.getInstanceById(CurrNodeThree[index]);
          let vvvv = Get_One_Prefab_image(element)
          for (let iii = 0; iii < vvvv.length; iii++) {
            let e = vvvv[iii];
            e.getComponent(cc.Sprite).spriteFrame = iamgeData.get(e.getComponent(cc.Sprite).spriteFrame.name)
          }
        }
        Editor.info('Citrus_替换成功!')
      }
    }
  },
  //得到nodejson属性
  'citrus-Nodejson'(event) {
    // 检测面板焦点在资源管理器还是层级管理器
    let activeInfo = Editor.Selection.curGlobalActivate()
    let CurrNodeThree
    if (activeInfo && activeInfo.type == "node") {
      CurrNodeThree = Editor.Selection.curSelection('node');
      if (CurrNodeThree.length > 0) {
        let setNode = cc.engine.getInstanceById(CurrNodeThree[0]);
        let parentJson = {}
        for (let index = 1; index < CurrNodeThree.length; index++) {
          const element = cc.engine.getInstanceById(CurrNodeThree[index]);
          let subJson = {}
          if (setNode.position.x != 0) { subJson["PosX"] = element.position.x }
          if (setNode.position.y != 0) { subJson["PosY"] = element.position.y }
          if (setNode.rotation != 0) { subJson["rotation"] = element.rotation }
          if (setNode.scaleX != 0) { subJson["scaleX"] = element.scaleX }
          if (setNode.scaleY != 0) { subJson["scaleY"] = element.scaleY }
          if (setNode.anchorX != 0) { subJson["anchorX"] = element.anchorX }
          if (setNode.anchorY != 0) { subJson["anchorY"] = element.anchorY }
          if (setNode.getContentSize().width != 0) { subJson["width"] = element.getContentSize().width }
          if (setNode.getContentSize().height != 0) { subJson["height"] = element.getContentSize().height }
          if (setNode.opacity != 0) { subJson["opacity"] = element.opacity }
          if (setNode.skewX != 0) { subJson["skewX"] = element.skewX }
          if (setNode.skewY != 0) { subJson["skewY"] = element.skewY }
          parentJson[element.name] = subJson
        }
        CopyStr(JSON.stringify(parentJson))
        Editor.info('Citrus_NodeJson-剪切板成功!')
      }
    }
  },
  //批量重命名节点名字
  'citrus-RestSetName'(event) {
    // 检测面板焦点在资源管理器还是层级管理器
    let activeInfo = Editor.Selection.curGlobalActivate()
    let ScenceNode, AssetsNode//场景节点,资源节点
    if (activeInfo && activeInfo.type == "node") {
      ScenceNode = Editor.Selection.curSelection('node');
      let NodeName = cc.engine.getInstanceById(ScenceNode[0]).name;//citrus123
      let NameNum = parseInt(NodeName.replace(/[^0-9]/ig, ""));//123
      if (!NameNum) {
        return Editor.error('节点名称里面没有数字:请设置数字')
      }
      for (let i = 0; i < ScenceNode.length; i++) {
        let temp1, temp2
        temp1 = NodeName
        temp2 = NodeName
        const element = ScenceNode[i];
        cc.engine.getInstanceById(element).name = NodeName.replace(NameNum, NameNum + i)
      }
      Editor.info('Citrus_设置场景名称成功!')
    }
    if (activeInfo && activeInfo.type == "asset") {
      AssetsNode = Editor.Selection.curSelection('asset');
      if (AssetsNode.length < 2) {
        return Editor.error('选择的太少了最少2个')
      }
      Editor.assetdb.queryInfoByUuid(AssetsNode[0], function (err, info) { // info.path// info.url // info.type
        if (!GetUrlType(info.url).includes("/")) {
          let MainName = GetUrlName(info.url)

          let NameNum = parseInt(MainName.replace(/[^0-9]/ig, ""));//123
          if (!NameNum) {
            return Editor.error('节点名称里面没有数字:请设置数字')
          }

          let ADDnum = 1

          for (let i = 1; i < AssetsNode.length; i++) {
            const element = AssetsNode[i];
            // 打印文件信息
            Editor.assetdb.queryInfoByUuid(element, function (err, info) { // info.path// info.url // info.type
              if (!GetUrlType(info.url).includes("/")) {
                let Type = GetUrlType(info.url)
                let BeforeName = GetUrlBeforeName(info.url)

                let newName = MainName.replace(NameNum, NameNum + ADDnum++)

                Editor.assetdb.move(info.url, BeforeName + newName + Type);
              }
            });
          }
        }
      });





      // Editor.assetdb.move("db://assets/Texture/HelloWorld.png", "db://assets/Texture/HelloWorld222.png");
      //移动、重命名文件
      // Editor.assetdb.move("db://assets/foo/bar/foobar.js", "db://assets/foo/bar/foobar02.js");



      Editor.info('Citrus_设置资源名称成功!')
    }
  },
};

module.exports = CitrusFuncs;
