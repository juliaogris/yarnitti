"""Write platonic/gi_geom.scad: the visible surface of the great icosahedron.

The great icosahedron is twenty large triangles passing through each other.
Its twelve vertices are those of an icosahedron, and each face joins three
vertices that are phi edges apart. What the eye sees is the outside of that
tangle: twelve fluted points, 180 small triangles, 92 corners and 270 creases.

Each face is cut by the planes of the other nineteen into small convex cells.
A cell is on the visible surface when the point just in front of it is outside
the solid and the point just behind it is inside. The edges of the visible
cells that no other visible cell on the same face shares are the creases.
Creases are then split where another crease ends on them and joined where two
run straight on through a corner, which leaves the stakes of the frame.

The corners fall into three kinds by distance from the centre: twelve tips,
twenty hubs where twelve creases meet, and sixty corners where three meet.
The creases fall into four lengths.

Run from the repo root:
    python3 platonic/gi.py
"""

import itertools
import math
from collections import Counter, defaultdict

PHI = (1 + 5**0.5) / 2
OUT = "platonic/gi_geom.scad"


def sub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def add(a, b):
    return tuple(x + y for x, y in zip(a, b))


def mul(a, k):
    return tuple(x * k for x in a)


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def norm(a):
    return math.sqrt(dot(a, a))


def unit(a):
    return mul(a, 1 / norm(a))


def cross(a, b):
    return (
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    )


def icosahedron():
    pts = []
    for a in (1, -1):
        for b in (1, -1):
            pts += [(0, a, b * PHI), (a, b * PHI, 0), (b * PHI, 0, a)]
    return pts


def faces(verts):
    """The twenty triangles of mutually far vertices, wound outward."""
    far = PHI * 2
    out = []
    for i, j, k in itertools.combinations(range(len(verts)), 3):
        a, b, c = verts[i], verts[j], verts[k]
        if all(abs(norm(sub(p, q)) - far) < 1e-6 for p, q in ((a, b), (b, c), (a, c))):
            n = cross(sub(b, a), sub(c, a))
            if dot(n, a) < 0:
                b, c, j, k = c, b, k, j
                n = mul(n, -1)
            out.append(((a, b, c), unit(n), (i, j, k)))
    assert len(out) == 20
    return out


def solid_angle(p, a, b, c):
    a, b, c = sub(a, p), sub(b, p), sub(c, p)
    la, lb, lc = norm(a), norm(b), norm(c)
    num = dot(a, cross(b, c))
    den = la * lb * lc + dot(a, b) * lc + dot(a, c) * lb + dot(b, c) * la
    return 2 * math.atan2(num, den)


def inside(p, fs):
    total = sum(solid_angle(p, *tri) for tri, _, _ in fs)
    return round(total / (4 * math.pi)) != 0


def area(poly):
    s = (0, 0, 0)
    for i in range(len(poly)):
        s = add(s, cross(poly[i], poly[(i + 1) % len(poly)]))
    return norm(s) / 2


def split(poly, n, d):
    """Cut a convex polygon by the plane n.x = d and keep both sides."""
    left, right = [], []
    for i in range(len(poly)):
        p, q = poly[i], poly[(i + 1) % len(poly)]
        sp, sq = dot(n, p) - d, dot(n, q) - d
        if abs(sp) <= 1e-12:
            left.append(p)
            right.append(p)
        elif sp < 0:
            left.append(p)
        else:
            right.append(p)
        if sp * sq < -1e-18:
            x = add(p, mul(sub(q, p), sp / (sp - sq)))
            left.append(x)
            right.append(x)
    return [c for c in (left, right) if len(c) >= 3 and area(c) > 1e-9]


def key(p):
    return tuple(round(x, 6) + 0.0 for x in p)


def creases(fs):
    count = Counter()
    for fi, (tri, n, _) in enumerate(fs):
        cells = [list(tri)]
        for fj, (tri2, n2, _) in enumerate(fs):
            if fj != fi:
                cells = [part for c in cells for part in split(c, n2, dot(n2, tri2[0]))]
        for c in cells:
            g = mul(tuple(map(sum, zip(*c))), 1 / len(c))
            front = inside(add(g, mul(n, 1e-6)), fs)
            back = inside(add(g, mul(n, -1e-6)), fs)
            if front == back:
                continue
            for i in range(len(c)):
                a, b = key(c[i]), key(c[(i + 1) % len(c)])
                if a != b:
                    count[(fi, *sorted((a, b)))] += 1
    return {tuple(k[1:]) for k, v in count.items() if v == 1}


def on_segment(x, seg):
    p, q = seg
    pq = sub(q, p)
    t = dot(sub(x, p), pq) / dot(pq, pq)
    return 1e-7 < t < 1 - 1e-7 and norm(sub(add(p, mul(pq, t)), x)) < 1e-6


def stakes(segs):
    """Split creases at T-junctions, then join straight runs through corners."""
    pts = {p for s in segs for p in s}
    adj = defaultdict(set)
    for s in segs:
        chain = [
            s[0],
            *sorted(
                (x for x in pts if on_segment(x, s)), key=lambda x: norm(sub(x, s[0]))
            ),
            s[1],
        ]
        for a, b in itertools.pairwise(chain):
            adj[a].add(b)
            adj[b].add(a)
    merged = True
    while merged:
        merged = False
        for v in list(adj):
            if len(adj[v]) == 2:
                a, b = adj[v]
                if norm(cross(sub(v, a), sub(b, v))) < 1e-6:
                    adj[a] = (adj[a] - {v}) | {b}
                    adj[b] = (adj[b] - {v}) | {a}
                    del adj[v]
                    merged = True
                    break
    return adj


def local_dirs(v, nbrs):
    """Unit directions to the neighbours, with the outward radial on +z."""
    z = unit(v)
    t = sub(sub(nbrs[0], v), mul(z, dot(sub(nbrs[0], v), z)))
    x = unit(t)
    y = cross(z, x)
    return [
        unit((dot(sub(q, v), x), dot(sub(q, v), y), dot(sub(q, v), z))) for q in nbrs
    ]


def fmt(v):
    return "[" + ", ".join(f"{c:.6f}" for c in v) + "]"


def main():
    fs = faces(icosahedron())
    adj = stakes(creases(fs))
    tip_r = max(norm(p) for p in adj)
    radii = sorted({round(norm(p) / tip_r, 5) for p in adj}, reverse=True)
    kinds = {p: radii.index(round(norm(p) / tip_r, 5)) for p in adj}
    edges = {tuple(sorted((p, q))) for p in adj for q in adj[p]}
    lengths = sorted(
        {round(norm(sub(p, q)) / tip_r, 5) for p, q in edges}, reverse=True
    )
    longest = lengths[0]
    names = ["tip", "hub", "corner"]
    assert [Counter(kinds.values())[k] for k in range(3)] == [12, 20, 60]
    assert len(edges) == 270

    pts = sorted(adj, key=lambda p: (kinds[p], p))
    index = {p: i for i, p in enumerate(pts)}
    lines = [
        "// The visible surface of the great icosahedron: 92 corners and 270",
        "// creases. Coordinates put the twelve tips on the unit sphere. Generated",
        "// by platonic/gi.py; edit that, not this.",
        "",
        "// Corner kinds: 0 tip (12), 1 hub (20), 2 corner (60).",
        "gi_kind_r = [" + ", ".join(f"{r:.5f}" for r in radii) + "];",
        "",
        "// Stake lengths centre to centre, as a fraction of the longest, and the",
        "// two corner kinds each one joins.",
        "gi_len = [" + ", ".join(f"{x / longest:.5f}" for x in lengths) + "];",
    ]
    ends = []
    for x in lengths:
        e = next(e for e in edges if round(norm(sub(*e)) / tip_r, 5) == x)
        ends.append(sorted((kinds[e[0]], kinds[e[1]])))
    lines.append(
        "gi_len_ends = ["
        + ", ".join(fmt(e).replace(".000000", "") for e in ends)
        + "];"
    )
    lines.append("// The longest stake centre to centre, in units of the tip radius.")
    lines.append(f"gi_longest = {longest:.6f};")
    lines.append("")
    lines.append("gi_points = [")
    lines += [f"  {fmt(mul(p, 1 / tip_r))}," for p in pts]
    lines.append("];")
    lines.append("")
    lines.append("// [from, to, length index]")
    lines.append("gi_edges = [")
    for p, q in sorted(edges, key=lambda e: (index[e[0]], index[e[1]])):
        i, j = sorted((index[p], index[q]))
        k = lengths.index(round(norm(sub(p, q)) / tip_r, 5))
        lines.append(f"  [{i}, {j}, {k}],")
    lines.append("];")
    lines.append("")
    lines.append(
        "// The twenty big triangles, as indices into the first twelve points."
    )
    tips = {key(mul(v, 1)): None for v in icosahedron()}
    tip_index = {}
    for p in pts[:12]:
        best = min(tips, key=lambda t: norm(sub(unit(t), unit(p))))
        tip_index[best] = index[p]
    lines.append("gi_faces = [")
    for _, _, (i, j, k) in fs:
        vs = icosahedron()
        lines.append(
            "  [" + ", ".join(str(tip_index[key(vs[m])]) for m in (i, j, k)) + "],"
        )
    lines.append("];")
    lines.append("")
    lines.append("// One corner of each kind: the direction and length index of every")
    lines.append("// stake leaving it, with the outward radial on +z.")
    for kind, name in enumerate(names):
        v = next(p for p in pts if kinds[p] == kind)
        nbrs = sorted(adj[v])
        dirs = local_dirs(v, nbrs)
        lines.append(f"gi_{name}_dirs = [")
        for q, d in zip(nbrs, dirs):
            k = lengths.index(round(norm(sub(v, q)) / tip_r, 5))
            lines.append(f"  [{fmt(d)}, {k}],")
        lines.append("];")
    with open(OUT, "w") as f:
        f.write("\n".join(lines) + "\n")
    for name, kind in zip(names, range(3)):
        print(name, Counter(kinds.values())[kind], "at radius", radii[kind])
    for x, e in zip(lengths, ends):
        n = sum(1 for p, q in edges if round(norm(sub(p, q)) / tip_r, 5) == x)
        print(f"stake {x / longest:.5f} x{n} joins {names[e[0]]}-{names[e[1]]}")


if __name__ == "__main__":
    main()
