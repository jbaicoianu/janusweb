elation.require(['janusweb.janusbase'], function() {
  elation.component.add('janusweb.elements.outliner', {
    create() {
      this.defineProperties({
        'target': { type: 'string', set: this.updateTarget },
        'outline': { type: 'float', default: 2, set: this.updateOutlineSize },
      });
      this.meshes = [];
      this.skinnedmeshes = [];
      // Shader used to outline the selected object.  Based on https://www.videopoetics.com/tutorials/pixel-perfect-outline-shaders-unity/
      // Thanks to @donrmccurdy for the example of how to include skinning in a custom shader https://github.com/mrdoob/three.js/issues/4800#issuecomment-580901344
      this.outlinematerial = new THREE.ShaderMaterial({
        vertexShader: `
            uniform float offset;
            uniform vec2 screenSize;

            ${THREE.ShaderChunk.skinning_pars_vertex}

            void main() {
                mat4 modelViewProjectionMatrix = projectionMatrix * modelViewMatrix;

                // If USE_SKINNING is set, this will transform our vertices by any skinned mesh attributes
                // Otherwise, it'll just use our regular vertex positions
                ${THREE.ShaderChunk.beginnormal_vertex}
                ${THREE.ShaderChunk.skinbase_vertex}
                ${THREE.ShaderChunk.skinnormal_vertex}
                vec3 transformed = vec3( position );
                ${THREE.ShaderChunk.skinning_vertex}

                // Transform our new vertex position into clip space
                vec4 pos = modelViewProjectionMatrix * vec4(transformed, 1.0);

                // Offset our vertices along the normal direction, scaled to the specified pixel offset in screen space
                vec3 clipNormal = mat3(projectionMatrix) * (mat3(modelViewMatrix) * normal);
                pos.xy += normalize(clipNormal.xy) / screenSize * offset * pos.w * 2.0;
                gl_Position = pos;
            }
        `,

        fragmentShader: `
            uniform vec3 color;
            uniform float opacity;
            void main(){
                gl_FragColor = vec4( color, opacity );
            }
        `,

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

      if (this.target) {
        this.updateTarget();
      } else {
        setTimeout(() => {
          this.select(this.children[0]);
        }, 50);
      }
    },
    select(object) {
      this.selected = object;
      if (!object) {
        this.deselect();
        return;
      }
      let objmeshes = [], skinnedmeshes = [];
      if (object instanceof THREE.Object3D) {
        object.traverse(n => {
          if (n instanceof THREE.Mesh && n.material !== this.outlinematerial) {
            if (n.isSkinnedMesh)
              skinnedmeshes.push(n);
            else
              objmeshes.push(n);
          }
        });
      } else {
        object.traverseObjects(n => {
          if (n instanceof THREE.Mesh && n.material !== this.outlinematerial) {
            if (n.isSkinnedMesh)
              skinnedmeshes.push(n);
            else
              objmeshes.push(n);
          }
        });
      }
      // Create and update regular Meshes
      let meshIdx = 0;
      for (; meshIdx < objmeshes.length; meshIdx++) {
        let n = objmeshes[meshIdx],
            m = this.getMesh(n, this.meshes[meshIdx]);
        this.meshes[meshIdx] = m;
        n.parent.add(m);
      }
      // Hide all unused Meshes
      if (meshIdx < this.meshes.length) {
        for (; meshIdx < this.meshes.length; meshIdx++) {
          this.meshes[meshIdx].geometry = null;
          if (this.meshes[meshIdx].parent) {
            this.meshes[meshIdx].parent.remove(this.meshes[meshIdx]);
          }
        }
      }
      // Create and update SkinnedMeshes
      let skinnedMeshIdx = 0;
      for (; skinnedMeshIdx < skinnedmeshes.length; skinnedMeshIdx++) {
        let n = skinnedmeshes[skinnedMeshIdx],
            m = this.getSkinnedMesh(n, this.skinnedmeshes[skinnedMeshIdx]);
        this.skinnedmeshes[skinnedMeshIdx] = m;
        n.parent.add(m);
      }
      // Hide all unused Meshes
      if (skinnedMeshIdx < this.skinnedmeshes.length) {
        for (; skinnedMeshIdx < this.skinnedmeshes.length; skinnedMeshIdx++) {
          this.skinnedmeshes[skinnedMeshIdx].geometry = null;
          if (this.skinnedmeshes[skinnedMeshIdx].parent) {
            this.skinnedmeshes[skinnedMeshIdx].parent.remove(this.skinnedmeshes[skinnedMeshIdx]);
          }
        }
      }
      this.refresh();
    },
    deselect() {
      for (let meshIdx = 0; meshIdx < this.meshes.length; meshIdx++) {
        this.meshes[meshIdx].geometry = null;
        if (this.meshes[meshIdx].parent) {
          this.meshes[meshIdx].parent.remove(this.meshes[meshIdx]);
        }
      }
      for (let skinnedMeshIdx = 0; skinnedMeshIdx < this.skinnedmeshes.length; skinnedMeshIdx++) {
        this.skinnedmeshes[skinnedMeshIdx].geometry = null;
        if (this.skinnedmeshes[skinnedMeshIdx].parent) {
          this.skinnedmeshes[skinnedMeshIdx].parent.remove(this.skinnedmeshes[skinnedMeshIdx]);
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
    getMesh(n, m) {
      if (!m) {
        m = new THREE.Mesh(n.geometry, this.outlinematerial);
        m.matrixAutoUpdate = false;
      } else {
        m.geometry = n.geometry;
        m.material = this.outlinematerial;
      }
      m.matrix.copy(n.matrix);
      return m;
    },
    getSkinnedMesh(n, m) {
      if (!m) {
        m = new THREE.SkinnedMesh(n.geometry, this.outlinematerial);
        m.skeleton = n.skeleton;
        m.matrixAutoUpdate = false;
      } else {
        m.geometry = n.geometry;
        m.material = this.outlinematerial;
      }
      m.matrix.copy(n.matrix);
      return m;
    }
  }, elation.janusweb.janusbase);

});
