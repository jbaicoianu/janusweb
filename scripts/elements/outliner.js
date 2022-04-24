elation.require(['janusweb.janusbase'], function() {
  elation.component.add('janusweb.elements.outliner', {
    create() {
      this.defineProperties({
        'target': { type: 'string', set: this.updateTarget },
        'outline': { type: 'float', default: 2, set: this.updateOutlineSize },
      });
      this.meshes = [];
      // Shader used to outline the seleced object.  Based on https://www.videopoetics.com/tutorials/pixel-perfect-outline-shaders-unity/
      this.outlinematerial = new THREE.ShaderMaterial({
        vertexShader: [
            "uniform float offset;",
            "uniform vec2 screenSize;",
            "void main() {",
                //"vec4 pos = modelViewMatrix * vec4( position + normal * offset, 1.0 );",
                //"gl_Position = projectionMatrix * pos;",
                "vec4 pos = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
                "vec3 clipNormal = mat3(projectionMatrix) * (mat3(modelViewMatrix) * normal);",
                "pos.xy += normalize(clipNormal.xy) / screenSize * offset * pos.w * 2.0;",
                "gl_Position = pos;",
            "}"
        ].join("\n"),

        fragmentShader: [
            "uniform vec3 color;",
            "uniform float opacity;",
            "void main(){",
                "gl_FragColor = vec4( color, opacity );",
            "}"
        ].join("\n"),

        uniforms: {
          offset: { type: "f", value: this.outline },
          color: { value: this.col},
          opacity: { value: this.opacity },
          screenSize: { type: 'v2', value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        },
      });
      this.col = '#00ff00';
      this.outlinematerial.transparent = true;
      this.outlinematerial.uniforms.color.value = this.col;
      this.outlinematerial.depthWrite = false;
      this.outlinematerial.side = THREE.BackSide;
      //this.outlinematerial.blending = THREE.AdditiveBlending;

      if (this.target) this.updateTarget();
    },
    select(object) {
      let i = 0;
      this.selected = object;
      let objmeshes = [];
      object.traverseObjects(n => {
        if (n instanceof THREE.Mesh && n.material !== this.outlinematerial) {
          objmeshes.push(n);
        }
      });
      for (; i < objmeshes.length; i++) {
        let n = objmeshes[i],
            m = this.meshes[i];
          if (!m) {
            m = this.meshes[i] = new THREE.Mesh(n.geometry, this.outlinematerial);
            m.matrixAutoUpdate = false;
          } else {
            m.geometry = n.geometry;
            m.material = this.outlinematerial;
          }
          m.matrix.copy(n.matrix);
          n.parent.add(m);
      }
      if (i < this.meshes.length) {
        for (; i < this.meshes.length; i++) {
          this.meshes[i].geometry = null;
          if (this.meshes[i].parent) {
            this.meshes[i].parent.remove(this.meshes[i]);
          }
        }
      }
      this.refresh();
    },
    deselect() {
      for (let i = 0; i < this.meshes.length; i++) {
        this.meshes[i].geometry = null;
        if (this.meshes[i].parent) {
          this.meshes[i].parent.remove(this.meshes[i]);
        }
      }
      this.refresh();
    },
    updateOutlineSize() {
      if (this.outlinematerial) {
        this.outlinematerial.uniforms.offset.value = this.outline;
        this.refresh();
      }
    },
    setOpacity() {
      if (this.outlinematerial) {
        this.outlinematerial.uniforms.opacity.value = this.opacity;
        this.refresh();
      }
    },
    updateTarget() {
      if (this.target && this.outlinematerial) {
        let obj = room.objects[this.target];
        if (obj) {
          this.select(obj);
          if (!obj.loaded) {
            obj.addEventListener('asset_load_complete', ev => this.select(obj));
          }
        } else if (!room.loaded) {
          room.addEventListener('room_load_complete', ev => this.updateTarget());
        }
      }
    },
  }, elation.janusweb.janusbase);

});
