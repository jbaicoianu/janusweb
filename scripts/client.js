elation.require(['engine.engine', 'engine.assets', 'engine.things.player', 'engine.things.light_ambient', 'engine.things.light_directional', 'engine.things.light_point', 'janusweb.janusweb', 'janusweb.chat'], function() {
  elation.extend('janusweb.init', function(args) {
    if (!args) args = {};
    var proto = elation.utils.any(args.protocol, elation.config.get('dependencies.protocol'), document.location.protocol);
    var host = elation.utils.any(args.host, elation.config.get('dependencies.host'), document.location.host);
    var rootdir = elation.utils.any(args.rootdir, elation.config.get('dependencies.rootdir'), document.location.path);
    var path = elation.utils.any(args.path, elation.config.get('dependencies.path'), '/');
    var homepage = elation.utils.any(args.homepage, elation.config.get('janusweb.homepage'), document.location.href);

    var fullpath = proto + '//' + host + rootdir;

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fullpath + 'janusweb.css';
    document.head.appendChild(link);
    elation.html.addclass(document.body, 'dark');
    var janusweb = elation.janusweb.client({append: document.body, homepage: homepage});
    return janusweb;
  });
  elation.component.add('janusweb.client', function() {
    this.initEngine = function() {
      var hashargs = elation.url();
       
      this.enginecfg.stats = false;

      this.enginecfg.systems = [];
      this.enginecfg.systems.push("controls");
      this.enginecfg.systems.push("physics");
      this.enginecfg.systems.push("world");
      this.enginecfg.systems.push("ai");
      if (hashargs.admin == 1) {
        this.enginecfg.systems.push("admin");
      } 
      this.enginecfg.systems.push("render");
      this.enginecfg.systems.push("sound");
    }
    this.initWorld = function() {
      var things = this.world.load({
        name: 'janusweb',
        type: 'janusweb',
        properties: {
          corsproxy: elation.config.get('janusweb.network.corsproxy'),
          datapath: elation.config.get('janusweb.datapath'),
          homepage: this.args.homepage
        },
        things: {
          player: {
            name: 'player',
            type: 'player',
            properties: {
              position: [0,0,0],
              mass: 10,
              movespeed: 100,
              collidable: false
            }
          },
        }
      });
      this.janusweb = things.children.janusweb;
      this.player = this.janusweb.children.player;
    }
    this.showAbout = function() {
      var aboutwin = elation.ui.window({append: document.body, center: true, title: 'About JanusWeb'});
      var frame = elation.ui.iframe({src: 'http://github.com/jbaicoianu/janusweb/', classname: 'janusweb_about'});
      aboutwin.setcontent(frame);
    }
  }, elation.engine.client);
});
