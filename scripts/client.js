elation.require(['engine.engine', 'engine.things.player', 'engine.things.light', 'janusweb.janusweb'], function() {
  elation.component.add('janusweb.client', function() {
    this.initEngine = function() {
      //this.enginecfg.systems.push('admin');
    }
    this.initWorld = function() {
      var things = this.world.load({
        name: 'janusweb',
        type: 'janusweb',
        properties: {
        },
        things: {
          ambient: {
            name: 'ambient',
            type: 'light_ambient',
            properties: {
              color: 0x444444
            }
          },
          sun: {
            name: 'sun',
            type: 'light_directional',
            properties: {
              position: [-20,50,25],
              intensity: 0.1
            }
          },
          point: {
            name: 'point01',
            type: 'light_point',
            properties: {
              position: [22,19,-15],
              intensity: 0.1
            }
          },
          player: {
            name: 'player',
            type: 'player',
            properties: {
              position: [0,0,0],
              mass: 10
            }
          },
        }
      });
      this.player = things.children.janusweb.children.player;
    }
  }, elation.engine.client);
});
