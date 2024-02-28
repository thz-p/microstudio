this.Manager = (function() {
  function Manager(app) {
    this.app = app;
  }

  Manager.prototype.init = function() {
    var create_asset, create_folder;
    this.folder_view = new FolderView(this, document.getElementById(this.item + "list"));
    this.folder_view.init();
    this.splitbar = new SplitBar(this.main_splitpanel || (this.folder + "-section"), "horizontal");
    this.splitbar.initPosition(20);
    create_asset = document.querySelector("#" + this.item + "-asset-bar .create-asset-button");
    create_folder = document.querySelector("#" + this.item + "-asset-bar .create-folder-button");
    create_asset.addEventListener("click", (function(_this) {
      return function() {
        return _this.createAsset(_this.folder_view.selected_folder);
      };
    })(this));
    create_folder.addEventListener("click", (function(_this) {
      return function() {
        var f, parent;
        parent = _this.folder_view.selected_folder || _this.folder_view.folder;
        f = parent.createEmptyFolder();
        f["protected"] = true;
        _this.rebuildList();
        _this.folder_view.setSelectedFolder(f);
        return _this.folder_view.editFolderName(f);
      };
    })(this));
    document.getElementById(this.item + "-name").disabled = true;
    this.name_validator = new InputValidator(document.getElementById(this.item + "-name"), document.getElementById(this.item + "-name-button"), null, (function(_this) {
      return function(value) {
        var item, name, old;
        if (!_this.selected_item) {
          return;
        }
        item = _this.app.project[_this.get_item](_this.selected_item);
        if (item == null) {
          return;
        }
        if (_this.app.project.isLocked(_this.folder + "/" + item.name + "." + item.ext)) {
          return;
        }
        _this.app.project.lockFile(_this.folder + "/" + item.name + "." + item.ext);
        name = value[0].toLowerCase();
        name = RegexLib.fixFilename(name);
        document.getElementById(_this.item + "-name").value = name;
        _this.name_validator.update();
        if (name !== item.shortname && RegexLib.filename.test(name) && (_this.app.project[_this.get_item](item.path_prefix + name) == null)) {
          old = _this.selected_item;
          _this.selected_item = item.path_prefix + name;
          return _this.app.client.sendRequest({
            name: "rename_project_file",
            project: _this.app.project.id,
            source: _this.folder + "/" + old + "." + item.ext,
            dest: _this.folder + "/" + (item.path_prefix + name) + "." + item.ext,
            thumbnail: _this.use_thumbnails
          }, function(msg) {
            item.rename(item.path_prefix + name);
            _this.app.project[_this.update_list]();
            if (_this.selectedItemRenamed != null) {
              return _this.selectedItemRenamed();
            } else {
              return _this.setSelectedItem(item.name);
            }
          });
        } else {
          return document.getElementById(_this.item + "-name").value = item.shortname;
        }
      };
    })(this));
    this.name_validator.regex = RegexLib.filename;
    return document.getElementById("delete-" + this.item).addEventListener("click", (function(_this) {
      return function() {
        return _this.deleteItem();
      };
    })(this));
  };

  Manager.prototype.renameItem = function(item, name) {
    return this.app.client.sendRequest({
      name: "rename_project_file",
      project: this.app.project.id,
      source: this.folder + "/" + item.filename,
      dest: this.folder + "/" + name + "." + item.ext,
      thumbnail: this.use_thumbnails
    }, (function(_this) {
      return function(msg) {
        return _this.app.project[_this.update_list]();
      };
    })(this));
  };

  Manager.prototype.update = function() {
    return this.splitbar.update();
  };

  Manager.prototype.projectOpened = function() {
    this.app.project.addListener(this);
    this.setSelectedItem(null);
    return this.folder_view.setSelectedFolder(null);
  };

  Manager.prototype.projectUpdate = function(change) {
    if (change === this.list_change_event) {
      return this.rebuildList();
    } else if (change === "locks") {
      return this.updateActiveUsers();
    }
  };

  Manager.prototype.rebuildList = function() {
    this.folder_view.rebuildList(this.app.project[this.item + "_folder"]);
    this.updateActiveUsers();
    if ((this.selected_item != null) && (this.app.project[this.get_item](this.selected_item) == null)) {
      this.setSelectedItem(null);
    }
  };

  Manager.prototype.updateActiveUsers = function(folder) {
    var e, f, i, j, len, len1, lock, ref, ref1;
    if (folder == null) {
      folder = this.app.project[this.item + "_folder"];
    }
    ref = folder.subfolders;
    for (i = 0, len = ref.length; i < len; i++) {
      f = ref[i];
      this.updateActiveUsers(f);
    }
    ref1 = folder.files;
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      f = ref1[j];
      lock = this.app.project.isLocked(this.folder + "/" + f.filename);
      e = f.element;
      if (e != null) {
        if ((lock != null) && Date.now() < lock.time) {
          e.querySelector(".active-user").style = "display: block; background: " + (this.app.appui.createFriendColor(lock.user)) + ";";
        } else {
          e.querySelector(".active-user").style = "display: none;";
        }
      }
    }
  };

  Manager.prototype.openItem = function(name) {
    var item;
    item = this.app.project[this.get_item](name);
    if (item != null) {
      return this.setSelectedItem(name);
    }
  };

  Manager.prototype.setSelectedItem = function(item) {
    this.selected_item = item;
    this.folder_view.setSelectedItem(item);
    if (this.selected_item != null) {
      document.getElementById(this.item + "-name").disabled = false;
      item = this.app.project[this.get_item](this.selected_item);
      document.getElementById(this.item + "-name").value = item != null ? item.shortname : "";
      this.name_validator.update();
      if (item != null) {
        document.getElementById(this.item + "-name").disabled = (item.canBeRenamed != null) && !item.canBeRenamed();
        document.getElementById("delete-" + this.item).style.display = (item.canBeRenamed != null) && !item.canBeRenamed() ? "none" : "inline-block";
      }
      if ((item != null) && item.uploading) {
        return document.getElementById(this.item + "-name").disabled = true;
      }
    } else {
      document.getElementById(this.item + "-name").value = "";
      return document.getElementById(this.item + "-name").disabled = true;
    }
  };

  Manager.prototype.checkNameFieldActivation = function() {
    var item;
    if (!this.selected_item) {
      return;
    }
    item = this.app.project[this.get_item](this.selected_item);
    if (item != null) {
      return document.getElementById(this.item + "-name").disabled = item.uploading ? true : false;
    }
  };

  Manager.prototype.deleteItem = function() {
    var a, text;
    if (this.selected_item != null) {
      a = this.app.project[this.get_item](this.selected_item);
      if ((a != null) && (a.canBeRenamed == null) || a.canBeRenamed()) {
        if (this.app.project.isLocked(this.folder + "/" + a.name + "." + a.ext)) {
          return;
        }
        this.app.project.lockFile(this.folder + "/" + a.name + "." + a.ext);
        text = this.app.translator.get("Do you really want to delete %ITEM%?").replace("%ITEM%", this.selected_item.replace(/-/g, "/"));
        return ConfirmDialog.confirm(text, this.app.translator.get("Delete"), this.app.translator.get("Cancel"), (function(_this) {
          return function() {
            return _this.app.client.sendRequest({
              name: "delete_project_file",
              project: _this.app.project.id,
              file: a.file,
              thumbnail: _this.use_thumbnails
            }, function(msg) {
              _this.app.project[_this.update_list]();
              _this.setSelectedItem(null);
              if (_this.selectedItemDeleted != null) {
                return _this.selectedItemDeleted();
              }
            });
          };
        })(this));
      }
    }
  };

  Manager.prototype.findNewFilename = function(name, getter, folder) {
    var count, path;
    name = RegexLib.fixFilename(name);
    if (name.length > 30) {
      name = name.substring(0, 30);
    }
    path = folder != null ? folder.getFullDashPath() + "-" + name : name;
    if (this.app.project[getter](path)) {
      count = 2;
      while (this.app.project[getter](path + count)) {
        count += 1;
      }
      name = name + count;
    }
    return name;
  };

  Manager.prototype.deleteFolder = function(folder) {
    if (!folder.containsFiles()) {
      return folder["delete"]();
    } else {
      return ConfirmDialog.confirm(this.app.translator.get("Do you really want to delete this folder and all its contents?"), this.app.translator.get("Delete"), this.app.translator.get("Cancel"), (function(_this) {
        return function() {
          var f, files, i, len;
          console.info("Deleting " + folder.name);
          folder["protected"] = false;
          files = folder.getAllFiles();
          for (i = 0, len = files.length; i < len; i++) {
            f = files[i];
            _this.app.client.sendRequest({
              name: "delete_project_file",
              project: _this.app.project.id,
              file: f.file,
              thumbnail: _this.use_thumbnails
            }, function(msg) {
              _this.app.project[_this.update_list]();
              return _this.setSelectedItem(null);
            });
          }
          if (folder.parent != null) {
            folder.parent.removeFolder(folder);
          }
        };
      })(this));
    }
  };

  return Manager;

})();

// 这段代码实现了一个名为 `Manager` 的类，用于管理项目中的文件和文件夹。其主要功能包括：

// 1. 构造函数：接收应用程序对象作为参数，并将其保存在属性中。
// 2. 初始化方法：初始化管理器，创建文件夹视图和拆分栏，并添加创建文件和文件夹的事件监听器。
// 3. 重命名项目中的文件或文件夹的方法。
// 4. 更新拆分栏位置的方法。
// 5. 处理项目打开和更新的方法，用于添加项目监听器和根据项目变化更新列表。
// 6. 重建文件夹列表的方法，根据项目中的文件夹和文件信息重新构建文件夹视图。
// 7. 更新活跃用户信息的方法，根据项目中的锁信息更新文件夹视图中的活跃用户显示。
// 8. 打开项目中特定文件或文件夹的方法。
// 9. 设置选定的项目的方法，用于更新文件夹视图和选中的项目输入框。
// 10. 检查名称字段是否激活的方法，根据选定的项目和上传状态更新名称输入框的可用状态。
// 11. 删除项目中的文件或文件夹的方法，先确认是否要删除，然后发送请求给服务器删除文件，最后更新列表和选定的项目。
// 12. 查找新文件名的方法，用于确保文件名在项目中是唯一的。

// 这段代码实现了文件和文件夹的管理功能，包括初始化、重命名、更新、打开、删除等操作。