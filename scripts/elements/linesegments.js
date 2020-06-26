elation.require(['janusweb.janusbase'], function() {
  elation.component.add('janusweb.elements.linesegments', {
    positions: [],
    colors: [],
    metadata: [],
    linewidth: 1,
    depth_write: true,
    depth_test: true,

    create() {
      
  setTimeout(() => {
      let lines = this.getElementsByTagName('line');
      for (let i = 0; i < lines.length; i++) {
        this.positions.push(lines[i].v1, lines[i].v2);
        if (lines[i].c1 && lines[i].c2) {
          this.colors.push(lines[i].c1, lines[i].c2);
        } else if (lines[i].col && lines[i].col !== lines[i].defaultcolor) {
          this.colors.push(lines[i].col, lines[i].col);
        } else {
          this.colors.push(this.col, this.col);
        }
      }
      this.updateLine();
  }, 0);

      this.updateLine();
    },
    updateLine() {
      if (this.positions.length > 0) {
        if (!this.geometry) {
          let geo = new THREE.BufferGeometry();
          let lineobj = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
            vertexColors: THREE.VertexColors,
            opacity: this.opacity,
            transparent: (this.opacity < 1),
            depthWrite: this.depth_write,
            depthTest: this.depth_test,
            linewidth: this.linewidth,
          }));
          this.objects['3d'].add(lineobj);
          if (this.pickable || this.collidable) {
            //this.colliders.add(lineobj.clone());
          }
          lineobj.userData.thing = this;
          this.geometry = geo;
          this.lineobj = lineobj;
        }
        let attrs = this.geometry.attributes,
            numelements = this.positions.length * 3,
            posbuf = (attrs.position && attrs.position.array.length == numelements ? attrs.position.array : new Float32Array(numelements)),
            colbuf = (attrs.color && attrs.color.array.length == numelements ? attrs.color.array : new Float32Array(numelements));
        let positions = this.positions,
            colors = this.colors;
        for (let i = 0; i < positions.length; i++) {
          let p = positions[i],
              c = colors[i] || this.col;
          posbuf[i * 3] = p.x;
          posbuf[i * 3 + 1] = p.y;
          posbuf[i * 3 + 2] = p.z;

          colbuf[i * 3] = c.x;
          colbuf[i * 3 + 1] = c.y;
          colbuf[i * 3 + 2] = c.z;
        }

        let posattr = new THREE.Float32BufferAttribute( posbuf, 3 );
        posattr.setUsage(THREE.DynamicDrawUsage);
        let colattr = new THREE.Float32BufferAttribute( colbuf, 3 );
        colattr.setUsage(THREE.DynamicDrawUsage);
        this.geometry.setAttribute( 'position', posattr);
        this.geometry.setAttribute( 'color', colattr);
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.computeBoundingSphere();
      }
    },
    setLine(offset, start, end) {
      this.positions[offset * 2] = start;
      this.positions[offset * 2 + 1] = end;
    },
    getLine(idx) {
      let line = {
        start: this.positions[idx * 2],
        end: this.positions[idx * 2 + 1],
      };
    },
    updateColor() {
      if (this.positions && this.geometry) {
        let colors = this.geometry.attributes.color.array;
        for (let i = 0; i < this.positions.length; i++) {
          let offset = i * 3;
          colors[offset] = this.color.r; 
          colors[offset + 1] = this.color.g; 
          colors[offset + 2] = this.color.b; 
        }
        this.geometry.attributes.color.needsUpdate = true;
      }
    },
    getMetadata(index) {
      if (this.metadata && this.metadata[index]) {
        return this.metadata[index];
      }
      return null;
    }
  }, elation.janusweb.janusbase);
});
