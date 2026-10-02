"""Generate the SVG figures and section plates for the deck.

Run from the repository root:  python3 tools/figures.py
Every figure that shows a sample, a Vietoris--Rips complex or a shadow is
computed here, not drawn by hand: the complexes are the actual flag complexes
of the sampled points under the stated metric.
"""

import heapq
import itertools
import math
import os
import random

OX, INK, SEPIA, PENCIL, RULE, PAPER, PAPER_SOFT = (
    "#6c1d1a", "#2b211a", "#57473a", "#8c7d6a", "#c8b894", "#f5efde", "#ede5cf")
SERIF = "EB Garamond, Georgia, serif"
CAPS = "Alegreya SC, EB Garamond, Georgia, serif"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")


# --------------------------------------------------------------------------
# geometry
# --------------------------------------------------------------------------
def dist(p, q):
    return math.hypot(p[0] - q[0], p[1] - q[1])


def bezier(p0, p1, p2, t):
    a = (1 - t) ** 2
    b = 2 * (1 - t) * t
    c = t ** 2
    return (a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1])


def sample_curve(p0, p1, p2, spacing, noise, rng, skip_start=False):
    """Roughly equally spaced points along a quadratic Bezier, with noise."""
    fine = [bezier(p0, p1, p2, i / 400) for i in range(401)]
    pts, acc = ([] if skip_start else [fine[0]]), 0.0
    for a, b in zip(fine, fine[1:]):
        acc += dist(a, b)
        if acc >= spacing:
            pts.append(b)
            acc = 0.0
    return [(x + rng.uniform(-noise, noise), y + rng.uniform(-noise, noise))
            for x, y in pts]


def path_metric(pts, eps):
    """All-pairs eps-path metric: shortest paths in the eps-neighborhood graph."""
    n = len(pts)
    nbr = [[j for j in range(n) if j != i and dist(pts[i], pts[j]) < eps]
           for i in range(n)]
    D = []
    for s in range(n):
        d = [math.inf] * n
        d[s] = 0.0
        heap = [(0.0, s)]
        while heap:
            du, u = heapq.heappop(heap)
            if du > d[u]:
                continue
            for v in nbr[u]:
                nd = du + dist(pts[u], pts[v])
                if nd < d[v]:
                    d[v] = nd
                    heapq.heappush(heap, (nd, v))
        D.append(d)
    return D


def euclid_metric(pts):
    return [[dist(p, q) for q in pts] for p in pts]


def rips(D, beta):
    n = len(D)
    edges = [(i, j) for i in range(n) for j in range(i + 1, n) if D[i][j] < beta]
    adj = {i: set() for i in range(n)}
    for i, j in edges:
        adj[i].add(j)
        adj[j].add(i)
    tris = [(i, j, k) for i, j in edges for k in adj[i] & adj[j] if k > j]
    return edges, tris


def seg_intersect(p1, p2, p3, p4):
    d = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0])
    if abs(d) < 1e-12:
        return None
    t = ((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) / d
    u = ((p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0])) / d
    if 0 < t < 1 and 0 < u < 1:
        return (p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1]))
    return None


# --------------------------------------------------------------------------
# svg helpers
# --------------------------------------------------------------------------
def f(x):
    return f"{x:.1f}".rstrip("0").rstrip(".")


def poly(points, **attrs):
    pts = " ".join(f"{f(x)},{f(y)}" for x, y in points)
    return f'<polygon points="{pts}"{_attrs(attrs)}/>'


def line(p, q, **attrs):
    return (f'<line x1="{f(p[0])}" y1="{f(p[1])}" x2="{f(q[0])}" '
            f'y2="{f(q[1])}"{_attrs(attrs)}/>')


def circle(p, r, **attrs):
    return f'<circle cx="{f(p[0])}" cy="{f(p[1])}" r="{f(r)}"{_attrs(attrs)}/>'


def text(p, s, size=14, italic=True, fill=INK, anchor="middle", caps=False,
         spacing=None, weight=None):
    fam = CAPS if caps else SERIF
    style = ' font-style="italic"' if italic and not caps else ""
    ls = f' letter-spacing="{spacing}"' if spacing else ""
    w = f' font-weight="{weight}"' if weight else ""
    return (f'<text x="{f(p[0])}" y="{f(p[1])}" fill="{fill}" font-family="{fam}"'
            f' font-size="{size}"{style}{ls}{w} text-anchor="{anchor}">{s}</text>')


def _attrs(attrs):
    return "".join(f' {k.replace("_", "-")}="{v}"' for k, v in attrs.items())


def svg(w, h, body, label):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
            f'role="img" aria-label="{label}">\n' + "\n".join(body) + "\n</svg>\n")


def complex_layers(pts, edges, tris, fill=OX, fill_opacity=0.16, edge=OX,
                   edge_w=0.8, edge_opacity=0.55, pt_r=2.4, pt_fill=INK):
    """Shadow (union of triangle hulls, flat tint via group opacity), edges, points."""
    out = [f'<g opacity="{fill_opacity}" fill="{fill}" stroke="none">']
    out += [poly([pts[i], pts[j], pts[k]]) for i, j, k in tris]
    out += ["</g>", f'<g stroke="{edge}" stroke-width="{edge_w}" '
            f'opacity="{edge_opacity}" stroke-linecap="round">']
    out += [line(pts[i], pts[j]) for i, j in edges]
    out += ["</g>", f'<g fill="{pt_fill}" stroke="none">']
    out += [circle(p, pt_r) for p in pts]
    out.append("</g>")
    return out


def fleurons():
    petal = ('<path d="M 0 -8 Q 5 -3 0 0 Q -5 -3 0 -8 Z"/>'
             '<path d="M 0 8  Q 5 3  0 0 Q -5 3  0 8  Z"/>'
             '<path d="M -8 0 Q -3 -5 0 0 Q -3 5 -8 0 Z"/>'
             '<path d="M 8 0  Q 3 -5  0 0 Q 3 5  8 0  Z"/>'
             '<circle cx="0" cy="0" r="2.0"/>')
    out = [f'<g fill="{RULE}" stroke="none">']
    for x, y in [(52, 52), (668, 52), (52, 348), (668, 348)]:
        out.append(f'<g transform="translate({x}, {y}) scale(0.9)">{petal}</g>')
    out.append("</g>")
    return out


def plate(title, deck, caption, art, label):
    body = [f'<rect x="36" y="36" width="648" height="328" fill="none" '
            f'stroke="{RULE}" stroke-width="0.6"/>',
            text((360, 68), title, 16, caps=True, fill=OX, spacing=4, weight=500),
            text((360, 92), deck, 13, fill=SEPIA),
            line((120, 104), (600, 104), stroke=RULE, stroke_width=0.5)]
    body += art
    body += fleurons()
    body.append(text((360, 356), caption, 11, caps=True, fill=SEPIA, spacing=3))
    return svg(720, 400, body, label)


def write(name, content):
    with open(os.path.join(OUT, name), "w") as fh:
        fh.write(content)
    print("wrote", name)


# --------------------------------------------------------------------------
# shared samples
# --------------------------------------------------------------------------
def y_graph(center, arms, spacing, noise, seed):
    """A three-pronged graph: curved arms (control, end) from a common vertex."""
    rng = random.Random(seed)
    pts = [center]
    curves = []
    for ctrl, end in arms:
        curves.append((center, ctrl, end))
        pts += sample_curve(center, ctrl, end, spacing, noise, rng, skip_start=True)
    return pts, curves


def curve_path(curves):
    return " ".join(f"M {f(a[0])} {f(a[1])} Q {f(b[0])} {f(b[1])} {f(c[0])} {f(c[1])}"
                    for a, b, c in curves)


def hairpin(x0, gap, top, bottom, spacing, noise, seed):
    """A U-shaped arc: two vertical legs joined by a half-circle at the bottom."""
    rng = random.Random(seed)
    r = gap / 2
    cx = x0 + r
    fine = []
    for i in range(200):
        fine.append((x0, top + (bottom - top) * i / 199))
    for i in range(1, 120):
        a = math.pi - math.pi * i / 120
        fine.append((cx + r * math.cos(a), bottom + r * math.sin(a)))
    for i in range(200):
        fine.append((x0 + gap, bottom - (bottom - top) * i / 199))
    pts, acc = [fine[0]], 0.0
    for a, b in zip(fine, fine[1:]):
        acc += dist(a, b)
        if acc >= spacing:
            pts.append(b)
            acc = 0.0
    pts = [(x + rng.uniform(-noise, noise), y + rng.uniform(-noise, noise))
           for x, y in pts]
    d = (f"M {f(x0)} {f(top)} L {f(x0)} {f(bottom)} "
         f"A {f(r)} {f(r)} 0 0 0 {f(x0 + gap)} {f(bottom)} L {f(x0 + gap)} {f(top)}")
    return pts, d


# --------------------------------------------------------------------------
# figures
# --------------------------------------------------------------------------
def fig_shadow():
    """The abstract complex, its shadow, and the shadow complex (after the paper)."""
    s = 70
    base = [(0, 0), (2, 0), (1, 2), (0, 1), (3, 1.5), (2.5, 2), (1.2, 0.4)]
    V = [(x * s, (2.2 - y) * s) for x, y in base]
    tri = (0, 1, 2)
    segs = [(3, 4), (5, 6)]
    body = []
    panels = [(40, "the complex 𝒦"), (300, "its shadow Sh(𝒦) ⊂ ℝᴺ"),
              (560, "the shadow complex")]
    cross = []
    for a, b in segs:
        for e in [(0, 1), (1, 2), (2, 0), (3, 4), (5, 6)]:
            if {a, b} == set(e):
                continue
            X = seg_intersect(V[a], V[b], V[e[0]], V[e[1]])
            if X:
                cross.append(X)
    cross = sorted({(round(x, 3), round(y, 3)) for x, y in cross})
    for k, (dx, label) in enumerate(panels):
        g = [f'<g transform="translate({dx},18)">']
        P = V
        T = [P[i] for i in tri]
        if k == 0:
            g.append(poly(T, fill=OX, fill_opacity=0.10, stroke=OX, stroke_width=1.2))
            for a, b in segs:
                g.append(line(P[a], P[b], stroke=OX, stroke_width=1.2,
                              stroke_dasharray="5 4", opacity=0.8))
        elif k == 1:
            g.append(poly(T, fill=OX, fill_opacity=0.16, stroke="none"))
            for a, b in segs:
                g.append(line(P[a], P[b], stroke=OX, stroke_width=2.2,
                              stroke_linecap="round", opacity=0.75))
        else:
            g.append(poly(T, fill=OX, fill_opacity=0.10, stroke=OX, stroke_width=1.0))
            for a, b in segs:
                g.append(line(P[a], P[b], stroke=OX, stroke_width=1.0))
            inner = P[6]
            for v in (0, 1):
                g.append(line(inner, P[v], stroke=OX, stroke_width=0.8, opacity=0.6))
            for X in cross:
                if dist(X, inner) > 1:
                    g.append(line(inner, X, stroke=OX, stroke_width=0.8, opacity=0.6))
            for X in cross:
                g.append(circle(X, 4.2, fill=PAPER, stroke=OX, stroke_width=1.6))
        for p in P:
            g.append(circle(p, 3.8, fill=INK))
        g.append(text((105, 190), label, 18, fill=SEPIA))
        g.append("</g>")
        body += g
    for x0 in (262, 522):
        body.append(line((x0, 90), (x0 + 22, 90), stroke=SEPIA, stroke_width=1))
        body.append(f'<path d="M {x0+16} 86 L {x0+23} 90 L {x0+16} 94" '
                    f'fill="none" stroke="{SEPIA}" stroke-width="1"/>')
    body.append(text((285, 80), "p", 18, fill=SEPIA))
    write("shadow.svg", svg(780, 220, body, "A complex, its shadow, and the shadow complex"))


def octa_hexagon(scale=1.0, dx=0, dy=0, labels=True, captions=True):
    """Chambers--de Silva--Erickson--Ghrist: R is an octahedron (S^2), Sh(R) a hexagon."""
    def T(p):
        return (dx + p[0] * scale, dy + p[1] * scale)
    out = []
    # --- left: the octahedron, labeled so antipodes are (1,4),(2,5),(3,6)
    c, R = (170, 150), 105
    O = {1: (0, -1.05), 4: (0, 1.05), 2: (0.95, -0.12), 3: (0.42, 0.26),
         5: (-0.95, 0.12), 6: (-0.42, -0.26)}
    O = {k: (c[0] + R * x, c[1] + R * y) for k, (x, y) in O.items()}
    anti = {frozenset(p) for p in [(1, 4), (2, 5), (3, 6)]}
    hidden = {frozenset(p) for p in [(4, 6), (5, 6), (6, 2)]}
    out.append(poly([T(O[1]), T(O[3]), T(O[5])], fill=OX, fill_opacity=0.18, stroke="none"))
    out.append(poly([T(O[4]), T(O[2]), T(O[6])], fill=OX, fill_opacity=0.08, stroke="none"))
    for a, b in itertools.combinations(range(1, 7), 2):
        if frozenset((a, b)) in anti:
            continue
        dash = {"stroke_dasharray": "4 4"} if frozenset((a, b)) in hidden else {}
        out.append(line(T(O[a]), T(O[b]), stroke=INK, stroke_width=1.1 * scale, **dash))
    for k, p in O.items():
        out.append(circle(T(p), 3.6 * scale, fill=INK))
        if labels:
            off = {1: (0, -10), 4: (0, 20), 2: (13, 4), 3: (6, 18), 5: (-13, 4), 6: (-8, -9)}[k]
            out.append(text(T((p[0] + off[0], p[1] + off[1])), str(k), 14 * scale,
                            italic=False, fill=SEPIA))
    # --- arrow
    out.append(line(T((300, 150)), T((370, 150)), stroke=SEPIA, stroke_width=1.2 * scale))
    out.append(f'<path d="M {f(T((362,145))[0])} {f(T((362,145))[1])} L {f(T((371,150))[0])} '
               f'{f(T((371,150))[1])} L {f(T((362,155))[0])} {f(T((362,155))[1])}" fill="none" '
               f'stroke="{SEPIA}" stroke-width="{1.2*scale}"/>')
    if labels:
        out.append(text(T((335, 140)), "p", 15 * scale, fill=SEPIA))
    # --- right: the planar hexagon; long diagonals are the missing edges
    hc, hr = (520, 150), 110
    H = {k: (hc[0] + hr * math.cos(math.radians(90 - 60 * (k - 1))),
             hc[1] - hr * math.sin(math.radians(90 - 60 * (k - 1)))) for k in range(1, 7)}
    out.append(poly([T(H[k]) for k in range(1, 7)], fill=OX, fill_opacity=0.08, stroke="none"))
    out.append(poly([T(H[1]), T(H[3]), T(H[5])], fill=OX, fill_opacity=0.14,
                    stroke=OX, stroke_width=1.4 * scale))
    out.append(poly([T(H[2]), T(H[4]), T(H[6])], fill=OX, fill_opacity=0.14,
                    stroke=OX, stroke_width=1.4 * scale))
    for a, b in itertools.combinations(range(1, 7), 2):
        if frozenset((a, b)) in anti:
            out.append(line(T(H[a]), T(H[b]), stroke=PENCIL, stroke_width=0.8 * scale,
                            stroke_dasharray="1.5 4"))
        else:
            out.append(line(T(H[a]), T(H[b]), stroke=INK, stroke_width=1.0 * scale))
    for k, p in H.items():
        out.append(circle(T(p), 3.6 * scale, fill=INK))
        if labels:
            ang = math.radians(90 - 60 * (k - 1))
            q = (p[0] + 15 * math.cos(ang), p[1] - 15 * math.sin(ang) + 5)
            out.append(text(T(q), str(k), 14 * scale, italic=False, fill=SEPIA))
    Hc = [(hc[0] + hr / math.sqrt(3) * math.cos(math.radians(60 * k)),
           hc[1] - hr / math.sqrt(3) * math.sin(math.radians(60 * k))) for k in range(6)]
    out.append(poly([T(p) for p in Hc], fill=OX, fill_opacity=0.32, stroke=OX,
                    stroke_width=1.2 * scale))
    out.append(circle(T(hc), 4.2 * scale, fill=PAPER, stroke=OX, stroke_width=1.6 * scale))
    if labels:
        out.append(text(T((hc[0] + 14, hc[1] + 5)), "x", 15 * scale, fill=OX, anchor="start"))
        out.append(text(T((hc[0] - 22, hc[1] + 24)), "H", 15 * scale, fill=OX, italic=True))
    if captions:
        out.append(text(T((170, 312)), "ℛ ≃ S²,  π₂(ℛ) ≅ ℤ", 18, fill=SEPIA))
        out.append(text(T((520, 312)), "Sh(ℛ) contractible; no apex on H", 18, fill=SEPIA))
    return out


def fig_hexagon():
    write("hexagon.svg", svg(690, 322, octa_hexagon(),
                             "The octahedral Rips complex of a hexagon and its contractible shadow"))


def fig_hairpin():
    """Euclidean Rips versus eps-path Rips on a sample of a hairpin."""
    body = []
    pts, d = hairpin(0, 44, 0, 150, 11, 1.6, seed=7)
    beta, eps = 50, 16
    for k, (dx, title, D) in enumerate([
            (60, "Euclidean Vietoris–Rips", euclid_metric(pts)),
            (400, "ε-path Vietoris–Rips", path_metric(pts, eps))]):
        edges, tris = rips(D, beta)
        g = [f'<g transform="translate({dx + 90},34)">']
        g.append(f'<path d="{d}" fill="none" stroke="{SEPIA}" stroke-width="1" '
                 f'stroke-dasharray="3 3" opacity="0.7"/>')
        g += complex_layers(pts, edges, tris, edge_w=0.7, pt_r=2.2)
        g.append("</g>")
        body += g
        body.append(text((dx + 112, 262), title, 16, fill=OX if k else SEPIA))
    body.append(text((172, 290), "fills the gap: a disk, the loop is lost", 18, fill=SEPIA))
    body.append(text((512, 290), "respects the gap: the arc survives", 18, fill=SEPIA))
    write("hairpin.svg", svg(680, 300, body,
                             "Euclidean and path-metric Rips complexes of a hairpin sample"))


def fig_apex():
    """The apex condition: every simplex whose hull covers x joins a common vertex."""
    body = ['<g transform="translate(60,10)">']
    a, b, c = (60, 200), (250, 190), (120, 40)
    d, e, f_ = (70, 90), (230, 70), (190, 230)
    x = (152, 140)
    vx = (300, 110)
    body += [poly([a, b, c], fill=OX, fill_opacity=0.12, stroke=INK, stroke_width=1.3),
             poly([d, e, f_], fill=OX, fill_opacity=0.12, stroke=INK, stroke_width=1.3)]
    for p in (a, b, c, d, e, f_):
        body.append(line(vx, p, stroke=OX, stroke_width=1.0, stroke_dasharray="4 3",
                         opacity=0.8))
        body.append(circle(p, 3.8, fill=INK))
    body += [circle(vx, 5.5, fill=OX),
             text((vx[0] + 12, vx[1] + 5), "vₓ", 17, fill=OX, anchor="start"),
             circle(x, 4.5, fill=PAPER, stroke=OX, stroke_width=1.6),
             text((x[0] - 4, x[1] - 10), "x", 16, fill=OX),
             text((160, 268), "st(x, 𝒦) = every simplex whose hull contains x", 18, fill=SEPIA),
             text((160, 288), "apex: vₓ ∗ st(x, 𝒦) ⊂ 𝒦", 18, fill=SEPIA), "</g>"]
    write("apex.svg", svg(460, 300, body, "The apex condition at a point of the shadow"))


def fig_sharp():
    """The scale-free configuration at a sharp vertex (discussion of the paper):
    a 30-degree angle bisected by a third branch. The chord from 0.95 beta out on one
    sharp branch to 0.04 beta out on the other crosses the bisector at about 0.074
    beta, inside an edge of the bisector from 0.07 beta to 1.06 beta. Left: the
    configuration at scale; right: the corner magnified."""
    def at(O, s, r, deg):
        a = math.radians(deg)
        return (O[0] + s * r * math.cos(a), O[1] - s * r * math.sin(a))

    body = []
    for O, s, L, zoom in [((30.0, 130.0), 250.0, 1.2, False), ((412.0, 130.0), 1750.0, 0.12, True)]:
        P, Q = at(O, s, 0.95, 15), at(O, s, 0.04, -15)
        R, T = at(O, s, 0.07, 0), at(O, s, 1.06, 0)
        X = seg_intersect(P, Q, R, T)
        clip = ''
        if zoom:
            body.append('<defs><clipPath id="zoom"><rect x="385" y="30" width="230" height="200"/>'
                        '</clipPath></defs>')
            body.append('<rect x="385" y="30" width="230" height="200" fill="none" '
                        f'stroke="{RULE}" stroke-width="1"/>')
            clip = ' clip-path="url(#zoom)"'
        g = [f'<g{clip}>']
        for deg in (15, -15, 0):
            g.append(line(O, at(O, s, L, deg), stroke=SEPIA, stroke_width=1.1,
                          stroke_dasharray="4 3"))
        g += [line(R, T, stroke=INK, stroke_width=2.4), line(P, Q, stroke=OX, stroke_width=2.0),
              circle(O, 4.5, fill=PAPER, stroke=INK, stroke_width=1.5)]
        for p in (P, Q, R, T):
            g.append(circle(p, 4.0, fill=INK))
        g.append(circle(X, 4.6, fill=PAPER, stroke=OX, stroke_width=1.7))
        if zoom:
            g += [text((O[0] - 4, O[1] - 10), "v", 18, anchor="end"),
                  text((Q[0] + 4, Q[1] + 22), "0.04β", 16, fill=OX, anchor="start"),
                  text((R[0] - 20, R[1] - 12), "0.07β", 16, anchor="start"),
                  text((X[0] + 6, X[1] + 26), "0.074β", 16, fill=OX, anchor="start")]
        else:
            g += [text((O[0] - 6, O[1] + 5), "v", 18, anchor="end"),
                  text((P[0] - 10, P[1] - 10), "0.95β", 16, fill=OX, anchor="start"),
                  text((T[0] - 20, T[1] + 24), "1.06β", 16, anchor="start"),
                  text((O[0] + 85, O[1] - 4), "15°", 15, fill=SEPIA, anchor="start"),
                  text((O[0] + 85, O[1] + 17), "15°", 15, fill=SEPIA, anchor="start"),
                  f'<rect x="{O[0] - 6}" y="{O[1] - 14}" width="40" height="30" fill="none" '
                  f'stroke="{RULE}" stroke-width="1"/>']
        g.append('</g>')
        body += g
    body += [text((320, 262), "the far ends are more than 2β apart in dᵋ: x has no apex;", 17,
                  fill=SEPIA),
             text((320, 284), "yet, for a sample on the graph, p is a homotopy equivalence", 17,
                  fill=SEPIA)]
    write("sharp.svg", svg(640, 300, body, "A scale-free configuration at a sharp vertex"))

def fig_vertex_apex():
    """Two Rips edges crossing at a vertex whose four branches are straight, with the
    sample on the graph and beta = 1: all four endpoints are within beta of v along the
    graph, so the sample point E = v is adjacent to all of them and is an apex of x."""
    s, O = 150.0, (190.0, 160.0)

    def at(r, deg):
        a = math.radians(deg)
        return (O[0] + s * r * math.cos(a), O[1] - s * r * math.sin(a))

    body = [circle(O, s, fill="none", stroke=RULE, stroke_width=1, stroke_dasharray="3 3"),
            text(at(1.08, 55), "β", 17, fill=SEPIA)]
    for deg in (0, 100, 190, 280):
        body.append(line(O, at(1.12, deg), stroke=SEPIA, stroke_width=1.1))
        for k in range(1, 12):
            body.append(circle(at(0.1 * k, deg), 2.0, fill=PENCIL))
    A, B, C, D = at(0.55, 0), at(0.4, 100), at(0.5, 100), at(0.45, 0)
    X = seg_intersect(A, B, C, D)
    for p in (A, B, C, D):
        body.append(line(O, p, stroke=OX, stroke_width=0.9, stroke_dasharray="4 3", opacity=0.8))
    body += [line(A, B, stroke=INK, stroke_width=2.0), line(C, D, stroke=OX, stroke_width=2.0)]
    for p, lab, off in [(A, "A", (8, 16)), (B, "B", (-16, 4)), (C, "C", (-16, 0)),
                        (D, "D", (-2, 20))]:
        body += [circle(p, 4.0, fill=INK), text((p[0] + off[0], p[1] + off[1]), lab, 17)]
    body += [circle(X, 4.4, fill=PAPER, stroke=OX, stroke_width=1.6),
             text((X[0] + 8, X[1] - 8), "x", 17, fill=OX, anchor="start"),
             circle(O, 5.5, fill=OX),
             text((O[0] - 10, O[1] + 22), "E = v", 17, fill=OX, anchor="end"),
             text((190, 384), "every end within β of v: v is an apex of x", 17,
                  fill=SEPIA)]
    write("vertex-apex.svg", svg(380, 394, body, "An apex at a vertex with straight branches"))


def title_plate():
    """Left title-plate: a sampled three-pronged graph and its eps-path Rips shadow.
    Drawn bold, as it is shown at about 130 pixels: few, large sample points and a
    thick shadow band that reads as one shape."""
    pts, curves = y_graph((300, 290), [((240, 200), (70, 120)),
                                       ((370, 210), (530, 105)),
                                       ((320, 420), (285, 555))], 32, 17.0, seed=3)
    D = path_metric(pts, 70)
    edges, tris = rips(D, 185)
    body = complex_layers(pts, edges, tris, fill_opacity=0.32, edge_w=2.6,
                          edge_opacity=0.55, pt_r=8.5)
    body.insert(0, f'<path d="{curve_path(curves)}" fill="none" stroke="{INK}" '
                   f'stroke-width="3" opacity="0.55" stroke-dasharray="10 8"/>')
    body.append(circle((300, 290), 13, fill="none", stroke=OX, stroke_width=4))
    # crop to the drawing, with a small margin, so it fills the plate
    xs = [x for x, _ in pts]; ys = [y for _, y in pts]
    side = max(max(xs) - min(xs), max(ys) - min(ys)) + 40
    cx, cy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
    out = svg(600, 600, body, "A sampled graph and its shadow")
    out = out.replace('viewBox="0 0 600 600"',
                      f'viewBox="{f(cx - side / 2)} {f(cy - side / 2)} {f(side)} {f(side)}"')
    write("title-plate.svg", out)


# --------------------------------------------------------------------------
# section plates
# --------------------------------------------------------------------------
def plate_i():
    art = octa_hexagon(scale=0.66, dx=130, dy=118, labels=False, captions=False)
    write("section-i-plate.svg", plate(
        "THE SHADOW AND ITS OBSTRUCTION",
        "— the abstract complex says what; its shadow must say where —",
        "— AN OCTAHEDRON ABOVE, A HEXAGON BELOW —", art, "Section I plate"))


def plate_ii():
    pts, d = hairpin(0, 36, 0, 120, 10, 1.3, seed=5)
    art = []
    for dx, D, lab in [(220, euclid_metric(pts), "EUCLIDEAN"),
                       (470, path_metric(pts, 14), "ε-PATH")]:
        edges, tris = rips(D, 42)
        art.append(f'<g transform="translate({dx},140)">')
        art += complex_layers(pts, edges, tris, edge_w=0.7, pt_r=1.9)
        art.append("</g>")
        art.append(text((dx + 18, 312), lab, 11, caps=True, fill=SEPIA, spacing=2))
    write("section-ii-plate.svg", plate(
        "CHANGE THE METRIC",
        "— the obstruction is metric, not dimensional —",
        "— THE SAME SAMPLE, TWO COMPLEXES —", art, "Section II plate"))


def y_plate(noise, seed):
    pts, curves = y_graph((360, 215), [((320, 160), (250, 140)),
                                       ((410, 170), (480, 128)),
                                       ((372, 270), (352, 318))], 12, noise, seed=seed)
    D = path_metric(pts, 20)
    edges, tris = rips(D, 40)
    art = [f'<path d="{curve_path(curves)}" fill="none" stroke="{INK}" '
           f'stroke-width="0.8" opacity="0.5" stroke-dasharray="3 3"/>']
    art += complex_layers(pts, edges, tris, fill_opacity=0.2, edge_w=0.7, pt_r=2.0)
    return art


def plate_iv():
    write("section-iv-plate.svg", plate(
        "THE SHADOW OF A GRAPH SAMPLE",
        "— on the graph, and near it —",
        "— A SAMPLE ON 𝒢, ITS SHADOW —", y_plate(0.0, 9), "Section IV plate"))


def plate_v():
    write("section-v-plate.svg", plate(
        "A SAMPLE OFF THE GRAPH",
        "— the shadow loses nothing of the topology —",
        "— A SAMPLE NEAR 𝒢, ITS SHADOW —", y_plate(2.4, 9), "Section V plate"))


def plate_iii():
    art = []
    a, b, c = (270, 290), (400, 285), (320, 160)
    d, e, f_ = (285, 190), (395, 175), (370, 305)
    vx, x = (470, 200), (342, 232)
    art += [poly([a, b, c], fill=OX, fill_opacity=0.12, stroke=INK, stroke_width=1.1),
            poly([d, e, f_], fill=OX, fill_opacity=0.12, stroke=INK, stroke_width=1.1)]
    for p in (a, b, c, d, e, f_):
        art += [line(vx, p, stroke=OX, stroke_width=0.9, stroke_dasharray="4 3", opacity=0.8),
                circle(p, 3.2, fill=INK)]
    art += [circle(vx, 4.8, fill=OX), circle(x, 3.8, fill=PAPER, stroke=OX, stroke_width=1.4)]
    write("section-iii-plate.svg", plate(
        "THE APEX CONDITION",
        "— homotopy equivalence in every dimension —",
        "— EVERY SIMPLEX COVERING x JOINS ONE VERTEX —", art, "Section IV plate"))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    fig_shadow()
    fig_hexagon()
    fig_hairpin()
    fig_vertex_apex()
    fig_sharp()
    fig_apex()
    title_plate()
    plate_i()
    plate_ii()
    plate_iii()
    plate_iv()
    plate_v()
