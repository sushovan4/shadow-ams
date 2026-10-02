// Two live figures for the deck, in plain JavaScript and SVG.
//
//  #shadow-lab       a sample, its Vietoris-Rips complex and the shadow, recomputed
//                    as the scale beta, the hop epsilon and the metric change.
//  #shadow-collapse  the octahedral Rips complex of a hexagon falling onto its
//                    shadow, driven by the fragments of its slide.
//  #shadow-pinch     the R^4 example: two centroids glued in the shadow.
//  #apex-proof       the proof of the apex theorem, step by step.
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

    // one timeline s: 0 the planar sample, 1 lifted to the octahedron R, 2 its shadow in the plane
    function render(s, showH) {
      var lift = Math.min(1, s), fall = Math.max(0, Math.min(1, s - 1));
      var e = s <= 1 ? 1 - ease(lift) : ease(fall);  // 1 = in the plane, 0 = the octahedron
      var v = s <= 1 ? ease(lift) : 1;               // how much of the complex is drawn
      var shadow = s > 1;
      hexFill.setAttribute('points', pts([1, 2, 3, 4, 5, 6], e));
      hexFill.setAttribute('fill-opacity', shadow ? 0.07 * e : 0);
      f135.setAttribute('points', pts([1, 3, 5], e));
      f246.setAttribute('points', pts([2, 4, 6], e));
      f135.setAttribute('fill-opacity', v * (0.18 - 0.04 * e));
      f246.setAttribute('fill-opacity', v * (0.08 + 0.06 * e));
      for (var key in lines) {
        var ij = key.split('-'), p = at(+ij[0], e), q = at(+ij[1], e);
        var L = lines[key];
        L.setAttribute('x1', p[0]); L.setAttribute('y1', p[1]);
        L.setAttribute('x2', q[0]); L.setAttribute('y2', q[1]);
        L.setAttribute('opacity', v);
        L.setAttribute('stroke-dasharray', HIDDEN[key] && e < 0.5 ? '4 4' : 'none');
      }
      for (key in diag) {
        var ab = key.split('-'), u = at(+ab[0], e), w = at(+ab[1], e);
        var Dg = diag[key];
        Dg.setAttribute('x1', u[0]); Dg.setAttribute('y1', u[1]);
        Dg.setAttribute('x2', w[0]); Dg.setAttribute('y2', w[1]);
        Dg.setAttribute('opacity', shadow ? Math.max(0, (e - 0.6) / 0.4) : 0);
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
      x.setAttribute('opacity', shadow && e > 0.95 ? 1 : 0);
      var Rb = 'ℛ<tspan baseline-shift="sub" font-size="14">β</tspan>(𝒮)';
      cap.innerHTML = s < 0.02 ? '𝒮 ⊂ ℝ²: six points of a regular hexagon; β between the two diagonals'
        : s < 0.98 ? 'join every pair closer than β…'
        : s < 1.02 ? Rb + ': every pair but the three long diagonals, an octahedron ≃ S²'
        : s < 1.98 ? 'the shadow projection p flattens it back into the plane…'
        : showH ? 'the central hexagon H: opposite faces 135 and 246 overlap'
        : 'Sh(' + Rb + '): the filled hexagon, contractible';
    }

    // a timer, not requestAnimationFrame: it also runs when the tab is in the
    // background on a presenter's second screen
    var current = 0, timer = null, showH = false;
    function animateTo(target) {
      if (timer) clearInterval(timer);
      var from = current, t0 = Date.now(), dur = 1400 * Math.max(1, Math.abs(target - from));
      timer = setInterval(function () {
        var u = Math.min(1, (Date.now() - t0) / dur);
        current = from + (target - from) * u;
        render(current, showH);
        if (u >= 1) { clearInterval(timer); timer = null; }
      }, 16);
    }

    // the slide carries invisible fragments with data-collapse="1" (lift to R), "2" (shadow) and "3" (show H)
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
      showH = n >= 3;
      var target = Math.min(n, 2);
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

  // ------------------------------------------------------------------------
  // the pinch: in R^4 two polar triangles have centroids with the same image
  // (Chambers--de Silva--Erickson--Ghrist). The complex is the octahedral
  // sphere; in the shadow the two centroids are one point, and a path from one
  // to the other through the vertices 1 and 2 becomes a loop that no loop of the
  // complex maps onto. Driven by fragments data-pinch="1" (glue) and "2" (loop).
  // ------------------------------------------------------------------------
  function buildPinch(root) {
    var C = [300, 178], R = 150;
    // an orthographic view chosen so that each centroid sits well inside its face,
    // clear of every edge; vertex 3 is at the back
    var OCT = { 1: [0, -1.033], 4: [0, 1.033], 2: [1.049, 0.033], 3: [0.147, -0.236],
                5: [-1.049, -0.033], 6: [-0.147, 0.236] };
    var HIDDEN = { '1-3': 1, '2-3': 1, '3-4': 1, '3-5': 1 };
    var P = {};
    for (var k = 1; k <= 6; k++) P[k] = [C[0] + R * OCT[k][0], C[1] + R * OCT[k][1]];
    var cen = function (a, b, c) {
      return [(P[a][0] + P[b][0] + P[c][0]) / 3, (P[a][1] + P[b][1] + P[c][1]) / 3];
    };
    var c135 = cen(1, 3, 5), c246 = cen(2, 4, 6);

    var svg = el('svg', { viewBox: '0 0 640 396', class: 'collapse-figure', role: 'img',
                          'aria-label': 'Two polar triangles in R^4 whose centroids are glued in the shadow' }, root);
    el('polygon', { points: [1, 3, 5].map(function (i) { return P[i].join(','); }).join(' '),
                    fill: OX, 'fill-opacity': 0.13, stroke: 'none' }, svg);
    el('polygon', { points: [2, 4, 6].map(function (i) { return P[i].join(','); }).join(' '),
                    fill: OX, 'fill-opacity': 0.13, stroke: 'none' }, svg);
    for (var i = 1; i <= 6; i++) for (var j = i + 1; j <= 6; j++) {
      if (Math.abs(i - j) === 3) continue;
      el('line', { x1: P[i][0], y1: P[i][1], x2: P[j][0], y2: P[j][1], stroke: INK,
                   'stroke-width': 1.2, 'stroke-dasharray': HIDDEN[i + '-' + j] ? '4 4' : 'none' }, svg);
    }
    for (k = 1; k <= 6; k++) {
      el('circle', { cx: P[k][0], cy: P[k][1], r: 4, fill: INK }, svg);
      var dx = P[k][0] - C[0], dy = P[k][1] - C[1], n = Math.hypot(dx, dy) || 1;
      var t = el('text', { x: P[k][0] + 18 * dx / n, y: P[k][1] + 18 * dy / n + 6, 'text-anchor': 'middle',
                           'font-family': 'EB Garamond, Georgia, serif', 'font-size': 17, fill: SEPIA }, svg);
      t.textContent = k;
    }

    // the glue: the two centroids, joined and labeled outside the octahedron,
    // drawn on the first click
    var mid = [(c135[0] + c246[0]) / 2, (c135[1] + c246[1]) / 2];
    var glue = el('path', { d: 'M ' + c135.join(' ') + ' L ' + c246.join(' '),
                            fill: 'none', stroke: OX, 'stroke-width': 2.4, 'stroke-dasharray': '3 4',
                            opacity: 0 }, svg);
    var labAt = [C[0] + R + 40, C[1] + 70];
    var leader = el('path', { d: 'M ' + mid.join(' ') + ' L ' + (labAt[0] - 6) + ' ' + (labAt[1] - 6),
                              stroke: OX, 'stroke-width': 0.9, fill: 'none', opacity: 0 }, svg);
    var glueLab = el('text', { x: labAt[0], y: labAt[1], 'text-anchor': 'start', fill: OX,
                               'font-family': 'EB Garamond, Georgia, serif', 'font-style': 'italic',
                               'font-size': 19, opacity: 0 }, svg);
    glueLab.textContent = 'one point of Sh in ℝ⁴';

    // the new loop: c135 → 1 → 2 → c246, closed by the glue; drawn on the second click
    var loop = el('path', { d: 'M ' + c135.join(' ') + ' L ' + P[1].join(' ') + ' L ' + P[2].join(' ') +
                                ' L ' + c246.join(' '),
                            fill: 'none', stroke: OX, 'stroke-width': 3, 'stroke-linejoin': 'round',
                            'stroke-linecap': 'round' }, svg);
    function setDraw(path, u) {
      var len = path.getTotalLength();
      path.setAttribute('stroke-dasharray', len + ' ' + len);
      path.setAttribute('stroke-dashoffset', len * (1 - u));
    }

    [[c135, 'c<tspan baseline-shift="sub" font-size="12" font-style="normal" font-family="KaTeX_Main, Georgia, serif">135</tspan>', -8, 26], [c246, 'c<tspan baseline-shift="sub" font-size="12" font-style="normal" font-family="KaTeX_Main, Georgia, serif">246</tspan>', 0, 25]].forEach(function (c) {
      el('circle', { cx: c[0][0], cy: c[0][1], r: 5, fill: PAPER, stroke: OX, 'stroke-width': 2 }, svg);
      var tt = el('text', { x: c[0][0] + c[2], y: c[0][1] + c[3], 'text-anchor': 'middle',
                            fill: OX, 'font-family': 'EB Garamond, Georgia, serif', 'font-style': 'italic',
                            'font-size': 17 }, svg);
      tt.innerHTML = c[1];
    });
    var cap = el('text', { x: 320, y: 388, 'text-anchor': 'middle', 'font-family': 'EB Garamond, Georgia, serif',
                           'font-style': 'italic', 'font-size': 20, fill: SEPIA }, svg);

    var state = { glue: 0, loop: 0 }, timer = null;
    function render() {
      glue.setAttribute('opacity', state.glue > 0 ? 1 : 0);
      glueLab.setAttribute('opacity', state.glue);
      leader.setAttribute('opacity', state.glue);
      if (state.glue > 0) setDraw(glue, state.glue);
      setDraw(loop, state.loop);
      loop.setAttribute('opacity', state.loop > 0 ? 1 : 0);
      cap.innerHTML = state.loop > 0.98
        ? 'a loop of Sh that no loop of ℛ maps onto: π<tspan baseline-shift="sub" font-size="15" font-style="normal" font-family="KaTeX_Main, Georgia, serif">1</tspan>(Sh) ≅ ℤ, π<tspan baseline-shift="sub" font-size="15" font-style="normal" font-family="KaTeX_Main, Georgia, serif">1</tspan>(ℛ) = 0'
        : state.glue > 0.98 ? 'in ℝ⁴ the centroids c<tspan baseline-shift="sub" font-size="15" font-style="normal" font-family="KaTeX_Main, Georgia, serif">135</tspan> and c<tspan baseline-shift="sub" font-size="15" font-style="normal" font-family="KaTeX_Main, Georgia, serif">246</tspan> have the same image'
        : 'ℛ: two polar triangles 135 and 246 in ℝ⁴, an octahedron ≃ S²';
    }
    function animateTo(target) {
      if (timer) clearInterval(timer);
      var from = { glue: state.glue, loop: state.loop }, t0 = Date.now(), dur = 1200;
      timer = setInterval(function () {
        var u = Math.min(1, (Date.now() - t0) / dur);
        state.glue = from.glue + (target.glue - from.glue) * u;
        state.loop = from.loop + (target.loop - from.loop) * u;
        render();
        if (u >= 1) { clearInterval(timer); timer = null; }
      }, 16);
    }

    var slide = root.closest('section');
    function steps() {
      var n = 0;
      Array.prototype.forEach.call(slide.querySelectorAll('[data-pinch]'), function (f) {
        if (f.classList.contains('visible')) n = Math.max(n, +f.getAttribute('data-pinch'));
      });
      return { glue: n >= 1 ? 1 : 0, loop: n >= 2 ? 1 : 0 };
    }
    function sync(animate) {
      var t = steps();
      if (animate) animateTo(t); else { state.glue = t.glue; state.loop = t.loop; render(); }
    }
    render();
    function hook() {
      if (typeof Reveal === 'undefined' || !Reveal.on) { setTimeout(hook, 100); return; }
      Reveal.on('fragmentshown', function (ev) { if (slide.contains(ev.fragment)) sync(true); });
      Reveal.on('fragmenthidden', function (ev) { if (slide.contains(ev.fragment)) sync(true); });
      Reveal.on('slidechanged', function (ev) { if (ev.currentSlide === slide) sync(false); });
      Reveal.on('ready', function () { sync(false); });
      sync(false);
    }
    hook();
  }

  // ------------------------------------------------------------------------
  // the proof of the apex theorem: shadow, shadow complex, subdivision, apex map.
  // Geometry from tools/apex_proof.py (window.APEX_PROOF); the fragments of the
  // slide carry data-aproof = 1 (SC), 2 (sd SC), 3 (b_tau to a_tau), 4 (text only).
  // ------------------------------------------------------------------------
  function buildApexProof(root) {
    var D = window.APEX_PROOF;
    if (!D) return;
    var svg = el('svg', { viewBox: '20 8 420 372', class: 'collapse-figure', role: 'img',
                          'aria-label': 'The proof of the apex theorem, step by step' }, root);
    var K = D.K, XY = K.pos;
    // the shadow: the hulls of the triangles of K
    K.tris.forEach(function (t) {
      el('polygon', { points: t.map(function (i) { return XY[i].join(','); }).join(' '),
                      fill: OX, 'fill-opacity': 0.13, stroke: 'none' }, svg);
    });
    // the shadow complex: cells triangulated, crossings as new vertices
    var scLayer = el('g', { opacity: 0 }, svg);
    D.scEdges.forEach(function (e) {
      el('line', { x1: e[0][0], y1: e[0][1], x2: e[1][0], y2: e[1][1], stroke: OX,
                   'stroke-width': 1.1, opacity: 0.75 }, scLayer);
    });
    // the subdivision, drawn as moving triangles
    var sdLayer = el('g', { opacity: 0 }, svg);
    var polys = D.sd.map(function () {
      return el('polygon', { fill: OX, 'fill-opacity': 0.07, stroke: OX, 'stroke-width': 0.6,
                             'stroke-opacity': 0.7, 'stroke-linejoin': 'round' }, sdLayer);
    });
    // the edges of K and its vertices, on top
    K.edges.forEach(function (e) {
      el('line', { x1: XY[e[0]][0], y1: XY[e[0]][1], x2: XY[e[1]][0], y2: XY[e[1]][1],
                   stroke: INK, 'stroke-width': 1.4 }, svg);
    });
    var cx = 0, cy = 0;
    XY.forEach(function (q) { cx += q[0] / XY.length; cy += q[1] / XY.length; });
    XY.forEach(function (q, i) {
      el('circle', { cx: q[0], cy: q[1], r: 4.2, fill: INK }, svg);
      var dx = q[0] - cx, dy = q[1] - cy, n = Math.hypot(dx, dy) || 1;
      var t = el('text', { x: q[0] + 17 * dx / n, y: q[1] + 17 * dy / n + 6, 'text-anchor': 'middle',
                           'font-family': 'EB Garamond, Georgia, serif', 'font-style': 'italic',
                           'font-size': 19, fill: SEPIA }, svg);
      t.textContent = K.names[i];
    });
    var crossDots = D.cross.map(function (q) {
      return el('circle', { cx: q[0], cy: q[1], r: 4.4, fill: PAPER, stroke: OX, 'stroke-width': 1.6,
                            opacity: 0 }, svg);
    });
    var dots = D.nodes.map(function (nd) {
      return nd.kind === 'v' ? null :
        el('circle', { r: nd.kind === 't' ? 3 : 2.4, fill: nd.kind === 't' ? OX : SEPIA, opacity: 0 }, svg);
    });
    var cap = el('text', { x: 230, y: 368, 'text-anchor': 'middle', 'font-family': 'EB Garamond, Georgia, serif',
                           'font-style': 'italic', 'font-size': 19, fill: SEPIA }, svg);
    var sub = function (s) {
      return '<tspan dy="4" font-size="14">' + s + '</tspan><tspan dy="-4"> </tspan>';
    };

    var state = { sc: 0, sd: 0, t: 0, n: 0 }, timer = null;
    function ease(u) { return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }
    function render() {
      var e = ease(state.t);
      var at = function (k) {
        var nd = D.nodes[k];
        return [nd.pos[0] + (nd.to[0] - nd.pos[0]) * e, nd.pos[1] + (nd.to[1] - nd.pos[1]) * e];
      };
      scLayer.setAttribute('opacity', state.sc * (1 - e));
      crossDots.forEach(function (c) { c.setAttribute('opacity', state.sc * (1 - e)); });
      sdLayer.setAttribute('opacity', state.sd);
      D.sd.forEach(function (ch, i) {
        polys[i].setAttribute('points', ch.map(function (k) { return at(k).join(','); }).join(' '));
      });
      D.nodes.forEach(function (nd, k) {
        if (!dots[k]) return;
        var q = at(k);
        dots[k].setAttribute('cx', q[0]); dots[k].setAttribute('cy', q[1]);
        dots[k].setAttribute('opacity', state.sd);
      });
      cap.innerHTML = state.n >= 4 ? 'p∘A ≃ id and A∘p ≃ id, along straight lines'
        : state.n >= 3 ? (state.t > 0.98 ? 'A: sd SC(𝒦) → 𝒦 is simplicial; it lands on 𝒦'
                                         : 'each b' + sub('τ') + 'goes to an apex a' + sub('τ') + '…')
        : state.n >= 2 ? 'subdivide once: a vertex b' + sub('τ') + 'for each simplex τ'
        : state.n >= 1 ? 'the shadow complex SC(𝒦): crossings become vertices'
        : 'Sh(𝒦) for EAB, ECD, CFG: not a cone';
    }
    function animateTo(target) {
      if (timer) clearInterval(timer);
      var from = { sc: state.sc, sd: state.sd, t: state.t }, t0 = Date.now();
      var dur = Math.abs(target.t - from.t) > 0.5 ? 2000 : 700;
      state.n = target.n;
      timer = setInterval(function () {
        var u = Math.min(1, (Date.now() - t0) / dur);
        state.sc = from.sc + (target.sc - from.sc) * u;
        state.sd = from.sd + (target.sd - from.sd) * u;
        state.t = from.t + (target.t - from.t) * u;
        render();
        if (u >= 1) { clearInterval(timer); timer = null; }
      }, 16);
    }

    var slide = root.closest('section');
    function steps() {
      var n = 0;
      Array.prototype.forEach.call(slide.querySelectorAll('[data-aproof]'), function (f) {
        if (f.classList.contains('visible')) n = Math.max(n, +f.getAttribute('data-aproof'));
      });
      return { n: n, sc: n >= 1 ? 1 : 0, sd: n >= 2 ? 1 : 0, t: n >= 3 ? 1 : 0 };
    }
    function sync(animate) {
      var t = steps();
      if (animate) animateTo(t);
      else { state.sc = t.sc; state.sd = t.sd; state.t = t.t; state.n = t.n; render(); }
    }
    render();
    function hook() {
      if (typeof Reveal === 'undefined' || !Reveal.on) { setTimeout(hook, 100); return; }
      Reveal.on('fragmentshown', function (ev) { if (slide.contains(ev.fragment)) sync(true); });
      Reveal.on('fragmenthidden', function (ev) { if (slide.contains(ev.fragment)) sync(true); });
      Reveal.on('slidechanged', function (ev) { if (ev.currentSlide === slide) sync(false); });
      Reveal.on('ready', function () { sync(false); });
      sync(false);
    }
    hook();
  }

  function init() {
    var lab = document.getElementById('shadow-lab');
    if (lab && !lab.dataset.built) { lab.dataset.built = 1; buildLab(lab); }
    var col = document.getElementById('shadow-collapse');
    if (col && !col.dataset.built) { col.dataset.built = 1; buildCollapse(col); }
    var pin = document.getElementById('shadow-pinch');
    if (pin && !pin.dataset.built) { pin.dataset.built = 1; buildPinch(pin); }
    var apx = document.getElementById('apex-proof');
    if (apx && !apx.dataset.built) { apx.dataset.built = 1; buildApexProof(apx); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
