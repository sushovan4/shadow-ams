"""Geometry for the animated proof of the apex theorem.

Run from the repository root:  python3 tools/apex_proof.py
Writes assets/apex-proof-data.js. A flag complex K in the plane (triangles EAB,
ECD and CFG, whose edges cross; no vertex is adjacent to all the others), its shadow complex SC(K) (the arrangement of the
hull boundaries, each cell triangulated), the barycentric subdivision of SC(K),
and for each simplex tau of SC(K) an apex a_tau of its barycenter. The script
checks that each cell of SC(K) lies in a fixed set of hulls and that along every
chain the apices span a simplex of K, the step of the proof the animation shows.
"""

import os
import itertools, math, json
# K: flag complex on A..G; triangles EAB, ECD, CFG. EAB and ECD overlap (apex E only),
# ECD and CFG overlap (apex C only), and no vertex is adjacent to all: K is not a cone.
P = {'E': (60, 170), 'A': (300, 40), 'B': (290, 285), 'C': (400, 105), 'D': (210, 300),
     'F': (350, 52), 'G': (372, 205)}
edgesK = {frozenset(e) for e in [('E','A'),('E','B'),('A','B'),('E','C'),('E','D'),('C','D'),
                                  ('C','F'),('C','G'),('F','G')]}
V = list(P)
adj = lambda u, v: u == v or frozenset((u, v)) in edgesK
# flag: all cliques
simp = [frozenset([v]) for v in V] + sorted(edgesK, key=sorted)
simp += [frozenset(t) for t in itertools.combinations(V, 3) if all(adj(a, b) for a, b in itertools.combinations(t, 2))]
tris = [s for s in simp if len(s) == 3]
print('triangles', [''.join(sorted(t)) for t in tris])

def cross(o, a, b): return (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0])
def in_hull(x, s, eps=1e-7):
    pts = [P[v] for v in s]
    if len(pts) == 1: return math.dist(x, pts[0]) < 1e-6
    if len(pts) == 2:
        a, b = pts
        if abs(cross(a, b, x)) > 1e-6 * math.dist(a, b): return False
        t = ((x[0]-a[0])*(b[0]-a[0]) + (x[1]-a[1])*(b[1]-a[1])) / math.dist(a, b)**2
        return -eps <= t <= 1 + eps
    a, b, c = pts
    s1, s2, s3 = cross(a, b, x), cross(b, c, x), cross(c, a, x)
    return (s1 >= -eps and s2 >= -eps and s3 >= -eps) or (s1 <= eps and s2 <= eps and s3 <= eps)

def seg_int(p1, p2, p3, p4):
    d = (p2[0]-p1[0])*(p4[1]-p3[1]) - (p2[1]-p1[1])*(p4[0]-p3[0])
    if abs(d) < 1e-12: return None
    t = ((p3[0]-p1[0])*(p4[1]-p3[1]) - (p3[1]-p1[1])*(p4[0]-p3[0])) / d
    u = ((p3[0]-p1[0])*(p2[1]-p1[1]) - (p3[1]-p1[1])*(p2[0]-p1[0])) / d
    if 1e-9 < t < 1-1e-9 and 1e-9 < u < 1-1e-9:
        return (p1[0]+t*(p2[0]-p1[0]), p1[1]+t*(p2[1]-p1[1]))
    return None

# sanity: no vertex of K in the hull of a simplex not containing it
for v in V:
    for s in simp:
        if v not in s and in_hull(P[v], s): raise SystemExit(f'vertex {v} lies in hull of {sorted(s)}')

# arrangement: split every K edge at crossings
pts = [P[v] for v in V]; names = list(V)
def pid(x):
    for i, q in enumerate(pts):
        if math.dist(q, x) < 1e-6: return i
    pts.append(x); names.append(None); return len(pts)-1
E = sorted(tuple(sorted(e)) for e in edgesK)
splits = {e: [P[e[0]], P[e[1]]] for e in E}
for e, f in itertools.combinations(E, 2):
    if set(e) & set(f): continue
    X = seg_int(P[e[0]], P[e[1]], P[f[0]], P[f[1]])
    if X: splits[e].append(X); splits[f].append(X)
segs = set()
for e, L in splits.items():
    a = P[e[0]]
    L = sorted(L, key=lambda q: math.dist(a, q))
    for q, r in zip(L, L[1:]): segs.add(frozenset((pid(q), pid(r))))
print('crossings', [tuple(round(c, 1) for c in pts[i]) for i in range(len(V), len(pts))])
# faces by half-edge traversal
nbr = {i: [] for i in range(len(pts))}
for s in segs:
    i, j = tuple(s); nbr[i].append(j); nbr[j].append(i)
ang = lambda i, j: math.atan2(pts[j][1]-pts[i][1], pts[j][0]-pts[i][0])
for i in nbr: nbr[i].sort(key=lambda j: ang(i, j))
used = set(); faces = []
for i in nbr:
    for j in nbr[i]:
        if (i, j) in used: continue
        face = []; u, v = i, j
        while (u, v) not in used:
            used.add((u, v)); face.append(u)
            L = nbr[v]; k = L.index(u)
            u, v = v, L[(k - 1) % len(L)]
        faces.append(face)
def area(f):
    return sum(pts[f[k]][0]*pts[f[(k+1)%len(f)]][1] - pts[f[(k+1)%len(f)]][0]*pts[f[k]][1] for k in range(len(f)))/2
faces = [f for f in faces if area(f) > 1e-6] or faces

def centroid(f): return (sum(pts[i][0] for i in f)/len(f), sum(pts[i][1] for i in f)/len(f))
def st(x): return [s for s in simp if in_hull(x, s)]
faces = [f for f in faces if any(in_hull(centroid(f), t) for t in tris)]
# ear clipping (faces are simple polygons); orient ccw in math sense = positive area here
def ear_clip(f):
    f = list(f); out = []
    sgn = 1 if area(f) > 0 else -1
    while len(f) > 3:
        for k in range(len(f)):
            a, b, c = f[k-1], f[k], f[(k+1) % len(f)]
            if sgn * cross(pts[a], pts[b], pts[c]) <= 1e-9: continue
            if any(sgn*cross(pts[a],pts[b],pts[q]) > 0 and sgn*cross(pts[b],pts[c],pts[q]) > 0 and sgn*cross(pts[c],pts[a],pts[q]) > 0
                   for q in f if q not in (a, b, c)): continue
            out.append((a, b, c)); f.pop(k); break
    out.append(tuple(f)); return out
SC = [t for f in faces for t in ear_clip(f)]
print('SC triangles', len(SC))
# compatibility check: each SC triangle interior has a constant st
for t in SC:
    bc = centroid(t)
    for w in [(0.6,0.2,0.2),(0.2,0.6,0.2),(0.2,0.2,0.6)]:
        y = tuple(sum(w[k]*pts[t[k]][d] for k in range(3)) for d in range(2))
        assert set(st(y)) == set(st(bc)), 'SC not compatible'
# apex for a point: valid = adjacent-or-equal to all of V(x); choose nearest valid
def apex(x, prefer=None):
    Vx = set().union(*st(x))
    ok = [v for v in V if all(adj(v, w) for w in Vx)]
    assert ok, f'no apex at {x}'
    if prefer in ok: return prefer
    return min(ok, key=lambda v: math.dist(P[v], x))
# the apex condition on a dense grid over the shadow, and no universal apex
xs = [P[v][0] for v in V]; ys = [P[v][1] for v in V]
grid = [(x, y) for x in range(int(min(xs)), int(max(xs)) + 1, 2) for y in range(int(min(ys)), int(max(ys)) + 1, 2)]
grid = [g for g in grid if any(in_hull(g, t) for t in tris)]
for g in grid: apex(g)
assert not [v for v in V if all(adj(v, w) for w in V)], 'K is a cone'
only = {}
for g in grid:
    Vx = set().union(*st(g)); ok = tuple(sorted(v for v in V if all(adj(v, w) for w in Vx)))
    if len(ok) == 1: only[ok[0]] = only.get(ok[0], 0) + 1
print('apex condition holds at', len(grid), 'grid points; sole apex in places:', only)
# sd SC
SCedges = {frozenset(e) for t in SC for e in itertools.combinations(t, 2)}
nodes = {}   # key -> (pos, apex)
def key_v(i): return ('v', i)
def key_e(e): return ('e', tuple(sorted(e)))
def key_t(t): return ('t', tuple(sorted(t)))
for i in sorted({i for t in SC for i in t}):
    nodes[key_v(i)] = (pts[i], apex(pts[i], prefer=names[i]))
for e in sorted(SCedges, key=sorted):
    i, j = tuple(e); m = ((pts[i][0]+pts[j][0])/2, (pts[i][1]+pts[j][1])/2)
    nodes[key_e(e)] = (m, apex(m))
for t in SC:
    nodes[key_t(t)] = (centroid(t), apex(centroid(t)))
sd = []
for t in SC:
    for e in itertools.combinations(t, 2):
        for v in e:
            sd.append((key_v(v), key_e(e), key_t(t)))
# the proof's key step: apices of a chain are pairwise adjacent, so they span a simplex of K
for ch in sd:
    A = [nodes[k][1] for k in ch]
    assert all(adj(a, b) for a, b in itertools.combinations(A, 2)), ch
print('sd triangles', len(sd), '- every chain maps to a simplex of K')
from collections import Counter
print('apex use', Counter(n[1] for n in nodes.values()))

# ------------------------------------------------------------------ output
r1 = lambda q: [round(q[0], 1), round(q[1], 1)]
keys = list(nodes)
data = {
    'K': {'names': V, 'pos': [r1(P[v]) for v in V],
          'edges': [[V.index(a) for a in sorted(e)] for e in sorted(edgesK, key=sorted)],
          'tris': [[V.index(a) for a in sorted(t)] for t in tris]},
    'cross': [r1(pts[i]) for i in range(len(V), len(pts))],
    'scEdges': [[r1(pts[i]), r1(pts[j])] for i, j in (sorted(e) for e in sorted(SCedges, key=sorted))],
    'nodes': [{'kind': k[0], 'pos': r1(nodes[k][0]), 'to': r1(P[nodes[k][1]]), 'apex': nodes[k][1]} for k in keys],
    'sd': [[keys.index(k) for k in ch] for ch in sd],
}
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'apex-proof-data.js')
with open(out, 'w') as fh:
    fh.write('// generated by tools/apex_proof.py; do not edit\n')
    fh.write('window.APEX_PROOF = ' + json.dumps(data, separators=(',', ':')) + ';\n')
print('wrote apex-proof-data.js')
