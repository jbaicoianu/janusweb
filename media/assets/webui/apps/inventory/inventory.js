/* janus.ui.inventory — a unified, source-aggregated asset browser.
 *
 * Sources (built-in primitives, the room's own markup assets, and any
 * host-registered source) each contribute items. The inventory merges items
 * that refer to the same underlying asset (by key), so one card can carry
 * several provenance badges (e.g. an asset that is both in the room and from a
 * host source), and presents a single searchable / filterable / sortable grid.
 * Selecting or dragging a card places the asset into the scene via the editor.
 */
(function () {
  // ---- source registry (module-private, shared across inventory instances) --
  var SOURCES = [];        // [{ name, label, items, refreshOn }]
  var INSTANCES = [];      // live janus.ui.inventory elements
  var SOURCE_LABEL = {};   // name -> label (for badges/chips)

  var TYPE_ICON = {
    object: '▣', model: '▣', image: '\u{1F5BC}', video: '\u{1F39E}',
    sound: '\u{1F50A}', light: '\u{1F4A1}', text: '\u{1F1F9}', link: '\u{1F517}',
    particle: '✨', shader: '\u{1F308}', script: '\u{1F4DC}'
  };

  function notify() { for (var i = 0; i < INSTANCES.length; i++) INSTANCES[i].rebuild(); }

  // Register (or replace, by name) an asset source. Safe to call before any
  // inventory exists — live inventories rebuild immediately.
  //   src = { name, label, refreshOn?, items }
  //   items: array | () => array | () => Promise<array>
  //   each raw item: { key?, type?, title?/name?, thumbnail?/src?, tags?,
  //                    url?/href? | getInsertURL() }
  function addSource(src) {
    if (!src || !src.name) return;
    for (var i = 0; i < SOURCES.length; i++) { if (SOURCES[i].name === src.name) { SOURCES.splice(i, 1); break; } }
    SOURCES.push(src);
    SOURCE_LABEL[src.name] = src.label || src.name;
    notify();
  }
  function removeSource(name) {
    for (var i = 0; i < SOURCES.length; i++) { if (SOURCES[i].name === name) { SOURCES.splice(i, 1); notify(); return; } }
  }

  function normalizeItem(raw, srcname) {
    var url = (typeof raw.getInsertURL === 'function') ? raw.getInsertURL() : (raw.url || raw.href || '');
    var rec = {
      key: raw.key || url || raw.title || raw.name,
      type: raw.type || 'object',
      title: raw.title || raw.name || raw.key || '',
      thumbnail: raw.thumbnail || raw.src || null,
      tags: raw.tags ? raw.tags.slice() : [],
      url: url,
      sources: [srcname],
      _bySource: {}
    };
    rec._bySource[srcname] = url;
    return rec;
  }

  // Merge records sharing a key: union the badges; an asset already in the room
  // keeps the room insert URL (reference the existing <asset>) over a source URL
  // (which would add a new asset def).
  function mergeAssets(records) {
    var byKey = {}, order = [];
    for (var i = 0; i < records.length; i++) {
      var r = records[i], k = r.key, m = byKey[k];
      if (!m) { byKey[k] = r; order.push(k); continue; }
      for (var s = 0; s < r.sources.length; s++) if (m.sources.indexOf(r.sources[s]) === -1) m.sources.push(r.sources[s]);
      for (var sk in r._bySource) m._bySource[sk] = r._bySource[sk];
      if (!m.thumbnail && r.thumbnail) m.thumbnail = r.thumbnail;
      if ((!m.title || m.title === m.key) && r.title) m.title = r.title;
      for (var t = 0; t < r.tags.length; t++) if (m.tags.indexOf(r.tags[t]) === -1) m.tags.push(r.tags[t]);
    }
    var out = [];
    for (var o = 0; o < order.length; o++) {
      var rec = byKey[order[o]];
      rec.url = rec._bySource['room'] || rec.url;   // prefer reference-existing
      out.push(rec);
    }
    return out;
  }

  function activeKeys(state) { var k = [], n; for (n in state) if (state[n]) k.push(n); return k; }

  // ---- built-in sources ------------------------------------------------------
  var PRIMITIVE_DEFS = [
    { id: 'cube', label: 'Cube', type: 'object', url: 'janus:object/id=cube' },
    { id: 'sphere', label: 'Sphere', type: 'object', url: 'janus:object/id=sphere' },
    { id: 'cone', label: 'Cone', type: 'object', url: 'janus:object/id=cone' },
    { id: 'cylinder', label: 'Cylinder', type: 'object', url: 'janus:object/id=cylinder' },
    { id: 'pyramid', label: 'Pyramid', type: 'object', url: 'janus:object/id=pyramid' },
    { id: 'torus', label: 'Torus', type: 'object', url: 'janus:object/id=torus' },
    { id: 'capsule', label: 'Capsule', type: 'object', url: 'janus:object/id=capsule' },
    { id: 'pipe', label: 'Pipe', type: 'object', url: 'janus:object/id=pipe' },
    { id: 'plane', label: 'Plane', type: 'object', url: 'janus:object/id=plane' },
    { id: 'image', label: 'Image', type: 'image', url: 'janus:image' },
    { id: 'link', label: 'Link', type: 'link', url: 'janus:link' },
    { id: 'paragraph', label: 'Paragraph', type: 'text', url: 'janus:paragraph' },
    { id: 'particle', label: 'Particle', type: 'particle', url: 'janus:particle' },
    { id: 'sound', label: 'Sound', type: 'sound', url: 'janus:sound' },
    { id: 'text', label: 'Text', type: 'text', url: 'janus:text/text=Text/col=red/roughness=0.3/metalness=0' },
    { id: 'video', label: 'Video', type: 'video', url: 'janus:video' },
    { id: 'pointlight', label: 'Point light', type: 'light', url: 'janus:light/light_cone_angle=0' },
    { id: 'spotlight', label: 'Spot light', type: 'light', url: 'janus:light/light_cone_angle=0.8' },
    { id: 'dirlight', label: 'Directional light', type: 'light', url: 'janus:light/light_cone_angle=1' }
  ];
  function primitiveItems() {
    return PRIMITIVE_DEFS.map(function (p) {
      return { key: 'primitive:' + p.id, type: p.type, title: p.label, url: p.url, tags: ['primitive'] };
    });
  }

  // Per-type insert URL for an existing room asset (references it by id, so no
  // duplicate asset def is created).
  var ROOM_REF = { object: 'object/id', model: 'object/id', image: 'image/image_id', sound: 'sound/sound_id', video: 'video/video_id' };
  function roomItems() {
    var out = [], room = window.room;
    if (!room || !room.assetpack || !room.assetpack.assetmap) return out;
    var map = room.assetpack.assetmap, type, name, asset, src, ref, parts;
    for (type in map) {
      for (name in map[type]) {
        asset = map[type][name];
        src = (asset && (asset.src || (typeof asset.getFullURL === 'function' && asset.getFullURL()))) || '';
        ref = ROOM_REF[type] || 'object/id';
        parts = ref.split('/');
        out.push({
          key: src || (type + ':' + name),
          type: (type === 'object' ? 'model' : type),
          title: name,
          thumbnail: (type === 'image' ? src : null),
          url: 'janus:' + parts[0] + '/' + parts[1] + '=' + encodeURIComponent(name),
          tags: ['room']
        });
      }
    }
    return out;
  }

  addSource({ name: 'primitive', label: 'Primitive', items: primitiveItems });
  addSource({ name: 'room', label: 'Room', items: roomItems, refreshOn: ['room_change'] });

  // ---- the inventory element -------------------------------------------------
  elation.elements.define('janus.ui.inventory', class extends elation.elements.base {
    create() {
      this.assets = [];
      this.q = '';
      this.activeSources = {};
      this.activeTypes = {};
      this.sortKey = 'title';
      this._rebuildToken = 0;

      elation.elements.fromTemplate('janus.ui.inventory', this);
      this.grid = this.querySelector('[name=assetgrid]');
      this.searchEl = this.querySelector('[name=search]');
      this.sortEl = this.querySelector('[name=sortselect]');
      this.sourceChips = this.querySelector('[name=sourcefilters]');
      this.typeChips = this.querySelector('[name=typefilters]');
      this.emptyEl = this.querySelector('[name=empty]');

      if (this.searchEl) elation.events.add(this.searchEl, 'input,change', (ev) => { this.q = (this.searchEl.value || '').toLowerCase(); this.applyFilters(); });
      if (this.sortEl) elation.events.add(this.sortEl, 'change', (ev) => { this.sortKey = this.sortEl.value || 'title'; this.applyFilters(); });
      if (this.sourceChips) elation.events.add(this.sourceChips, 'click', (ev) => this.toggleChip(ev, this.activeSources));
      if (this.typeChips) elation.events.add(this.typeChips, 'click', (ev) => this.toggleChip(ev, this.activeTypes));

      // Activation: a full click places via the editor (NOT the list's `select`,
      // which fires on mousedown — that spawned the object mid-press). dragstart
      // carries the insert URL so dropping into the scene works (independent of
      // reorder).
      if (this.grid) {
        elation.events.add(this.grid, 'click', (ev) => this.handleActivate(ev));
        elation.events.add(this.grid, 'dragstart', (ev) => this.handleDragStart(ev));
      }

      // Route selection to the editor controller, so the inventory works whether
      // it's inside the editor panel or placed standalone (decomposed).
      var c = (typeof window.getEditorController === 'function') ? window.getEditorController() : null;
      if (c) { this.controller = c; c.inventory = this; elation.events.add(this, 'assetselect', (ev) => c.handleInventorySelect(ev)); }

      try { elation.events.add(janus._target, 'room_change', () => this.rebuild()); } catch (e) {}

      INSTANCES.push(this);
      this.rebuild();
    }

    // Public per-instance hooks (mirror the static API for convenience).
    addSource(src) { addSource(src); }
    removeSource(name) { removeSource(name); }

    rebuild() {
      var token = ++this._rebuildToken;
      var collected = [], pending = 0, self = this;
      var finish = function () {
        if (pending !== 0 || token !== self._rebuildToken) return;
        self.assets = mergeAssets(collected);
        self.updateChips();
        self.applyFilters();
      };
      for (var i = 0; i < SOURCES.length; i++) {
        (function (src) {
          var items;
          try { items = (typeof src.items === 'function') ? src.items() : src.items; } catch (e) { items = []; }
          var push = function (list) { for (var j = 0; j < (list || []).length; j++) collected.push(normalizeItem(list[j], src.name)); };
          if (items && typeof items.then === 'function') {
            pending++;
            items.then(function (list) { push(list); pending--; finish(); }, function () { pending--; finish(); });
          } else {
            push(items);
          }
        })(SOURCES[i]);
      }
      finish();
    }

    updateChips() {
      // Source chips come from registered sources; type chips from present types.
      if (this.sourceChips) {
        var names = SOURCES.map(function (s) { return s.name; });
        this.renderChips(this.sourceChips, names, function (n) { return SOURCE_LABEL[n] || n; }, this.activeSources, 'src');
      }
      if (this.typeChips) {
        var types = [], seen = {}, i;
        for (i = 0; i < this.assets.length; i++) { var t = this.assets[i].type; if (!seen[t]) { seen[t] = 1; types.push(t); } }
        types.sort();
        this.renderChips(this.typeChips, types, function (t) { return t; }, this.activeTypes, 'type');
      }
    }

    renderChips(container, keys, labelfn, state, kind) {
      container.innerHTML = '';
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'inv-chip' + (state[k] ? ' active' : '') + (kind === 'src' ? ' inv-badge-' + k : '');
        chip.setAttribute('data-key', k);
        chip.textContent = labelfn(k);
        container.appendChild(chip);
      }
    }

    toggleChip(ev, state) {
      var chip = ev.target && ev.target.closest ? ev.target.closest('[data-key]') : null;
      if (!chip) return;
      var k = chip.getAttribute('data-key');
      state[k] = !state[k];
      chip.classList.toggle('active', !!state[k]);
      this.applyFilters();
    }

    applyFilters() {
      var q = this.q, srcs = activeKeys(this.activeSources), types = activeKeys(this.activeTypes);
      var view = this.assets.filter(function (a) {
        if (q) {
          var hit = (a.title || '').toLowerCase().indexOf(q) !== -1;
          if (!hit) for (var i = 0; i < a.tags.length; i++) if (String(a.tags[i]).toLowerCase().indexOf(q) !== -1) { hit = true; break; }
          if (!hit) return false;
        }
        if (srcs.length) { var ok = false; for (var s = 0; s < a.sources.length; s++) if (srcs.indexOf(a.sources[s]) !== -1) { ok = true; break; } if (!ok) return false; }
        if (types.length && types.indexOf(a.type) === -1) return false;
        return true;
      });
      var key = this.sortKey;
      view.sort(function (a, b) {
        var av = key === 'source' ? (a.sources[0] || '') : (a[key] || '');
        var bv = key === 'source' ? (b.sources[0] || '') : (b[key] || '');
        return String(av).localeCompare(String(bv));
      });
      if (this.grid) this.grid.setItems(view);
      if (this.emptyEl) this.emptyEl.style.display = view.length ? 'none' : '';
    }

    handleActivate(ev) {
      // Native click: resolve the card from the event target (the anchor/img/title
      // inside it), so placement happens on click-release, not on mousedown.
      var item = ev.target && ev.target.closest ? ev.target.closest('.inv-asset-item') : null;
      var rec = item && item.value;
      if (!rec || !rec.url) return;
      elation.events.fire({ type: 'assetselect', element: this, data: rec.url });
      if (ev.preventDefault) ev.preventDefault();
      if (ev.stopPropagation) ev.stopPropagation();
    }

    handleDragStart(ev) {
      var item = ev.target && ev.target.closest ? ev.target.closest('.inv-asset-item') : null;
      var rec = item && item.value;
      if (!rec || !rec.url || !ev.dataTransfer) return;
      try {
        ev.dataTransfer.effectAllowed = 'copy';
        ev.dataTransfer.setData('text/uri-list', rec.url);
        ev.dataTransfer.setData('text/plain', rec.url);
      } catch (e) {}
    }
  });

  // Card renderer for one merged asset record (this.value). Build in render()
  // (and on every value assignment) rather than create(): the list assigns
  // `value` around create time, so a one-shot create() read produced blank cards.
  elation.elements.define('janus.ui.inventory.item.asset', class extends elation.elements.ui.item {
    init() {
      super.init();
      // Re-render whenever the value is (re)assigned, regardless of set/create order.
      this.defineAttributes({ value: { type: 'object', set: () => this.render() } });
    }
    render() {
      var v = this.value;
      this.innerHTML = '';
      if (v == null || typeof v !== 'object') return;
      this.addclass('inv-asset-item');
      var a = document.createElement('a');
      a.setAttribute('href', v.url || '#');
      a.setAttribute('draggable', 'true');
      a.setAttribute('onclick', 'return false');
      if (v.thumbnail) {
        var img = document.createElement('img'); img.src = v.thumbnail; a.appendChild(img);
      } else {
        var ic = document.createElement('span'); ic.className = 'inv-type-icon'; ic.textContent = TYPE_ICON[v.type] || '▩'; a.appendChild(ic);
      }
      var h = document.createElement('h2'); h.textContent = v.title || ''; a.appendChild(h);
      this.appendChild(a);
      if (v.sources && v.sources.length) {
        var badges = document.createElement('span'); badges.className = 'inv-badges';
        for (var i = 0; i < v.sources.length; i++) {
          var b = document.createElement('span');
          b.className = 'inv-badge inv-badge-' + v.sources[i];
          b.textContent = SOURCE_LABEL[v.sources[i]] || v.sources[i];
          b.title = b.textContent;
          badges.appendChild(b);
        }
        this.appendChild(badges);
      }
    }
  });

  // Host registration hook (engine-generic; no downstream coupling). A host can
  // register an asset source at any time:  window.JanusInventory.addSource({...})
  // If a host registered before this script loaded (pushing onto a `sources`
  // queue), drain it now.
  var hook = (window.JanusInventory = window.JanusInventory || {});
  if (hook.sources && hook.sources.length) hook.sources.forEach(addSource);
  hook.sources = null;
  hook.addSource = addSource;
  hook.removeSource = removeSource;
})();
