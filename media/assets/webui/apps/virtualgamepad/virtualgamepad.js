elation.elements.define('janus.controls.gamepad', class extends elation.elements.base {
  init() {
    super.init();
    this.defineAttributes({
      id: { type: 'string', default: 'Virtual Gamepad' },
      connected: { type: 'boolean', default: true },
      numaxes: { type: 'integer', default: 2 },
      numbuttons: { type: 'integer', default: 2 },
    });

    this.cfg = {
      sticks: [
        {
          axes: [0, 1],
          style: 'analog',
          position: [ 0, .95 ],
          bottom: 1,
          left: 1
        },
        {
          axes: [2, 3],
          style: 'analog',
          position: [ .95, .95 ],
          bottom: 1,
          right: 1
        }
      ],
      buttons: [
/*
        {
          label: 'A',
          position: [ .95, .99 ],
          axis: 4,
          right: 1,
          bottom: 1
        },
        {
          label: 'B',
          position: [ .975, .91 ],
          axis: 5,
          right: 1,
          bottom: 1
        }
*/
      ]
    };

    this.timestamp = performance.now();
  }
  create() {
    this.axes = [];
    this.sticks = [];
    this.buttons = [];

/*
this.debug = elation.elements.create('div', { append: document.body });
this.debug.style.position = 'fixed';
this.debug.style.top = '10px';
this.debug.style.left = '10px';
this.debug.style.zIndex = '1000';
*/

    for (var i = 0; i < this.cfg.sticks.length; i++) {
      let stickcfg = this.cfg.sticks[i];
      let style = stickcfg.style || 'analog'
      let stick = elation.elements.create('janus.controls.' + style, {
        append: this,
        axes: stickcfg.axes,
        position: stickcfg.position,
        top: (stickcfg.top || false),
        left: (stickcfg.left || false),
        bottom: (stickcfg.bottom || false),
        right: (stickcfg.right || false),
      });
      elation.events.add(stick, 'axis_change', (ev) => { this.axes[ev.data.axis] = ev.data.value; /*this.debug.innerHTML = JSON.stringify(this.axes); */});
      this.sticks[i] = stick;
      setTimeout(() => { stick.resetStickPosition(); }, 10);
    }
    for (var i = 0; i < this.cfg.buttons.length; i++) {
      let buttoncfg = this.cfg.buttons[i];
      let button = elation.elements.create('janus.controls.button', {
        append: this,
        label: buttoncfg.label,
        position: buttoncfg.position,
        top: (buttoncfg.top || false),
        left: (buttoncfg.left || false),
        bottom: (buttoncfg.bottom || false),
        right: (buttoncfg.right || false),
      });
      this.buttons[i] = button;
    }

    if (this.position) {
      this.style.position = 'fixed';
      this.style.left = (this.position[0] * 100) + '%';
      this.style.top = (this.position[1] * 100) + '%';
    }

    let janus = elation.component.fetch(this.queryParentSelector('[data-elation-component="janusweb.client"]'))
    if (janus) {
      janus.engine.systems.controls.addVirtualGamepad(this);
      this.hide();
      janus.engine.systems.render.renderer.domElement.addEventListener('touchstart', (ev) => {
        this.show();
        this.reset();
        if (!player.enabled) player.enable();
      });
    }
  }
  reset() {
    for (let i = 0; i < this.axes.length; i++) {
      if (this.sticks[i]) {
        this.sticks[i].resetStickPosition();
      }
    }
  }
});
elation.elements.define('janus.controls.button', class extends elation.elements.base {
  init(axes, buttons) {
    super.init();
    this.defineAttributes({
      label: { type: 'string' },
      pressed: { type: 'boolean', default: false },
      touched: { type: 'boolean', default: false },
      value: { type: 'float', default: 0.0 },
      position: { type: 'array' },
    });
  }
  create() {
    if (this.label) {
      this.innerHTML = this.label;
    }
    elation.events.add(this, 'mousedown', (ev) => this.handleMouseDown(ev));
    elation.events.add(this, 'mouseup', (ev) => this.handleMouseUp(ev));
    elation.events.add(this, 'touchstart', (ev) => this.handleTouchStart(ev));
    elation.events.add(this, 'touchend', (ev) => this.handleTouchEnd(ev));

    if (this.position) {
      this.style.position = 'fixed';
      this.style.left = (this.position[0] * 100) + '%';
      this.style.top = (this.position[1] * 100) + '%';
    }
  }
  touch() {
    this.touched = true;
  }
  untouch() {
    this.touched = false;
  }
  press() {
    this.pressed = true;
  }
  unpress() {
    this.pressed = false;
  }
  handleMouseDown(ev) {
    this.touch();
    this.press();
    ev.preventDefault();
    ev.stopPropagation();
  }
  handleMouseUp(ev) {
    this.unpress();
    this.untouch();
  }
  handleTouchStart(ev) {
    this.touch();
    this.press();
    ev.preventDefault();
    ev.stopPropagation();
  }
  handleTouchEnd(ev) {
    this.unpress();
    this.untouch();
  }
});
elation.elements.define('janus.controls.analog', class extends elation.elements.base {
  init() {
    super.init();
    this.defineAttributes({
      x: { type: 'float', default: 0 },
      y: { type: 'float', default: 0 },
      axes: { type: 'array', default: [0, 1] },
      position: { type: 'array' }
    });
  }
  create() {
    this.stick = elation.elements.create('janus.controls.analogstick', {
      append: this
    });
/*
    this.debug = elation.elements.create('div', {
      append: this
    });
*/
    this.handleTouchStart = elation.bind(this, this.handleTouchStart);
    this.handleTouchMove = elation.bind(this, this.handleTouchMove);
    this.handleTouchEnd = elation.bind(this, this.handleTouchEnd);
    this.handleMouseDown = elation.bind(this, this.handleMouseDown);
    this.handleMouseMove = elation.bind(this, this.handleMouseMove);
    this.handleMouseUp = elation.bind(this, this.handleMouseUp);

    elation.events.add(this, 'touchstart', this.handleTouchStart);
    elation.events.add(this, 'mousedown', this.handleMouseDown);

    this.stick.setPosition(0, 0);

    if (this.position) {
      this.style.position = 'fixed';
      this.style.left = (this.position[0] * 100) + '%';
      this.style.top = (this.position[1] * 100) + '%';
    }
  }
  update() {
  }
  handleMouseDown(ev) {
    elation.events.add(window, 'mousemove', this.handleMouseMove);
    elation.events.add(window, 'mouseup', this.handleMouseUp);
    ev.preventDefault();
  }
  handleMouseMove(ev) {
    this.setStickPosition(ev.clientX, ev.clientY);
  }
  handleMouseUp(ev) {
    this.resetStickPosition();
    elation.events.remove(window, 'mousemove', this.handleMouseMove);
    elation.events.remove(window, 'mouseup', this.handleMouseUp);
  }
  handleTouchStart(ev) {
    this.currenttouch = ev.changedTouches[0].identifier;
    elation.events.add(window, 'touchmove', this.handleTouchMove);
    elation.events.add(window, 'touchend', this.handleTouchEnd);
    ev.preventDefault();
    ev.stopPropagation();
  }
  handleTouchMove(ev) {
    for (var i = 0; i < ev.changedTouches.length; i++) {
      if (ev.changedTouches[i].identifier === this.currenttouch) {
        var x = ev.changedTouches[i].clientX;
        var y = ev.changedTouches[i].clientY;
        this.setStickPosition(x, y);
      }
    }
    //ev.preventDefault();
    ev.stopPropagation();
  }
  handleTouchEnd(ev) {
    for (var i = 0; i < ev.changedTouches.length; i++) {
      if (ev.changedTouches[i].identifier === this.currenttouch) {
        this.resetStickPosition();
        elation.events.remove(window, 'touchmove', this.handleTouchMove);
        elation.events.remove(window, 'touchend', this.handleTouchEnd);
        this.currenttouch = null;
      }
    }
  }
  setStickPosition(x, y) {
    var rect = this.getBoundingClientRect();

    //console.log('blep', x, y);

    var halfwidth = rect.width / 2,
        halfheight = rect.height / 2;

    var mx = rect.x + halfwidth,
        my = rect.y + halfheight;

    var dx = (x - mx) / halfwidth,
        dy = (y - my) / halfheight;

    var angle = Math.atan2(dy, dx);
    var len = Math.min(1, Math.sqrt(dx * dx + dy * dy));
//console.log(angle, len);

    var lastx = this.x,
        lasty = this.y;
    this.x = Math.max(-1, Math.min(1, (x - (rect.x + halfwidth)) / halfwidth));
    this.y = Math.max(-1, Math.min(1, (y - (rect.y + halfheight)) / halfheight));
    
//this.debug.innerHTML = '(' + this.axes[0] + ', ' + this.axes[1] + ')';
    if (lastx != this.x) {
      this.dispatchEvent({type: 'axis_change', data: { axis: this.axes[0], value: this.x } });
    }
    if (lasty != this.y) {
      this.dispatchEvent({type: 'axis_change', data: { axis: this.axes[1], value: this.y } });
    }
    this.stick.setAngleValue(angle, len);
  }
  resetStickPosition() {
    this.x = 0;
    this.y = 0;
    this.dispatchEvent({type: 'axis_change', data: { axis: this.axes[0], value: this.x } });
    this.dispatchEvent({type: 'axis_change', data: { axis: this.axes[1], value: this.y } });
    this.stick.setPosition(0, 0);
  }
});
elation.elements.define('janus.controls.analogstick', class extends elation.elements.base {
  create() {
  }
  setPosition(x, y) {
    var len = Math.sqrt(x * x + y * y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    var px = (((x + 1) / 2) * this.parentNode.offsetWidth) - (this.offsetWidth / 2),
        py = (((y + 1) / 2) * this.parentNode.offsetHeight) - (this.offsetHeight / 2);

    this.style.transform = 'translate(' + px + 'px, ' + py + 'px)';
//console.log(px, py, this.style.transform);
  }
  setAngleValue(angle, value) {
    var x = Math.cos(angle) * value,
        y = Math.sin(angle) * value;

    this.setPosition(x, y);
  }
});
elation.elements.define('janus.controls.dpad', class extends elation.elements.base {
});
/*
elation.elements.define('janus.controls.button', class extends elation.elements.base {
});
*/
