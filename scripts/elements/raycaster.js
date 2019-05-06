elation.require(['janusweb.janusbase'], function() {
  elation.component.add('janusweb.elements.raycaster', {
    create() {
      this.lasthitobject = null;
    },
    update() {
      if (!this.fwdvec) {
        this.fwdvec = V();
        this.lasthitpos = V();
      }
      var hits = this.raycast(null, null, this.class);
      if (hits.length > 0) {
        var hit = hits[0],
            hitobject = hit.object;

        if (hitobject != this.lasthitobject) {
          if (this.lasthitobject) {
            this.dispatchEvent({type: 'raycastleave', data: {object: this.lasthitobject, intersection: hit}, bubbles: false});
          }
          this.dispatchEvent({type: 'raycastenter', data: {object: hit.object, intersection: hit}, bubbles: false});
          this.lasthitobject = hitobject;
        }

        if (!hit.point.equals(this.lasthitpos)) {
          this.dispatchEvent({type: 'raycastmove', data: {object: hit.object, intersection: hit}, bubbles: false});
        }
        this.lasthitpos.copy(hit.point);
      } else {
        if (this.lasthitobject) {
          this.dispatchEvent({type: 'raycastleave', data: {object: this.lasthitobject, intersection: null}, bubbles: false});
          this.dispatchEvent({type: 'raycastenter', data: {object: this.lasthitobject.room, intersection: null}, bubbles: false});
          this.lasthitobject = this.lasthitobject.room;
        }
        this.localToWorld(this.fwdvec.set(0,0,-1));
        if (!this.fwdvec.equals(this.lasthitpos)) {
          this.dispatchEvent({type: 'raycastmove', data: {object: this.lasthitobject, intersection: this.fwdvec}, bubbles: false});
        }
        this.lasthitpos.copy(this.fwdvec);
      }
    }
  }, elation.janusweb.janusbase);
});
