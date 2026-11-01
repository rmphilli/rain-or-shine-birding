const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp, observation } = require('./helpers/app-harness.cjs');

// Exercise the real map lifecycle without downloading Leaflet, tiles or private data.
async function createMapApp({ clustered = true, rows } = {}) {
  const app = await createApp();
  const screen = { small: false, hover: true };
  app.window.matchMedia = query => ({ matches: query.includes('max-width') ? screen.small : screen.hover });
  const frames = new Map();
  let nextFrame = 0;
  app.window.requestAnimationFrame = callback => { frames.set(++nextFrame, callback); return nextFrame; };
  app.window.cancelAnimationFrame = id => frames.delete(id);

  const calls = { mapOptions: [], tiles: [], layers: [], markers: [], fits: [], invalidations: [] };
  const map = {
    center: null, zoom: null, popup: null,
    setView(center, zoom) { this.center = [...center]; this.zoom = zoom; return this; },
    invalidateSize(options) { calls.invalidations.push(options); return this; },
    fitBounds(bounds, options) {
      calls.fits.push({ bounds: Array.from(bounds, point => Array.from(point)), options });
      this.center = [...bounds[0]]; this.zoom = options.maxZoom;
      return this;
    },
    zoomIn() { this.zoom++; }, zoomOut() { this.zoom--; },
  };
  const makeLayer = (kind, options) => {
    const layer = {
      kind, options, markers: [], attached: false, countOnAttach: null,
      addLayer(marker) { this.markers.push(marker); return this; },
      addTo() {
        this.attached = true; this.countOnAttach = this.markers.length;
        this.markers.forEach(marker => marker.emit('add'));
        return this;
      },
      remove() {
        this.attached = false;
        if (this.markers.includes(map.popup)) map.popup = null;
        return this;
      },
      on() { return this; },
    };
    calls.layers.push(layer);
    return layer;
  };
  const leaflet = {
    map(_container, options) { calls.mapOptions.push(options); return map; },
    tileLayer(url, options) {
      calls.tiles.push({ url, options });
      return { addTo() { return this; } };
    },
    layerGroup: () => makeLayer('plain'),
    divIcon: options => options,
    marker(coords, options) {
      const events = new Map();
      const classes = new Set();
      const element = {
        setAttribute(name, value) { this[name] = value; },
        classList: { add: name => classes.add(name), remove: name => classes.delete(name) },
      };
      const marker = {
        coords, options, classes,
        bindPopup(html, popupOptions) { this.popup = { html, options: popupOptions }; return this; },
        bindTooltip(html, tooltipOptions) { this.tooltip = { html, options: tooltipOptions }; return this; },
        on(name, callback) { events.set(name, callback); return this; },
        emit(name) { events.get(name)?.(); },
        getElement() { return element; },
        openPopup() { map.popup = this; this.emit('click'); },
      };
      calls.markers.push(marker);
      return marker;
    },
    Control: { extend: () => class { addTo() {} } },
  };
  if (clustered) leaflet.markerClusterGroup = options => makeLayer('cluster', options);
  app.window.L = leaflet;
  app.set('L', leaflet);
  app.element('#memberFilter').value = 'all';
  app.set('observations', rows ?? [
    observation('Matt', 'Northern Cardinal', { latitude: 40.6, longitude: -89.5 }),
    observation('Jeff', 'Blue Jay', { latitude: 41, longitude: -88 }),
    observation('Alex', 'Great Blue Heron', { latitude: 42, longitude: -87 }),
  ]);
  return {
    app, screen, frames, calls, map,
    render: () => app.evaluate('renderMap()'),
    flushFrame() {
      const pending = [...frames.entries()];
      for (const [id, callback] of pending) { frames.delete(id); callback(); }
    },
  };
}

test('map fits once, attaches populated layers and preserves OSM attribution', async () => {
  const { app, calls, render } = await createMapApp();
  const timersBefore = app.timers.size;
  render();
  assert.equal(calls.fits.length, 1);
  assert.equal(app.timers.size, timersBefore, 'initial fitting must not schedule stale refits');
  assert.equal(calls.layers[0].countOnAttach, 3, 'cluster the complete detached layer once');
  assert.equal(calls.mapOptions[0].trackResize, false, 'use the app coalesced resize handler');
  assert.equal(calls.tiles[0].url, 'https://tile.openstreetmap.org/{z}/{x}/{y}.png');
  assert.match(calls.tiles[0].options.attribution, /https:\/\/www\.openstreetmap\.org\/copyright/);
});

test('resize bursts invalidate once without rebuilding markers, closing popups or fitting', async () => {
  const { app, calls, frames, map, render, flushFrame } = await createMapApp();
  render();
  const marker = calls.markers[0];
  marker.openPopup();
  map.setView([40.7, -89.2], 11);
  const invalidationsBefore = calls.invalidations.length;
  for (let i = 0; i < 10; i++) await app.window.dispatch('resize');
  await app.window.dispatch('orientationchange');
  assert.equal(frames.size, 1);
  flushFrame();
  assert.equal(calls.invalidations.length, invalidationsBefore + 1);
  assert.equal(calls.invalidations.at(-1).pan, false);
  assert.equal(calls.layers.length, 1);
  assert.equal(calls.markers.length, 3);
  assert.equal(calls.fits.length, 1);
  assert.equal(map.popup, marker);
  assert.deepEqual(map.center, [40.7, -89.2]);
  assert.equal(map.zoom, 11);
  assert.equal(app.evaluate('birdMapSelectedMarker'), marker);
  await app.window.dispatch('resize');
  assert.equal(frames.size, 1, 'a later frame can still refresh map dimensions');
});

test('routine dashboard renders retain map layer, selected popup and user viewport', async () => {
  const { app, calls, map, render } = await createMapApp();
  render();
  const layer = calls.layers[0];
  const marker = calls.markers[0];
  marker.openPopup();
  map.setView([41.5, -88.4], 10);
  app.evaluate('render()');
  app.evaluate('render()');
  assert.equal(app.evaluate('birdMapLayer'), layer);
  assert.equal(calls.layers.length, 1);
  assert.equal(map.popup, marker);
  assert.equal(app.evaluate('birdMapSelectedMarker'), marker);
  assert.deepEqual(map.center, [41.5, -88.4]);
  assert.equal(map.zoom, 10);
  assert.equal(calls.fits.length, 1);
});

test('changed observation arrays rebuild map locations while retaining user viewport', async () => {
  const { app, calls, map, render } = await createMapApp();
  render();
  map.setView([39.2, -90.1], 9);
  app.set('observations', [observation('Alex', 'Wood Duck', { latitude: 38.8, longitude: -90.3 })]);
  render();
  assert.equal(calls.layers.length, 2);
  assert.equal(calls.layers[1].markers.length, 1);
  assert.deepEqual(app.read('birdMapBounds'), [[38.8, -90.3]]);
  assert.equal(calls.fits.length, 1);
  assert.deepEqual(map.center, [39.2, -90.1]);
  assert.equal(map.zoom, 9);
  app.evaluate('fitBirdMapToTrail()');
  assert.equal(calls.fits.length, 2, 'explicit fit uses the newly updated trail bounds');
  assert.deepEqual(calls.fits.at(-1).bounds, [[38.8, -90.3]]);
});

test('responsive breakpoint rebuilds once without refitting and member filters fit deliberately', async () => {
  const { app, calls, map, screen, render, flushFrame } = await createMapApp();
  render();
  map.setView([40.7, -89.2], 11);
  screen.small = true;
  await app.window.dispatch('resize');
  flushFrame();
  assert.equal(calls.layers.length, 2);
  assert.equal(calls.layers.at(-1).options.maxClusterRadius, 42);
  assert.equal(calls.layers.at(-1).markers[0].options.icon.iconSize[0], 46);
  assert.equal(calls.fits.length, 1);
  assert.deepEqual(map.center, [40.7, -89.2]);
  app.element('#memberFilter').value = 'Jeff';
  await app.element('#memberFilter').dispatch('change');
  assert.equal(calls.layers.length, 3);
  assert.equal(calls.layers.at(-1).markers.length, 1);
  assert.equal(calls.fits.length, 2);
  assert.deepEqual(calls.fits.at(-1).bounds, [[41, -88]]);
  assert.deepEqual([...calls.fits.at(-1).options.paddingTopLeft], [32, 66]);
  assert.equal(app.timers.size, 0);
});

test('initially empty maps fit when the first geolocated observations arrive', async () => {
  const { app, calls, render } = await createMapApp({ rows: [] });
  render();
  assert.equal(calls.fits.length, 0);
  assert.equal(app.element('#mapEmpty').style.display, 'grid');
  app.set('observations', [observation('Matt', 'Robin', { latitude: 40, longitude: -89 })]);
  render();
  assert.equal(calls.fits.length, 1);
  assert.equal(app.element('#mapEmpty').style.display, 'none');
  render();
  assert.equal(calls.fits.length, 1);
});

test('map retains its plain-layer fallback when the clustering plugin is unavailable', async () => {
  const { calls, render } = await createMapApp({ clustered: false });
  render();
  assert.equal(calls.layers[0].kind, 'plain');
  assert.equal(calls.layers[0].countOnAttach, 3);
  assert.equal(calls.fits.length, 1);
});

test('map can recover when Leaflet becomes available after a render', async () => {
  const { app, calls, render } = await createMapApp();
  const leaflet = app.window.L;
  app.window.L = undefined;
  render();
  assert.equal(calls.layers.length, 0);
  assert.match(app.element('#mapEmpty').textContent, /Map tiles are loading/);
  app.window.L = leaflet;
  render();
  assert.equal(calls.layers.length, 1);
  assert.equal(calls.fits.length, 1);
  assert.equal(app.element('#mapEmpty').style.display, 'none');
});
