elation.elements.registerType('vector3', {
  read(value) {
    if (value instanceof THREE.Vector3) {
      return value;
    } else if (elation.utils.isString(value) && value != 'null') {
      let vec3 = new THREE.Vector3();
      let arr = value.split(' ');
      vec3.fromArray(arr);
      return vec3;
    }
  },
  write(value) {
    if (value) {
      return value.toArray().join(' ');
    }
    return null;
  }
});
elation.elements.registerType('vector2', {
  read(value) {
    if (value instanceof THREE.Vector2) {
      return value;
    } else if (elation.utils.isString(value) && value != 'null') {
      let vec2 = new THREE.Vector2();
      let arr = value.split(' ');
      vec2.fromArray(arr);
      return vec2;
    }
  },
  write(value) {
    if (value) {
      return value.toArray().join(' ');
    }
    return null;
  }
});
elation.elements.registerType('euler', {
  read(value) {
    if (value instanceof THREE.Euler) {
      return value;
    } else if (elation.utils.isString(value)) {
      let euler = new THREE.Euler();
      let arr = value.split(' ');
      euler.fromArray(arr);
      return euler;
    }
  },
  write(value) {
    return value.toArray().join(' ');
  }
});
elation.elements.registerType('color', {
  read(value) {
    if (value instanceof THREE.Color) {
      return value;
    } else if (elation.utils.isString(value)) {
      let color = new THREE.Color();
      let arr = value.split(' ');
      color.fromArray(arr);
      return color;
    }
  },
  write(value) {
    return (value ? value.toArray().join(' ') : 'null');
  }
});
elation.elements.define('janus-ui-editor-property', class extends elation.elements.ui.item {
  create() {
    super.create();
    this.defineAttributes({
      editing: { type: 'boolean', default: false },
      label: { type: 'string' },
      propertyname: { type: 'string' },
      value: { type: 'object' },
    });

    if (this.label) {
      elation.elements.create('ui-text', {
        text: this.label,
        append: this
      });
    }
  }
  updateValue(value) {
    this.value = value;
  }
  render() {
  }
  focus() {
    this.editing = true;
  }
  resetChangeTimer() {
    if (this.changetimer) {
      clearTimeout(this.changetimer);
    }
    this.changetimer = setTimeout(() => {
      elation.events.fire({type: 'editorchange', element: this, data: this.value});
    }, 350);
  }
  handleInputFocus(ev) {
    this.editing = true;
    console.log('editing', this);
  }
  handleInputBlur(ev) {
    this.editing = false;
    console.log('stop editing', this);
  }
});

elation.elements.define('janus-ui-editor-property-integer', class extends elation.elements.janus.ui.editor.property {
  create() {
    super.create();
    this.defineAttributes({
      value: { type: 'integer' },
    });
    this.input = elation.elements.create('ui-input', { name: 'value', label: '', append: this });
    elation.events.add(this.input, 'focus', (ev) => this.handleInputFocus(ev));
    elation.events.add(this.input, 'blur', (ev) => this.handleInputBlur(ev));
    this.updateValue(this.value);
  }
  render() {
  }
  updateValue(value) {
    this.value = value;
    if (this.elements) {
      if (this.value !== null && typeof this.value != 'undefined' && !isNaN(this.value)) {
        this.input.value = this.value.toString();
      } else {
        this.input.value = '';
      }
    }
  }
});
elation.elements.define('janus-ui-editor-property-float', class extends elation.elements.janus.ui.editor.property {
  create() {
    super.create();
    this.defineAttributes({
      value: { type: 'float' },
    });
    this.input = elation.elements.create('ui-input', { name: 'value', label: '', append: this });
    elation.events.add(this.input, 'focus', (ev) => this.handleInputFocus(ev));
    elation.events.add(this.input, 'blur', (ev) => this.handleInputBlur(ev));
    this.input.addEventListener('input', (ev) => { 
      this.value = this.input.value;
      this.resetChangeTimer();
    });
    this.updateValue(this.value);
  }
  render() {
  }
  updateValue(value) {
    this.value = value;
    if (this.input) {
      if (this.value !== null && typeof this.value != 'undefined' && !isNaN(this.value)) {
        this.input.value = +this.value.toFixed(4);
      } else {
        this.input.value = '';
      }
    }
  }
});
elation.elements.define('janus-ui-editor-property-string', class extends elation.elements.janus.ui.editor.property {
  create() {
    super.create();
    this.defineAttributes({
      value: { type: 'string' },
    });
    this.input = elation.elements.create('ui-input', { name: 'value', label: '', append: this });
    this.input.addEventListener('change', (ev) => this.handleInputChange(ev));
    elation.events.add(this.input, 'focus', (ev) => this.handleInputFocus(ev));
    elation.events.add(this.input, 'blur', (ev) => this.handleInputBlur(ev));

    this.updateValue(this.value);
  }
  render() {
  }
  updateValue(value) {
    this.value = value || '';
    if (this.input) {
      this.input.value = this.value;
    }
  }
  focus() {
    if (!this.input.hasFocus()) {
      this.input.focus();
      this.input.select();
    }
  }
  handleInputChange(ev) {
    this.value = this.input.value;
    //this.resetChangeTimer();
    elation.events.fire({type: 'editorchange', element: this, data: this.value});
  }
});
elation.elements.define('janus-ui-editor-property-vector3', class extends elation.elements.janus.ui.editor.property {
  create() {
    super.create();
    this.defineAttributes({
      value: { type: 'vector3' },
      constraint: { type: 'string' },
    });

    this.inputs = [];
    let inputs = 'xyz'.split('');
    let i = 0;
    inputs.forEach(t => {
      let input = elation.elements.create('ui-input', {
        name: t,
        label: t,
        append: this
      });
      elation.events.add(input, 'input', (ev) => { 
        if (this.inputs[0].value != this.value.x) this.value.x = +this.inputs[0].value;
        if (this.inputs[1].value != this.value.y) this.value.y = +this.inputs[1].value;
        if (this.inputs[2].value != this.value.z) this.value.z = +this.inputs[2].value;
        //elation.events.fire({type: 'editorchange', element: this})
        this.resetChangeTimer();
      });
      this.inputs.push(input);
    });
    elation.events.add(this.inputs, 'focus', (ev) => this.handleInputFocus(ev));
    elation.events.add(this.inputs, 'blur', (ev) => this.handleInputBlur(ev));
    if (this.value) {
      this.updateValue(this.value);
    }
  }
  updateValue(value) {
    this.value = value;
    if (this.inputs && this.value instanceof THREE.Vector3) {
      this.inputs[0].value = +this.value.x.toFixed(4);
      this.inputs[1].value = +this.value.y.toFixed(4);
      this.inputs[2].value = +this.value.z.toFixed(4);
    }
  }
  render() {
  }
});
elation.elements.define('janus-ui-editor-property-vector2', class extends elation.elements.janus.ui.editor.property {
  create() {
    super.create();
    this.defineAttributes({
      value: { type: 'vector2' },
      constraint: { type: 'string' },
    });

    this.inputs = [];
    let inputs = 'xy'.split('');
    let i = 0;
    inputs.forEach(t => {
      let input = elation.elements.create('ui-input', {
        name: t,
        label: t,
        append: this
      });
      elation.events.add(input, 'input', (ev) => { 
        if (this.inputs[0].value != this.value.x) this.value.x = +this.inputs[0].value;
        if (this.inputs[1].value != this.value.y) this.value.y = +this.inputs[1].value;
        //elation.events.fire({type: 'editorchange', element: this})
        this.resetChangeTimer();
      });
      this.inputs.push(input);
    });
    elation.events.add(this.inputs, 'focus', (ev) => this.handleInputFocus(ev));
    elation.events.add(this.inputs, 'blur', (ev) => this.handleInputBlur(ev));
    if (this.value) {
      this.updateValue(this.value);
    }
  }
  updateValue(value) {
    this.value = value;
    if (this.inputs && this.value instanceof THREE.Vector2) {
      this.inputs[0].value = +this.value.x.toFixed(4);
      this.inputs[1].value = +this.value.y.toFixed(4);
    }
  }
  render() {
  }
});
elation.elements.define('janus-ui-editor-property-euler', class extends elation.elements.janus.ui.editor.property {
  create() {
    super.create();
    this.defineAttributes({
      value: { type: 'euler' },
    });

    this.elements = elation.elements.fromString(`
      <ui-input name="x" label="x"></ui-input>
      <ui-input name="y" label="y"></ui-input>
      <ui-input name="z" label="z"></ui-input>
    `, this);
    if (this.value) {
      this.updateValue(this.value);
    }
  }
  updateValue(value) {
    this.value = value;
    if (this.elements) {
      this.elements.x.value = +this.value.x.toFixed(3);
      this.elements.y.value = +this.value.y.toFixed(3);
      this.elements.z.value = +this.value.z.toFixed(3);
    }
  }
});
elation.elements.define('janus-ui-editor-property-color', class extends elation.elements.janus.ui.editor.property {
  create() {
    super.create();
    this.defineAttributes({
      label: { type: 'string' },
      value: { type: 'color' },
    });
/*
    if (this.label) {
      elation.elements.create('ui-text', {
        text: this.label,
        append: this
      });
    }
*/
    this.inputs = [];
    let inputnames = 'rgb'.split('');
    let i = 0;
    inputnames.forEach(t => {
      let input = elation.elements.create('ui-input', {
        name: t,
        label: t,
        append: this
      });
      elation.events.add(input, 'input', (ev) => { 
/*
        if (this.inputs[0].value != this.value.r) this.value.r = this.inputs[0].value / 255;
        if (this.inputs[1].value != this.value.g) this.value.g = this.inputs[1].value / 255;
        if (this.inputs[2].value != this.value.b) this.value.b = this.inputs[2].value / 255;
*/
        if (this.inputs[0].value != this.value.r ||
            this.inputs[1].value != this.value.g ||
            this.inputs[2].value != this.value.b) {
          this.value = new THREE.Color(this.inputs[0].value / 255, this.inputs[1].value / 255, this.inputs[2].value / 255);
          this.colorpicker.value = '#' + this.value.getHexString();
          this.resetChangeTimer();
        }
      });
      this.inputs.push(input);
    });
    elation.events.add(this.inputs, 'focus', (ev) => this.handleInputFocus(ev));
    elation.events.add(this.inputs, 'blur', (ev) => this.handleInputBlur(ev));

    this.colorpicker = elation.elements.create('input', {
      type: 'color',
      name: 'color',
      append: this
    });
    elation.events.add(this.colorpicker, 'focus', (ev) => this.handleInputFocus(ev));
    elation.events.add(this.colorpicker, 'blur', (ev) => this.handleInputBlur(ev));
    if (this.value) {
      this.updateValue(this.value);
    }
    this.colorpicker.addEventListener('input', (ev) => { 
      this.updateValue(new THREE.Color(this.colorpicker.value));
      //this.resetChangeTimer();
      elation.events.fire({type: 'editorchange', element: this, data: this.value});
    });
  }
  createInputs(type='rgb') {
    super.createInputs(type);
  }
  updateValue(value) {
    this.value = value;
    if (this.colorpicker && value) {
      this.colorpicker.value = '#' + value.getHexString();
      this.inputs[0].value = (value.r * 255) | 0;
      this.inputs[1].value = (value.g * 255) | 0;
      this.inputs[2].value = (value.b * 255) | 0;
    }
  }
});
elation.elements.define('janus-ui-editor-property-boolean', class extends elation.elements.janus.ui.editor.property {
  create() {
    this.defineAttributes({
      label: { type: 'string' },
      propertyname: { type: 'boolean' },
      value: { type: 'boolean' },
    });
    if (this.label) {
      elation.elements.create('ui-text', {
        text: this.label,
        append: this
      });
    }
    this.elements = elation.elements.fromString(`
      <ui-toggle name="toggle"></ui-toggle>
    `, this);
    elation.events.add(this.elements.toggle, 'toggle', (ev) => {
      this.value = ev.target.checked;
      elation.events.fire({type: 'editorchange', element: this, data: this.value})
    });
    if (this.value) {
      this.updateValue(this.value);
    }
  }
  updateValue(value) {
    this.value = value;
    if (this.elements) {
      this.elements.toggle.checked = value;
    }
  }
});
