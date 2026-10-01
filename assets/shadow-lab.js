// Two live figures for the deck, in plain JavaScript and SVG.
//
//  #shadow-lab       a sample, its Vietoris-Rips complex and the shadow, recomputed
//                    as the scale beta, the hop epsilon and the metric change.
//  #shadow-collapse  the octahedral Rips complex of a hexagon falling onto its
//                    shadow, driven by the fragments of its slide.
//
// Both are computed, not drawn: the complexes are flag complexes of the sampled
// points under the stated metric, and in the plane the shadow of a flag complex
// is the union of its edges and triangles (Caratheodory).

(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var OX = '#6c1d1a', INK = '#2b211a', SEPIA = '#57473a', PENCIL = '#8c7d6a',
      RULE = '#c8b894', PAPER = '#f5efde';

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // ------------------------------------------------------------------------
  // deterministic noise, so the sample is the same every time the deck loads
  // ------------------------------------------------------------------------
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function resample(poly, spacing, noise, seed) {
    var r = rng(seed), out = [], acc = 0;
    out.push(poly[0]);
    for (var i = 1; i < poly.length; i++) {
      var a = poly[i - 1], b = poly[i];
      acc += Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (acc >= spacing) { out.push(b); acc = 0; }
    }
    return out.map(function (p) {
      return [p[0] + (2 * r() - 1) * noise, p[1] + (2 * r() - 1) * noise];
    });
  }

  // The two shapes: a hairpin (two legs of one arc, close in R^2 and far along
  // the arc) and a sharp vertex (three straight branches at 15, 0 and -15 degrees).
  var SHAPES = {
    hairpin: function () {
      var x0 = 270, gap = 54, top = 40, bottom = 250, r = gap / 2, fine = [], i;
      for (i = 0; i <= 300; i++) fine.push([x0, top + (bottom - top) * i / 300]);
      for (i = 1; i < 160; i++) {
        var a = Math.PI - Math.PI * i / 160;
        fine.push([x0 + r + r * Math.cos(a), bottom + r * Math.sin(a)]);
      }
      for (i = 0; i <= 300; i++) fine.push([x0 + gap, bottom - (bottom - top) * i / 300]);
      return {
        pts: resample(fine, 9, 1.6, 7),
        path: 'M ' + x0 + ' ' + top + ' L ' + x0 + ' ' + bottom + ' A ' + r + ' ' + r +
              ' 0 0 0 ' + (x0 + gap) + ' ' + bottom + ' L ' + (x0 + gap) + ' ' + top,
        bridged: function (p, q) {
          var mid = x0 + gap / 2;
          return (p[0] - mid) * (q[0] - mid) < 0 && Math.max(p[1], q[1]) < bottom - 4;
        },
        msg: ['the gap is bridged: the loop is filled in', 'the gap is respected: the arc survives']
      };
    },
    corner: function () {
      var v = [80, 180], L = 520, fine = [], pts = [v];
      [15, 0, -15].forEach(function (deg, k) {
        var a = deg * Math.PI / 180, arm = [];
        for (var i = 1; i <= 400; i++) {
          arm.push([v[0] + L * i / 400 * Math.cos(a), v[1] - L * i / 400 * Math.sin(a)]);
        }
        pts = pts.concat(resample([v].concat(arm), 10, 0, 11 + k).slice(1));
        fine.push('M ' + v[0] + ' ' + v[1] + ' L ' + arm[arm.length - 1][0] + ' ' +
                  arm[arm.length - 1][1]);
      });
      var armOf = function (p) {
        var a = Math.atan2(v[1] - p[1], p[0] - v[0]) * 180 / Math.PI;
        return a > 7.5 ? 0 : (a < -7.5 ? 2 : 1);
      };
      return {
        pts: pts,
        path: fine.join(' '),
        bridged: function (p, q) {
          var dp = Math.hypot(p[0] - v[0], p[1] - v[1]), dq = Math.hypot(q[0] - v[0], q[1] - v[1]);
          return armOf(p) !== armOf(q) && Math.min(dp, dq) > 12;
        },
        msg: ['edges jump between branches far from the vertex', 'branches meet only near the vertex']
      };
    }
  };

  function euclid(pts) {
    return pts.map(function (p) {
      return pts.map(function (q) { return Math.hypot(p[0] - q[0], p[1] - q[1]); });
    });
  }

  // all-pairs shortest paths in the eps-neighborhood graph (Dijkstra, dense)
  function pathMetric(pts, eps) {
    var n = pts.length, E = euclid(pts), D = [];
    for (var s = 0; s < n; s++) {
      var d = new Array(n).fill(Infinity), done = new Array(n).fill(false);
      d[s] = 0;
      for (var it = 0; it < n; it++) {
        var u = -1, best = Infinity;
        for (var i = 0; i < n; i++) if (!done[i] && d[i] < best) { best = d[i]; u = i; }
        if (u < 0) break;
        done[u] = true;
        for (var w = 0; w < n; w++) {
          if (!done[w] && E[u][w] < eps && d[u] + E[u][w] < d[w]) d[w] = d[u] + E[u][w];
        }
      }
      D.push(d);
    }
    return D;
  }

  function rips(D, beta) {
    var n = D.length, edges = [], tris = [], adj = [];
    for (var i = 0; i < n; i++) adj.push([]);
    for (i = 0; i < n; i++) for (var j = i + 1; j < n; j++) {
      if (D[i][j] < beta) { edges.push([i, j]); adj[i].push(j); adj[j].push(i); }
    }
    var nb = adj.map(function (a) { var s = {}; a.forEach(function (k) { s[k] = 1; }); return s; });
    edges.forEach(function (e) {
      adj[e[0]].forEach(function (k) { if (k > e[1] && nb[e[1]][k]) tris.push([e[0], e[1], k]); });
    });
    return { edges: edges, tris: tris };
  }

  // ------------------------------------------------------------------------
  // the lab
  // ------------------------------------------------------------------------
  function buildLab(root) {
    var state = { shape: 'hairpin', metric: 'euclid', beta: 64, eps: 14 };
    var cache = {};

    var bar = document.createElement('div');
    bar.className = 'lab-controls';
    root.appendChild(bar);

    function toggle(label, key, options) {
      var g = document.createElement('div');
      g.className = 'lab-group';
      g.innerHTML = '<span class="lab-label">' + label + '</span>';
      options.forEach(function (o) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = o[1];
        b.dataset.value = o[0];
        b.addEventListener('click', function () { state[key] = o[0]; sync(); draw(); });
        g.appendChild(b);
      });
      bar.appendChild(g);
      return g;
    }
    function slider(label, key, min, max) {
      var g = document.createElement('label');
      g.className = 'lab-group';
      g.innerHTML = '<span class="lab-label">' + label + '</span>';
      var s = document.createElement('input');
      s.type = 'range'; s.min = min; s.max = max; s.step = 1; s.value = state[key];
      var out = document.createElement('span');
      out.className = 'lab-value';
      s.addEventListener('input', function () { state[key] = +s.value; sync(); draw(); });
      g.appendChild(s); g.appendChild(out);
      bar.appendChild(g);
      return { input: s, out: out, group: g };
    }

    var gShape = toggle('Shape', 'shape', [['hairpin', 'hairpin'], ['corner', 'sharp vertex']]);
    var gMetric = toggle('Metric', 'metric', [['euclid', 'Euclidean'], ['path', 'ε-path']]);
    var sBeta = slider('β', 'beta', 6, 140);
    var sEps = slider('ε', 'eps', 6, 40);

    var svg = el('svg', { viewBox: '0 0 640 330', class: 'lab-figure', role: 'img',
                          'aria-label': 'A sample, its Vietoris-Rips complex and its shadow' }, root);
    var gGraph = el('path', { fill: 'none', stroke: SEPIA, 'stroke-width': 1,
                              'stroke-dasharray': '3 3', opacity: 0.7 }, svg);
    var gShadow = el('g', { fill: OX, stroke: OX, 'stroke-width': 2.2, 'stroke-linecap': 'round',
                            opacity: 0.2 }, svg);
    var gEdges = el('g', { stroke: OX, 'stroke-width': 0.7, opacity: 0.55 }, svg);
    var gBridge = el('g', { stroke: OX, 'stroke-width': 1.6, opacity: 0.95 }, svg);
    var gPts = el('g', { fill: INK }, svg);
    var caption = document.createElement('div');
    caption.className = 'lab-caption';
    root.appendChild(caption);

    function sync() {
      [gShape, gMetric].forEach(function (g) {
        Array.prototype.forEach.call(g.querySelectorAll('button'), function (b) {
          var key = g === gShape ? 'shape' : 'metric';
          b.classList.toggle('on', b.dataset.value === state[key]);
        });
      });
      sBeta.out.textContent = state.beta;
      sEps.out.textContent = state.eps;
      sEps.group.classList.toggle('off', state.metric !== 'path');
    }

    function draw() {
      var shape = cache[state.shape] || (cache[state.shape] = SHAPES[state.shape]());
      var pts = shape.pts, D;
      if (state.metric === 'euclid') {
        D = shape.E || (shape.E = euclid(pts));
      } else {
        var k = 'P' + state.eps;
        D = shape[k] || (shape[k] = pathMetric(pts, state.eps));
      }
      var cx = rips(D, state.beta);
      gGraph.setAttribute('d', shape.path);
      [gShadow, gEdges, gBridge, gPts].forEach(function (g) { while (g.firstChild) g.removeChild(g.firstChild); });
      cx.tris.forEach(function (t) {
        el('polygon', { points: t.map(function (i) { return pts[i].join(','); }).join(' '),
                        stroke: 'none' }, gShadow);
      });
      var bridged = 0;
      cx.edges.forEach(function (e) {
        var p = pts[e[0]], q = pts[e[1]];
        var a = { x1: p[0], y1: p[1], x2: q[0], y2: q[1] };
        el('line', a, gShadow);
        if (shape.bridged(p, q)) { bridged++; el('line', a, gBridge); }
        else el('line', a, gEdges);
      });
      pts.forEach(function (p) { el('circle', { cx: p[0], cy: p[1], r: 2.4 }, gPts); });
      caption.innerHTML = '<span class="lab-stat">' + cx.edges.length + ' edges · ' +
        cx.tris.length + ' triangles</span> ' + (bridged ? shape.msg[0] : shape.msg[1]);
    }

    sync();
    draw();
  }

  // ------------------------------------------------------------------------
  // the collapse: an octahedron falls onto its hexagon
  // ------------------------------------------------------------------------
  function buildCollapse(root) {
    var C = [320, 152];
    // octahedron, labeled so antipodes are (1,4), (2,5), (3,6); drawn from slightly above
    var OCT = { 1: [0, -1.05], 4: [0, 1.05], 2: [0.95, -0.12], 3: [0.42, 0.26],
                5: [-0.95, 0.12], 6: [-0.42, -0.26] };
    var HIDDEN = { '4-6': 1, '5-6': 1, '2-6': 1 };
    var R = 115, start = {}, end = {};
    for (var k = 1; k <= 6; k++) {
      start[k] = [C[0] + R * OCT[k][0], C[1] + R * OCT[k][1]];
      var a = (90 - 60 * (k - 1)) * Math.PI / 180;
      end[k] = [C[0] + 125 * Math.cos(a), C[1] - 125 * Math.sin(a)];
    }
    var anti = function (i, j) { return Math.abs(i - j) === 3; };

    var svg = el('svg', { viewBox: '0 0 640 340', class: 'collapse-figure', role: 'img',
                          'aria-label': 'The octahedral Rips complex of a hexagon and its shadow' }, root);
    var hexFill = el('polygon', { fill: OX, 'fill-opacity': 0.06, stroke: 'none' }, svg);
    var f135 = el('polygon', { fill: OX, stroke: 'none' }, svg);
    var f246 = el('polygon', { fill: OX, stroke: 'none' }, svg);
    var H = el('polygon', { fill: OX, 'fill-opacity': 0.32, stroke: OX, 'stroke-width': 1.2 }, svg);
    var lines = {}, diag = {};
    for (var i = 1; i <= 6; i++) for (var j = i + 1; j <= 6; j++) {
      if (anti(i, j)) {
        diag[i + '-' + j] = el('line', { stroke: PENCIL, 'stroke-width': 0.9,
                                         'stroke-dasharray': '1.5 4' }, svg);
      } else {
        lines[i + '-' + j] = el('line', { stroke: INK, 'stroke-width': 1.2 }, svg);
      }
    }
    var dots = {}, labels = {};
    for (k = 1; k <= 6; k++) {
      dots[k] = el('circle', { r: 4, fill: INK }, svg);
      labels[k] = el('text', { 'font-family': 'EB Garamond, Georgia, serif', 'font-size': 17,
                               fill: SEPIA, 'text-anchor': 'middle' }, svg);
      labels[k].textContent = k;
    }
    var x = el('circle', { cx: C[0], cy: C[1], r: 4.5, fill: PAPER, stroke: OX, 'stroke-width': 1.6 }, svg);
    var cap = el('text', { x: C[0], y: 330, 'text-anchor': 'middle', 'font-family': 'EB Garamond, Georgia, serif',
                           'font-style': 'italic', 'font-size': 19, fill: SEPIA }, svg);

    function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function at(k, t) {
      return [start[k][0] + (end[k][0] - start[k][0]) * t, start[k][1] + (end[k][1] - start[k][1]) * t];
    }
    function pts(ids, t) { return ids.map(function (k) { return at(k, t).join(','); }).join(' '); }

    function render(t, showH) {
      var e = ease(t);
      hexFill.setAttribute('points', pts([1, 2, 3, 4, 5, 6], e));
      hexFill.setAttribute('fill-opacity', 0.07 * e);
      f135.setAttribute('points', pts([1, 3, 5], e));
      f246.setAttribute('points', pts([2, 4, 6], e));
      f135.setAttribute('fill-opacity', 0.18 - 0.04 * e);
      f246.setAttribute('fill-opacity', 0.08 + 0.06 * e);
      for (var key in lines) {
        var ij = key.split('-'), p = at(+ij[0], e), q = at(+ij[1], e);
        var L = lines[key];
        L.setAttribute('x1', p[0]); L.setAttribute('y1', p[1]);
        L.setAttribute('x2', q[0]); L.setAttribute('y2', q[1]);
        L.setAttribute('stroke-dasharray', HIDDEN[key] && e < 0.5 ? '4 4' : 'none');
      }
      for (key in diag) {
        var ab = key.split('-'), u = at(+ab[0], e), w = at(+ab[1], e);
        var Dg = diag[key];
        Dg.setAttribute('x1', u[0]); Dg.setAttribute('y1', u[1]);
        Dg.setAttribute('x2', w[0]); Dg.setAttribute('y2', w[1]);
        Dg.setAttribute('opacity', Math.max(0, (e - 0.6) / 0.4));
      }
      for (var k = 1; k <= 6; k++) {
        var p0 = at(k, e), dx = p0[0] - C[0], dy = p0[1] - C[1], n = Math.hypot(dx, dy) || 1;
        dots[k].setAttribute('cx', p0[0]); dots[k].setAttribute('cy', p0[1]);
        labels[k].setAttribute('x', p0[0] + 18 * dx / n);
        labels[k].setAttribute('y', p0[1] + 18 * dy / n + 6);
      }
      var inner = [];
      for (k = 0; k < 6; k++) {
        var ang = 60 * k * Math.PI / 180;
        inner.push([C[0] + 125 / Math.sqrt(3) * Math.cos(ang), C[1] - 125 / Math.sqrt(3) * Math.sin(ang)].join(','));
      }
      H.setAttribute('points', inner.join(' '));
      H.setAttribute('opacity', showH ? 1 : 0);
      x.setAttribute('opacity', e > 0.95 ? 1 : 0);
      cap.textContent = e < 0.02 ? 'ℛ: every edge but the three long diagonals, an octahedron, ≃ S²'
        : e < 0.98 ? 'the shadow projection p flattens it…'
        : showH ? 'no apex on the central hexagon H'
        : 'Sh(ℛ): the filled hexagon, contractible';
    }

    // a timer, not requestAnimationFrame: it also runs when the tab is in the
    // background on a presenter's second screen
    var current = 0, timer = null, showH = false;
    function animateTo(target) {
      if (timer) clearInterval(timer);
      var from = current, t0 = Date.now(), dur = 1400;
      timer = setInterval(function () {
        var u = Math.min(1, (Date.now() - t0) / dur);
        current = from + (target - from) * u;
        render(current, showH);
        if (u >= 1) { clearInterval(timer); timer = null; }
      }, 16);
    }

    // the slide carries invisible fragments with data-collapse="1" (fall) and "2" (show H)
    var slide = root.closest('section');
    function stepsShown() {
      var n = 0;
      Array.prototype.forEach.call(slide.querySelectorAll('[data-collapse]'), function (f) {
        if (f.classList.contains('visible')) n = Math.max(n, +f.getAttribute('data-collapse'));
      });
      return n;
    }
    function syncToFragments(animate) {
      var n = stepsShown();
      showH = n >= 2;
      var target = n >= 1 ? 1 : 0;
      if (animate) animateTo(target); else { current = target; render(current, showH); }
    }
    render(0, false);
    function hook() {
      if (typeof Reveal === 'undefined' || !Reveal.on) { setTimeout(hook, 100); return; }
      Reveal.on('fragmentshown', function (ev) { if (slide.contains(ev.fragment)) syncToFragments(true); });
      Reveal.on('fragmenthidden', function (ev) { if (slide.contains(ev.fragment)) syncToFragments(true); });
      Reveal.on('slidechanged', function (ev) { if (ev.currentSlide === slide) syncToFragments(false); });
      Reveal.on('ready', function () { syncToFragments(false); });
      syncToFragments(false);
    }
    hook();
  }

  function init() {
    var lab = document.getElementById('shadow-lab');
    if (lab && !lab.dataset.built) { lab.dataset.built = 1; buildLab(lab); }
    var col = document.getElementById('shadow-collapse');
    if (col && !col.dataset.built) { col.dataset.built = 1; buildCollapse(col); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
