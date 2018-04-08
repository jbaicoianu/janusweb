elation.require(['utils.template', 'elements.elements', 'elements.ui.all', 'elements.collection.all'], function() {
  elation.component.add('janusweb.ui.main', function() {
    this.init = function() {
      this.addclass('janusweb_ui_main');
/*
      var template = document.getElementById('janus-ui');
      if (template) {
        this.container.innerHTML = template.innerHTML;
        elation.component.init();
      }
*/
      var datapath = elation.config.get('janusweb.datapath', '/media/janusweb');
      var configurl = this.args.config || datapath + '/assets/webui/default.json'
      this.loadConfig(configurl).then((uicfg) => {
        console.log('UI config', uicfg);
        this.container.innerHTML = elation.template.get('janusweb.ui');
      });
    }
    this.loadConfig = function(url) {
      return new Promise((resolve, reject) => {
        console.log('Loading UI config:', url);
        fetch(url)
          .then((r) => r.json())
          .then((json) => this.processJSON(url, json))
          .then(resolve, reject);
      });
    }
    this.processJSON = function(url, json) {
      var urlparts = url.split('/');
      urlparts.pop();
      var baseurl = urlparts.join('/');
      return new Promise((resolve, reject) => {
        //console.log('process the json', json);

        this.loadIncludes(json.includes, baseurl)
          .then(() => this.loadApps(json.apps, baseurl))
          .then(() => this.loadTemplates(json.templates, baseurl))
          .then(() => this.loadScriptsAndCSS(json.scripts, json.css, baseurl))
          .then(() => resolve(json));
      });
    }
    this.loadIncludes = function(includes, baseurl) {
      var promises = [];
      if (includes) {
        for (var i = 0; i < includes.length; i++) {
          //console.log(' - load include', includes[i], baseurl);
          promises.push(this.loadConfig(this.resolveFullURL(includes[i], baseurl)));
        }
        return Promise.all(promises);
      } else {
        return new Promise((resolve, reject) => resolve());
      }
    }
    this.loadApps = function(apps, baseurl) {
      var promises = [];
      if (apps) {
        for (var k in apps) {
          //console.log(' - load app', k, apps[k], baseurl);
          promises.push(this.loadConfig(baseurl + '/' + apps[k]));
        }
        return Promise.all(promises);
      } else {
        return new Promise((resolve, reject) => resolve());
      }
    }
    this.loadScriptsAndCSS = function(scripts, css, baseurl) {
      //console.log('get all these scripts and css', scripts, css);
      var promises = [];
      if (scripts) {
        for (var i = 0; i < scripts.length; i++) {
          promises.push(new Promise((resolve, reject) => {
            var scripturl = this.resolveFullURL(scripts[i], baseurl);
            
            elation.file.get('javascript', scripturl, () => resolve());
          }));
        }
      }
      if (css) {
        for (var i = 0; i < css.length; i++) {
          var cssurl = this.resolveFullURL(css[i], baseurl);
          
          elation.file.get('css', cssurl);
        }
      }
      return Promise.all(promises);
    }
    this.loadTemplates = function(templates, baseurl) {
      //console.log('get all these templates', templates, baseurl);
      var promises = [];
      if (templates) {
        for (var k in templates) {
          var templateurl = this.resolveFullURL(templates[k], baseurl);
          promises.push(this.loadTemplate(k, templateurl));
        }
      }
      return Promise.all(promises);
    }
    this.loadTemplate = function(name, url) {
      //console.log('load template:', name, url);
      return new Promise((resolve, reject) => {
        fetch(url).then((r) => r.text().then((t) => { 
          elation.template.add(name, t);
          resolve(); 
        }));
      });
    }
    this.resolveFullURL = function(url, baseurl) {
      var baseparts = baseurl.split('/');
      var urlparts = url.split('/');
      if (urlparts[0][0] == '.') {
        if (urlparts[0] == '.') {
          urlparts.shift();
        }
        while (urlparts[0] == '..') {
          urlparts.shift();
          baseparts.pop();
        }
        return baseparts.join('/') + '/' + urlparts.join('/');
      }
      return url;
    }
  }, elation.ui.base);
});
