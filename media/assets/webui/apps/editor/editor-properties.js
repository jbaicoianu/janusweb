elation.elements.registerType('vector3', {
  read(value) {
    if (value instanceof THREE.Vector3) {
      return value;
    } else if (elation.utils.isString(value)) {
      let vec3 = new THREE.Vector3();
      let arr = value.split(' ');
      vec3.fromArray(arr);
      return vec3;
    }
  },
  write(value) {
    return value.toArray().join(' ');
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
    return value.toArray().join(' ');
  }
});
elation.elements.define('janus-ui-editor-property', class extends elation.elements.ui.item {
  create() {
    super.create();
    this.defineAttributes({
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
});

elation.elements.define('janus-ui-editor-property-vector3', class extends elation.elements.janus.ui.editor.property {
  create() {
    super.create();
    this.defineAttributes({
      value: { type: 'vector3' },
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
    this.elements.x.value = this.value.x;
    this.elements.y.value = this.value.y;
    this.elements.z.value = this.value.z;
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
    this.elements.x.value = this.value.x * THREE.Math.RAD2DEG;
    this.elements.y.value = this.value.y * THREE.Math.RAD2DEG;
    this.elements.z.value = this.value.z * THREE.Math.RAD2DEG;
  }
});
elation.elements.define('janus-ui-editor-property-color', class extends elation.elements.janus.ui.editor.property.vector3 {
  create() {
    this.defineAttributes({
      label: { type: 'string' },
      value: { type: 'color' },
    });
    if (this.label) {
      elation.elements.create('ui-text', {
        text: this.label,
        append: this
      });
    }
    this.elements = elation.elements.fromString(`
      <input type="color" name="color"></input>
    `, this);
    if (this.value) {
      this.updateValue(this.value);
    }
  }
  updateValue(value) {
console.log('MY VALUE!', value, value.getHexString());
    this.value = value;
    this.elements.color.value = '#' + value.getHexString();
  }
});
