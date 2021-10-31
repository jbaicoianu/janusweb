janus.registerElement('xrmenu', {
  buttonwidth: .1,
  buttonheight: .1,
  buttonmargin: 1.2,

  create() {
/*
    this.backing = this.createObject('object', {
      id: 'plane',
      col: '#111',
      scale: V(0, 0, 1),
      pos: V(0, 0, 0),
      renderorder: 9,
    });
*/

    this.worldpos = V();
    this.worlddir = V();
    this.playervec = V();

    let xrmenu = janus.ui.apps.default.apps.xrmenu;
    let asseturl = xrmenu.resolveFullURL('./xrmenu-assets.json');
    fetch(asseturl).then(res => res.json()).then(assetlist => {
      this.assetpack = elation.engine.assets.loadJSON(assetlist, xrmenu.resolveFullURL('./'));

      this.buttons = {
        home: this.createObject('xrmenu-button', {
          pos: V(.08, 0, 0),
          label: 'Home',
          image_id: 'xrmenu-button-home',
          onactivate: (ev) => janus.navigateHome(),
        }),
        back: this.createObject('xrmenu-button', {
          pos: V(.20, 0, 0),
          label: 'Back',
          image_id: 'xrmenu-button-back',
          onactivate: (ev) => janus.navigateBack(),
        }),
        reset: this.createObject('xrmenu-button', {
          pos: V(.32, 0, 0),
          label: 'Reset',
          image_id: 'xrmenu-button-reset',
          onactivate: (ev) => player.reset_position(),
        }),
        reload: this.createObject('xrmenu-button', {
          pos: V(.44, 0, 0),
          label: 'Reload',
          image_id: 'xrmenu-button-reload',
          onactivate: (ev) => location.reload(),
        }),
        exitvr: this.createObject('xrmenu-button', {
          pos: V(.56, 0, 0),
          label: 'Exit VR',
          //image_id: 'xrmenu-button-exitvr',
          onactivate: (ev) => this.engine.client.stopXR(),
        }),
      };
      this.reflow();
    });
  },
  reflow() {
    let buttonnames = Object.keys(this.buttons);
    let width = this.buttonwidth * buttonnames.length * this.buttonmargin,
        height = this.buttonheight * this.buttonmargin;
    //this.backing.scale.x = width;
    //this.backing.scale.y = height;

    for (let i = 0; i < buttonnames.length; i++) {
      let button = this.buttons[buttonnames[i]];
      button.pos.x = (-width / 2) + (this.buttonwidth * this.buttonmargin * (i + .5)) ;
    }
  },
/*
  update() {
    let worldpos = this.localToWorld(this.worldpos.set(0,0,0));
    let worlddir = this.localToWorld(this.worlddir.set(0,0,1)).sub(worldpos).normalize();
    let playervec = player.head.localToWorld(this.playervec.set(0,0,0)).sub(worldpos).normalize();
    let dot = playervec.dot(worlddir);
    let opacity = Math.max(0, dot);
    for (let k in this.buttons) {
      if (this.buttons[k].button) {
        this.buttons[k].button.opacity = opacity;
      }
    }
    //this.backing.opacity = opacity;
  },
*/
});
janus.registerElement('xrmenu-button', {
  onactivate: null,
  image_id: '',

  create() {
    this.button = this.createObject('object', {
      id: 'plane',
      scale: V(.1, .1, .02),
      col: '#fff',
      pos: V(0, 0, .01),
      collision_id: 'cube',
      image_id: this.image_id,
      renderorder: 10,
    });
    this.button.addEventListener('mouseover', ev => this.handleMouseOver(ev));
    this.button.addEventListener('mouseout', ev => this.handleMouseOut(ev));
    this.button.addEventListener('mousedown', ev => this.handleMouseDown(ev));
    this.button.addEventListener('mouseup', ev => this.handleMouseUp(ev));
    this.button.addEventListener('click', ev => this.handleClick(ev));
  },
  handleMouseOver(ev) {
    this.button.emissive = '#595';
  },
  handleMouseOut(ev) {
    this.button.emissive = '#555';
  },
  handleMouseDown(ev) {
    this.button.pos.z = 0;
  },
  handleMouseUp(ev) {
    this.button.pos.z = .01;
  },
  
  handleClick(ev) {
    this.dispatchEvent({type: 'activate'});
  },
});
janus.registerElement('xrmenu-popup', {
  content: 'ui-content',
  element: null,
  width: 512,
  height: 512,
  depth_test: true,
  renderorder: 0,

  create() {

    let element = elation.elements.create(this.content);
    //document.body.appendChild(element);
    //this.shadowdom.appendChild(element);

    let container = document.createElement('div');
    this.shadowdom = container.attachShadow({mode: 'open'});
    //container.appendChild(element);

setTimeout(() => {
    for (let i = 0; i < document.styleSheets.length; i++) {
      let styleel = document.createElement('link');
      styleel.rel = 'stylesheet';
      styleel.href = document.styleSheets[i].href;
      this.shadowdom.appendChild(styleel);
    }
}, 1000);

    this.shadowdom.appendChild(element);
    document.body.appendChild(container);


container.style.position = 'absolute';
container.style.top = '0';
container.style.left = '0';
container.style.zIndex = -1000;
container.style.width = this.width + 'px';
container.style.height = this.height + 'px';
container.style.overflow = 'auto';
container.style.opacity = 0;
//container.style.transform = 'translateX(-40000px)';
//container.style.border = '1px solid red';

this.elementcontainer = container;

setTimeout(() => {
    let canvas = element.toCanvas(this.width, this.height, 1);
/*
document.body.appendChild(canvas);
canvas.style.position = 'absolute';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.zIndex = 1000;
canvas.style.border = '1px solid red';
*/
    this.loadNewAsset('image', {
      id: 'xrmenu-element-canvas',
      canvas: canvas,
    });
    this.plane.image_id = 'xrmenu-element-canvas';
    this.canvas = canvas;
    elation.events.add(canvas, 'update', ev => this.refresh());
}, 1000);

    this.plane = this.createObject('object', {
      id: 'plane',
      collision_id: 'cube',
      collision_scale: V(1, 1, .0001),
      lighting: false,
      //image_id: 'xrmenu-element-canvas',
      scale: V(1, this.height / this.width, 1),
      depth_test: this.depth_test,
      renderorder: this.renderorder,
    });
    this.element = element;
    this.plane.addEventListener('mousemove', ev => this.handleMouse(ev));
    this.plane.addEventListener('mousedown', ev => this.handleMouse(ev));
    this.plane.addEventListener('wheel', ev => this.handleMouse(ev));
    this.plane.addEventListener('mouseup', ev => this.handleMouse(ev));
    this.plane.addEventListener('click', ev => this.handleMouse(ev));
    this.plane.addEventListener('mouseover', ev => this.handleMouseOver(ev));
    this.plane.addEventListener('mouseout', ev => this.handleMouseOut(ev));
  },
  handleMouse(ev) {
    if (this.element && this.canvas) {
      let mousexy = [ev.data.uv.x * this.canvas.width, (1 - ev.data.uv.y) * this.canvas.height];
      let EventClass = (ev.type == 'wheel' ? WheelEvent : MouseEvent);
      let fakeev = new EventClass(ev.type, {
        bubbles: true,
        cancelable: true,
        screenX: mousexy[0],
        screenY: mousexy[1],
        clientX: mousexy[0],
        clientY: mousexy[1],
        view: window,
      });
      //let target = document.elementFromPoint(mousexy[0], mousexy[1]) || this.element;
      let target = this.shadowdom.elementFromPoint(mousexy[0], mousexy[1]) || this.element;
      //let target = document.elementFromPoint(mousexy[0], mousexy[1]) || this.element;
      //console.log(mousexy, fakeev, ev, target);

      target.dispatchEvent(fakeev);

      if (ev.type == 'mousemove') {
        if (target !== this.currenttarget) {
          if (this.currenttarget) {
            let mouseout = new EventClass('mouseout', {
              bubbles: true,
              cancelable: true,
              screenX: mousexy[0],
              screenY: mousexy[1],
              clientX: mousexy[0],
              clientY: mousexy[1],
              view: window,
            });
            this.currenttarget.dispatchEvent(mouseout);
          }
          this.currenttarget = target;
          //let mouseover = elation.events.clone(fakeev, { type: 'mouseover' });
          let mouseover = new EventClass('mouseover', {
            bubbles: true,
            cancelable: true,
            screenX: mousexy[0],
            screenY: mousexy[1],
            clientX: mousexy[0],
            clientY: mousexy[1],
            view: window,
          });
          target.dispatchEvent(mouseover);
        }
      }
//this.element.updateCanvas();
//setTimeout(() => this.element.updateCanvas(), 10);
    }
  },
  handleMouseOver(ev) {
    this.elementcontainer.style.zIndex = 1000;
    if (!this.elementcontainer.parentNode) {
      document.body.appendChild(this.elementcontainer);
    }
  },
  handleMouseOut(ev) {
    this.elementcontainer.style.zIndex = -1000;
    if (this.elementcontainer.parentNode) {
      this.elementcontainer.parentNode.removeChild(this.elementcontainer);
    }
  },
});
