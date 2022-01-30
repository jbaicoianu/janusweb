elation.extend('engine.assetloader.agent.janus-vfs', new function() {
  this.initBrowserFS = function() {
    return new Promise((accept, reject) => {
      BrowserFS.configure({
        fs: "MountableFileSystem",
        options: {
          //'/': { fs: "LocalStorage" },
          //'/blurp': { fs: "IndexedDB", options: { storeName: 'janusVFS' } },
          '/': { fs: "IndexedDB", options: { storeName: 'janusVFS' } },
          //'/mnt/usb0': { fs: "LocalStorage" }
        }
      }, (e) => {
        if (e) {
        } else {
          var fs = BrowserFS.BFSRequire('fs');
          this.fs = fs;
          accept(this.fs);
        }
      });
    });
  }

  this.getFS = async function() {
    if (!this.fs) {
      await this.initBrowserFS();
    }
    return this.fs;
  }

  this.fetch = async function(url) {
    let fs = await this.getFS();

    let pathparts = url.split('://');
    return new Promise((resolve, reject) => {
      let filepath = pathparts[1];
      fs.readFile(filepath, ( e, file) => {
        if (file) {
          resolve({
            target: {
              responseURL: url,
              data: file.buffer,
              response: file.buffer,
              getResponseHeader(header) {
                if (header.toLowerCase() == 'content-type') {
                  // FIXME -  We should implement mime type detection at a lower level, and avoid the need to access the XHR object in calling code
                  return 'application/octet-stream';
                }
              }
            },
          });
        } else {
          reject();
        }
      });
    });
  }
});

elation.elements.define('janus.ui.vfs.browser', class extends elation.elements.base {
  init() {
    super.init();
    this.defineAttributes({
      cwd: { type: 'string', default: '/' },
      chroot: { type: 'string', default: '' },
    });
  }
  create() {
    super.create();

/*
    this.win = elation.elements.create('ui-window', {
      append: document.body,
      center: true,
      windowtitle: '/',
    });
*/
    this.content = elation.elements.create('ui-rowlayout', {
      append: this,
    });
    this.controls = elation.elements.create('ui-content', {
      append: this.content,
    });
    this.updirbutton = elation.elements.create('ui-button', {
      append: this.controls,
      label: '⬅',
      onclick: ev => this.handleUpDirectoryClick(ev),
    });
    this.deletebutton = elation.elements.create('ui-button', {
      append: this.controls,
      label: '🗑️',
      onclick: ev => this.handleDeleteClick(ev),
    });
    this.addbuttonlist = elation.elements.create('ui-list', {
      selectable: true,
      items: ['Upload', 'Directory', 'HTML', 'JS'],
      onselectionchange: ev => this.handleAddButtonSelect(ev),
    });
    this.addbutton = elation.elements.create('ui-popupbutton', {
      append: this.controls,
      label: '➕',
      popupcontent: this.addbuttonlist,
    });
    this.mainpanel = elation.elements.create('ui-flexpanel', {
      append: this.content,
    });

    this.dirtree = elation.elements.create('ui-treeview', {
      append: this.mainpanel,
      attrs: {
        name: 'path',
        label: 'name',
      },
    });
    elation.events.add(this.dirtree, 'ui_treeview_select', ev => this.handleDirectoryTreeSelect(ev));

    this.dirlist = elation.elements.create('janus-ui-vfs-browser-directorylist', {
      append: this.mainpanel,
      itemcomponent: 'janus-ui-vfs-browser-file',
      selectable: true,
      multiselect: true,
      draggable: true,
    });
    elation.events.add(this.dirlist, 'directorychange', ev => this.handleDirectoryChange(ev));
    elation.events.add(this.dirlist, 'selectionchange', ev => this.handleFilesSelectionChange(ev));

    elation.events.add(this.dirlist, 'dragstart', ev => this.handleDragStart(ev));
    elation.events.add(this.dirlist, 'dragover', ev => this.handleDragOver(ev));
    elation.events.add(this.dirlist, 'dragenter', ev => this.handleDragEnter(ev));
    elation.events.add(this.dirlist, 'dragleave', ev => this.handleDragLeave(ev));
    elation.events.add(this.dirlist, 'drop', ev => this.handleDrop(ev));

    elation.events.add(this.dirlist, 'keypress', ev => this.handleFilesKeypress(ev));

    //this.win.setcontent(this);
    this.updateDirectories();
    this.updateFiles();
  }
  async updateFiles() {
    let fs = await elation.engine.assetloader.agent['janus-vfs'].getFS();

    fs.readdir(this.chroot + this.cwd, (e, contents) => {
      let entries = {};
      let promises = [];
      for (let i = 0; i < contents.length; i++) {
        promises.push(new Promise(accept => {
          fs.stat(this.chroot + this.cwd + contents[i], (e, stats) => {
            entries[contents[i]] = {
              name: contents[i],
              path: this.cwd,
              stats: stats,
            };
            accept(stats);
          });
        }));
      }
      Promise.all(promises).then(() => {
        this.dirlist.clear();
        this.dirlist.setItems(entries);
      });
    });
    this.updirbutton.disabled = (this.cwd == '/');
    this.deletebutton.disabled = (this.dirlist.selection.length == 0);
    //this.win.settitle(this.cwd);
  }
  async updateDirectories() {
    let dirtree = {
      '/': {
        name: '/',
        path: '/',
        items: await this.getDirectoryTree(),
      }
    };
    this.dirtree.setItems(dirtree);
    let selected = this.dirtree.find(this.cwd);
    if (selected) {
      selected.select();
    }

console.log('my full dirtree', dirtree, this.dirtree, selected);
  }
  async getDirectoryTree(dir='/', entries) {
    if (!entries) entries = {};
    let fs = await elation.engine.assetloader.agent['janus-vfs'].getFS();
    return new Promise(async (resolve, reject) => {
      fs.readdir(this.chroot + dir, async (e, contents) => {
        let promises = [];
        for (let i = 0; i < contents.length; i++) {
          promises.push(new Promise(accept => {
            let stats = fs.stat(this.chroot + dir + contents[i], async (e, stats) => {
              if (stats.isDirectory()) {
                entries[contents[i]] = {
                  name: contents[i],
                  path: dir + contents[i] + '/',
                  stats: stats,
                };
                let children = await this.getDirectoryTree(dir + contents[i] + '/');
                entries[contents[i]].items = (Object.keys(children).length > 0 ? children : false);
              }
              accept();
            });
          }));
        }
        await Promise.all(promises);
        resolve(entries);
      });
    });
  }
  chdir(dir) {
    this.cwd = dir + (dir.lastIndexOf('/') != dir.length - 1 ? '/' : '');
    this.dirlist.selectall(false);

    let selected = this.dirtree.find(this.cwd);
    if (selected && selected !== this.dirtree.selected) {
      selected.select();
    } else {
      this.updateFiles();
    }
  }
  updir() {
    let pathparts = this.cwd.split('/');
    pathparts.pop();
    pathparts.pop();
    let newpath = (pathparts.length > 0 ? pathparts.join('/') + '/' : '/');
    //newpath = newpath.replaceAll('//', '/');
    this.chdir(newpath);
  }
  async mkdir(dir) {
    let fs = await elation.engine.assetloader.agent['janus-vfs'].getFS();
    let fulldir = this.chroot + (dir[0] == '/' ? dir : this.cwd + dir);
    await fs.mkdir(fulldir);
    this.updateDirectories();
    this.updateFiles();
  }
  async rm(files) {
    let fs = await elation.engine.assetloader.agent['janus-vfs'].getFS();
    if (!elation.utils.isArray(files)) files = [files];
console.log('delete files', files);
    let promises = [];
    files.forEach(file => {
      promises.push(new Promise((resolve, reject) => {
        fs.unlink(this.chroot + this.cwd + file, e => {
          if (!e) {
            resolve();
          } else {
            reject();
          }
        });
      }));
    });
    await Promise.all(promises);
    this.updateFiles();
  }
  async rmdir(dirs) {
    let fs = await elation.engine.assetloader.agent['janus-vfs'].getFS();
    if (!elation.utils.isArray(dirs)) dirs = [dirs];
console.log('delete dirs', dirs);
    let promises = [];
    dirs.forEach(dir => {
      promises.push(new Promise((resolve, reject) => {
        fs.rmdir(this.chroot + this.cwd + dir, e => {
          if (!e) {
            resolve();
          } else {
            reject();
          }
        });
      }));
    });
    await Promise.all(promises);
    this.updateDirectories();
    this.updateFiles();
  }
  showUploadPrompt() {
    let input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.style.width = 0;
    input.style.height = 0;
    input.style.overflow = 'hidden';
    input.addEventListener('change', ev => this.handleFileUpload(ev));
    this.appendChild(input);
    input.click();
  }
  handleDirectoryTreeSelect(ev) {
    let newpath = ev.data.item.path;
    this.chdir(newpath);
  }
  handleDirectoryChange(ev) {
    let newdir = ev.target;
    let newpath = newdir.path + newdir.name;
    this.chdir(newpath);
  }
  handleUpDirectoryClick(ev) {
    if (!ev.target.disabled) {
      this.updir();
    }
  }
  handleDeleteClick(ev) {
    if (this.dirlist.selection.length > 0) {
      console.log('delete', this.dirlist.selection);
      let files = this.dirlist.selection.filter(n => !n.stats.isDirectory()).map(n => n.name),
          dirs = this.dirlist.selection.filter(n => n.stats.isDirectory()).map(n => n.name);
      if (files.length > 0) this.rm(files);
      if (dirs.length > 0) this.rmdir(dirs);
      this.dirlist.selectall(false);
    }
  }
  handleAddButtonSelect(ev) {
    let selected = this.addbuttonlist.selection[0];
    if (selected) {
      this.addbuttonlist.selectall(false);
      this.addbutton.hidePopup();

      switch(selected.value) {
        case 'Upload':
          this.showUploadPrompt();
          break;
        case 'Directory':
          let dirname = prompt('Directory name?'); // FIXME - make this an HTML pop-up prompt
          if (dirname !== null) {
            this.mkdir(dirname);
          }
      }
    }
  }
  handleFilesSelectionChange(ev) {
    this.deletebutton.disabled = (this.dirlist.selection.length == 0);
  }
  handleFilesKeypress(ev) {
    if (ev.keyCode == 127) {
      this.handleDeleteClick(ev);
    }
  }
  async handleFileUpload(ev) {
    let files = ev.target.files;
    console.log('upload some files', ev, files);
    if (files && files.length > 0) {
      let filenames = await this.saveFiles(files);
      console.log('finished writing files', filenames);
    }
  }
  handleDragStart(ev) {
    let urilist = '';
    this.dirlist.selection.forEach(f => {
      urilist += 'janus-vfs://' + this.chroot + this.cwd + f.name + '\r\n';
    });
    ev.dataTransfer.setData('text/uri-list', urilist);
    console.log('drag it!', urilist, ev, this.dirlist.selection);
  }
  handleDragOver(ev) {
    ev.dataTransfer.dropEffect = "copy"
    ev.preventDefault();
  }
  handleDragEnter(ev) {
    let dragtarget = this.getDragTarget(ev);
    if (dragtarget && !dragtarget.hasclass('dragactive')) {
      dragtarget.addclass('dragactive');
    }
  }
  handleDragLeave(ev) {
    //let dragtarget = this.getDragTarget(ev);
    let dragtarget = ev.target;
    if (dragtarget && elation.html.hasclass(dragtarget, 'dragactive')) elation.html.removeclass(dragtarget, 'dragactive');
    if (this.dirlist.hasclass('dragactive') && !this.dirlist.contains(dragtarget)) this.dirlist.removeclass('dragactive');
  }
  async handleDrop(ev) {
    ev.preventDefault();
    let dragtarget = this.getDragTarget(ev);
    if (dragtarget) dragtarget.removeclass('dragactive');
    let files = ev.dataTransfer.files;
    let subdir = (dragtarget instanceof elation.elements.janus.ui.vfs.browser.file && dragtarget.stats.isDirectory() ? dragtarget.name : '');
    console.log('upload some files', ev, files);
    if (files && files.length > 0) {
      let filenames = await this.saveFiles(files, subdir);
      console.log('finished writing files', filenames);
    }
  }
  getDragTarget(ev) {
    let dragtarget = ev.target;

    while (dragtarget !== this.dirlist && !(dragtarget instanceof elation.elements.janus.ui.vfs.browser.file && dragtarget.stats.isDirectory())) {
      dragtarget = dragtarget.parentNode;
    }
console.log('my dragtarget!', dragtarget);
    return dragtarget;
  }
  async saveFiles(files, subdir) {
    let fs = await elation.engine.assetloader.agent['janus-vfs'].getFS();

    let Buffer = BrowserFS.BFSRequire('buffer').Buffer;
    let promises = [];
    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      let fname = this.chroot + this.cwd + (subdir ? subdir + '/' : '') + file.name;
      console.log('Got file!', file.name, file.size, fname);
      promises.push(new Promise((accept, reject) => {
        let reader = new FileReader();
        reader.onload = function() {
          let buffer = Buffer.from(this.result);
          fs.writeFile(fname, buffer, (e, f) => {
            accept(fname);
          });
        }
        reader.readAsArrayBuffer(file);
      }));
    }
    Promise.all(promises).then((filenames) => {
      this.updateFiles();
      return filenames;
    });
  }
});
elation.elements.define('janus.ui.vfs.browser.directorytree', class extends elation.elements.ui.treeview {
  create() {
    super.create();
  }
});
elation.elements.define('janus.ui.vfs.browser.directorylist', class extends elation.elements.ui.list {
  create() {
    super.create();
  }
});
elation.elements.define('janus.ui.vfs.browser.directory', class extends elation.elements.ui.item {
  create() {
  }
});
elation.elements.define('janus.ui.vfs.browser.file', class extends elation.elements.ui.item {
  create() {
    super.create();

    this.name = this.value.name;
    this.path = this.value.path;
    this.stats = this.value.stats;

    this.title = this.name;

    elation.elements.create('ui-label', {
      append: this,
      label: this.name + (this.stats.isDirectory() ? '/' : ''),
    });

    this.addEventListener('dblclick', ev => this.handleDblClick(ev));
  }
  handleDblClick(ev) {
    if (this.stats.isDirectory()) {
      this.dispatchEvent({type: 'directorychange', bubbles: true});
    } else {
      console.log('do something with this thing!', this);
    }
    ev.preventDefault();
  }
});
