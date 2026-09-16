"""Write the flat pattern of one tree skirt as an SVG, like curved graph paper.

A skirt is a cone frustum. Cut along one seam and flattened, it is a ring
sector: the hoop edge is the inner arc, the hem ring the dotted arc. Every
row of the skirt holds the same number of granny squares, set on point. The
hem row is centred on the hem ring, so the ring runs through the squares'
side corners and the lower halves hang below it as the zigzag hem. Each row
inward is a smaller square. The grid lines are equiangular spirals, so every
cell is a square with right-angle corners and faintly curved sides, and the
cells tile the sector without gaps or overlaps. The top row reaches past the
hoop so it can be attached around it, except on skirt 4, whose top corners
stop short of the post.

The hem square sets the count: the hem ring divided by the square's diagonal.
These numbers are the source; the script writes them to
platonic/tree_params.scad for the model. Run from the repo root:
    python3 design/skirts.py [skirt number, default 5] [hem square mm]

The file is design/tree/skirt-N.svg, or skirt-N-SIZE.svg for a hem square
other than the skirt's default.

    python3 design/skirts.py section

writes design/tree/section.svg instead: half the tree cut through the post,
with every strap, hem and height marked.

    python3 design/skirts.py all

writes every skirt and the section. Every run also writes
platonic/tree_params.scad, which the OpenSCAD model includes, so the model,
the patterns and the section share one set of numbers.
"""

import math
import sys
from pathlib import Path

# Side of the squares on each skirt's hem row, the largest, mm. Smaller
# skirts take smaller squares, roughly in proportion but rounded to sizes
# that are pleasant to crochet.
HEM_SQUARES = [180, 220, 250, 300, 360]
MIN_SQUARE = 80  # mm; below this four squares merge into one, twice the size

# Top to bottom, mm.
HOOP_D = [145, 145, 145, 145, 145]  # every skirt is tied straight to the post
HOOP_Z = [4660, 4390, 3950, 3580, 2910]
HEM_D = [700, 1000, 1400, 1950, 2750]
HEM_Z = [4010, 3380, 2700, 1770, 540]
POST_D = 145  # lamp post diameter, mm
POST_H = 6500  # lamp post height drawn in the section, mm
# A small person standing at the bottom hem, looking up: eye 1.0 m high, 0.3 m
# out from the hem. Above the line of sight that grazes the hem ring above, a
# skirt's fabric is out of view.
EYE_R = HEM_D[-1] / 2 + 300
EYE_Z = 1000
STAR_SPAN = 1400  # star, point to opposite point, mm; ridge struts are 0.357 of this
# Gap between the top strap and the bottom of the star's core, mm. Negative
# means the core reaches down past the strap, so the top skirt's peak stands
# inside the star instead of leaving bare post between them.
STAR_LIFT = -50
STAR_CORE = 0.4195 * STAR_SPAN / 2 + STAR_LIFT  # centre height above the top strap
# Low-stretch cords, straight up the slant from the hem ring to the strap,
# laced through the squares on the way. One cord per CORD_EVERY hem squares,
# so 4 / 5 / 6 / 7 / 8 cords for skirts 1 to 5. Hem counts are even, so the
# cords come out evenly spaced round the ring.
CORD_EVERY = 2
HEM_FIRST = 0.25  # the hem row's first square, in steps from the left seam
CORD_TAIL = 300  # mm of cord at each end for the knots, on top of the drawn length
# How the fabric hangs between two cords, from the cone study in
# platonic/cone.scad. SAG_T is where a panel hangs lowest, 0 at the hem ring
# and 1 at the strap. SAG_DROP is how far that point falls from the cone
# towards the hem ring's own plane, so the fabric never hangs below its ring.
# FIN is how sharply the fabric folds over a cord: 1 a clean fold, less is
# sharper, 2 rounds it into a hill. Only the model uses these; the patterns
# are cut for the plain cone.
SAG_T = 0.25
SAG_DROP = 0.45
FIN = 1

OUT = Path("design/tree")

FONT = 40  # legend, mm
LABEL_FONT = 28  # radius labels, mm
MARGIN = 60  # page margin, mm


def skirt(i):
    r_top = HOOP_D[i] / 2
    r_hem = HEM_D[i] / 2
    drop = HOOP_Z[i] - HEM_Z[i]
    slant = math.hypot(drop, r_hem - r_top)
    r1 = slant * r_top / (r_hem - r_top)  # flat inner radius, at the hoop
    r2 = r1 + slant  # flat radius of the hem ring
    theta = 2 * math.pi * (r_hem - r_top) / slant  # sector angle
    return r1, r2, theta


def rows_for(r1, r2, theta, hem_square, r_merge=None):
    """Rows of squares, hem row first, as dicts with the row's centre radius,
    square side, count, angular step and the offset of its first square.

    In log-polar coordinates (ln r, angle) the diamond grid is an ordinary
    square grid, so the grid lines are two families of equiangular spirals and
    every cell is a square with right-angle corners and very slightly curved
    sides. With n squares a row the cell diagonal is step = theta / n in both
    coordinates. Rows interlock, so each row inward is a factor exp(-step / 2)
    closer to the centre, and a square's side is r * step / sqrt(2).

    When a row's squares would fall under MIN_SQUARE, four squares merge into
    one: the count halves, the step doubles, and the new row's cells stand on
    the tips of the row below, two fine edges to one coarse edge. This can
    repeat while the count stays even. Rows inside r_merge, where nobody can
    see them, merge as soon as they cross it whatever their size.
    """
    n = max(3, int(theta * r2 / (hem_square * math.sqrt(2))))
    step = theta / n
    first = HEM_FIRST  # even rows overhang the left seam by half a step
    rows = []
    r = r2  # hem row centred on the ring
    forced = False
    while r >= r1:
        side = r * step / math.sqrt(2)
        force = r_merge is not None and r < r_merge and not forced
        if (side < MIN_SQUARE or force) and rows:
            forced = forced or force
            if n % 2:
                break
            # Merge: the coarse cells sit on the fine row's side corners, every other one.
            n //= 2
            first = (rows[-1]["first"] + 0.5) / 2
            step *= 2
            r = rows[-1]["r"] * math.exp(
                -step / 2
            )  # bottom tips on the fine row's side corners
            side = r * step / math.sqrt(2)
            if r < r1:
                break
        rows.append({"r": r, "side": side, "n": n, "step": step, "first": first})
        first = (first + 0.5) % 1
        r *= math.exp(-step / 2)
    return rows


def cord_angles(rows):
    """Angles from the left seam of the cords, each straight up the slant from
    the notch between two hem triangles, one per CORD_EVERY hem squares."""
    hem = rows[0]
    return [
        (m * CORD_EVERY + hem["first"] + 0.5) * hem["step"]
        for m in range(hem["n"] // CORD_EVERY)
    ]


def seen_up_to(i):
    """Height on skirt i above which its fabric is out of sight for the viewer
    at the bottom hem, looking up past the hem ring of the skirt above."""
    if i == 0:
        return HOOP_Z[0]
    gr, gz = HEM_D[i - 1] / 2, HEM_Z[i - 1]
    dr, dz = gr - EYE_R, gz - EYE_Z
    xh, zh, xm, zm = HOOP_D[i] / 2, HOOP_Z[i], HEM_D[i] / 2, HEM_Z[i]
    k = (xh - xm) / (zh - zm)
    t = (xm + k * (EYE_Z - zm) - EYE_R) / (dr - k * dz)
    z = EYE_Z + t * dz
    # A line that misses the skirt between hem and strap leaves it all in sight.
    return z if zm <= z <= zh else zh


def polar(r, a):
    return r * math.cos(a), r * math.sin(a)


def arc(r, a0, a1):
    """SVG path for the arc of radius r from angle a0 to a1."""
    x0, y0 = polar(r, a0)
    x1, y1 = polar(r, a1)
    big = 1 if a1 - a0 > math.pi else 0
    return f"M {x0:.1f} {y0:.1f} A {r:.1f} {r:.1f} 0 {big} 1 {x1:.1f} {y1:.1f}"


def cell(u, a, h):
    """Points of one square: corners (u +- h, a) and (u, a +- h) in log-polar,
    each side sampled so its faint curve shows."""
    corners = [(u + h, a), (u, a + h), (u - h, a), (u, a - h)]
    pts = []
    for k in range(4):
        (u0, a0), (u1, a1) = corners[k], corners[(k + 1) % 4]
        for t in range(6):
            uu = u0 + (u1 - u0) * t / 6
            aa = a0 + (a1 - a0) * t / 6
            pts.append(polar(math.exp(uu), aa))
    return pts


def squares_text(rows):
    """'16 a row for 17 rows, then 8 a row for 4 rows, then 4 a row for 1 row'."""
    runs = []
    for row in rows:
        if runs and runs[-1][0] == row["n"]:
            runs[-1][1] += 1
        else:
            runs.append([row["n"], 1])
    return ", then ".join(
        f"{n} a row for {k} row{'s' if k > 1 else ''}" for n, k in runs
    )


def fmt_pts(pts):
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)


def write_svg(i, hem_square):
    r1, r2, theta = skirt(i)
    slant = r2 - r1
    # Flat radius of the line of sight; above it (inside it) squares are not seen.
    zv = seen_up_to(i)
    r_sight = r2 - slant * (zv - HEM_Z[i]) / (HOOP_Z[i] - HEM_Z[i])
    hidden = r_sight > r1 + 1
    rows = rows_for(r1, r2, theta, hem_square, r_sight if hidden else None)
    n, step = rows[0]["n"], rows[0]["step"]
    h = step / 2
    r3 = math.exp(math.log(r2) + h)  # hem squares' lower tips
    a0 = -math.pi / 2 - theta / 2
    a1 = -math.pi / 2 + theta / 2
    left, right = a0 - h / 2, a1 + h / 2  # angular extent of the pattern

    # Every square whole. Even rows overhang the seam lines by half a step on
    # the left, odd rows by a quarter of a step on the right, so the two seams
    # match when wrapped and the pattern sits symmetrically.
    polys = []
    for row in rows:
        u = math.log(row["r"])
        for j in range(row["n"]):
            polys.append(
                cell(u, a0 + (j + row["first"]) * row["step"], row["step"] / 2)
            )

    # Circles: hem tips, hem ring, one per row through the squares' side
    # corners, the top row's top corners, and the hoop.
    corner_r = [row["r"] for row in rows]
    r_tips = rows[-1]["r"] * math.exp(-rows[-1]["step"] / 2)
    circles = [r3, r2, *corner_r[1:], r_tips, r1]

    # Enclosing rectangle of the pattern: squares and the arcs' ends.
    pts = [p for poly in polys for p in poly]
    for r in (r1, r3):
        pts += [polar(r, left), polar(r, right), polar(r, -math.pi / 2)]
    minx, maxx = min(x for x, _ in pts), max(x for x, _ in pts)
    miny, maxy = min(y for _, y in pts), max(y for _, y in pts)
    w, hgt = maxx - minx, maxy - miny

    out = [
        "",
        f"<title>Skirt {i + 1} flat: hoop {HOOP_D[i]} mm, hem {HEM_D[i]} mm</title>",
    ]
    out.append('<g fill="none" stroke="#000" stroke-width="2">')
    out.append(
        f'<rect x="{minx:.1f}" y="{miny:.1f}" width="{w:.1f}" height="{hgt:.1f}" stroke="#888"/>'
    )
    out.append(f'<path d="{arc(r1, left, right)}" stroke="#888"/>')
    out.append(f'<path d="{arc(r3, left, right)}" stroke="#888"/>')
    out.append(
        f'<path d="{arc(r2, left, right)}" stroke="#888" stroke-dasharray="20 20"/>'
    )
    for r in circles[2:-1]:
        out.append(f'<path d="{arc(r, left, right)}" stroke="#ddd" stroke-width="1"/>')
    for a in (a0, a1):  # the seam lines the zigzag edges follow, run to the centre
        x, y = polar(r3, a)
        out.append(
            f'<line x1="0" y1="0" x2="{x:.1f}" y2="{y:.1f}" stroke="#888" stroke-dasharray="20 20"/>'
        )
    out.append('<line x1="-60" y1="0" x2="60" y2="0" stroke="#888"/>')
    out.append('<line x1="0" y1="-60" x2="0" y2="60" stroke="#888"/>')
    out.append('<circle cx="0" cy="0" r="8" fill="#888"/>')
    out.append(
        f'<circle cx="0" cy="0" r="{POST_D / 2:.0f}" fill="#ddd" fill-opacity="0.6" stroke="#888"/>'
    )
    for poly in polys:
        out.append(f'<polygon points="{fmt_pts(poly)}"/>')
    if hidden:
        out.append(
            f'<path d="{arc(r_sight, left, right)}" stroke="#c00" stroke-dasharray="30 20"/>'
        )
    # Cords, straight from the hem ring to the hoop, numbered at the hem.
    cords = cord_angles(rows)
    cord_len = slant
    cord_labels = []
    for k, a in enumerate(cords):
        out.append(
            f'<polyline points="{fmt_pts([polar(r2, a0 + a), polar(r1, a0 + a)])}" stroke="#06c" stroke-width="5"/>'
        )
        cord_labels.append((*polar(r3 + FONT, a0 + a), k + 1))
    # Leaders from each circle's left end straight down to one label row.
    label_y = max(maxy, 0) + MARGIN
    for r in circles:
        x, y = polar(r, left)
        out.append(
            f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{x:.1f}" y2="{label_y:.1f}" stroke="#ccc" stroke-width="1"/>'
        )
    out.append("</g>")

    # Radius labels, all on one row, each under its own circle.
    out.append(f'<g font-family="sans-serif" font-size="{LABEL_FONT}">')
    for r in circles:
        x, _ = polar(r, left)
        out.append(
            f'<text transform="translate({x + LABEL_FONT * 0.35:.0f} {label_y + 10:.0f}) rotate(90)">{r / 10:.1f}</text>'
        )
    out.append(
        f'<text x="0" y="{label_y + 10:.0f}" text-anchor="middle" font-size="{FONT}">centre, post {POST_D / 10:.1f} cm in section</text>'
    )
    out.append(
        f'<text x="0" y="{-r2 - 15:.0f}" text-anchor="middle" font-size="{FONT}">hem ring diameter {HEM_D[i] / 10:.0f} cm</text>'
    )
    out.append(
        f'<text x="0" y="{-r1 + FONT * 1.2:.0f}" text-anchor="middle" font-size="{FONT}">tied to the post, {HOOP_D[i] / 10:.1f} cm</text>'
    )
    for x, y, k in cord_labels:
        out.append(
            f'<text x="{x:.0f}" y="{y + LABEL_FONT * 0.35:.0f}" text-anchor="middle" fill="#06c">{k}</text>'
        )
    out.append("</g>")

    # Legend as a two-column table below the labels.
    sides = [row["side"] for row in rows]  # hem first, like the row radii
    total = sum(row["n"] for row in rows)
    table = [
        ("tied to the post", f"{HOOP_D[i] / 10:.1f} cm across"),
        ("hem ring diameter", f"{HEM_D[i] / 10:.0f} cm"),
        ("squares", squares_text(rows) + f", {total} squares"),
        ("square sides, hem to hoop (cm)", sides),
        ("row circle radii, hem to hoop (cm)", corner_r),
        (
            "flat radii from the cone tip",
            f"outer {r3 / 10:.1f}, dotted hem ring {r2 / 10:.1f}, inner hoop {r1 / 10:.1f}, top corners {r_tips / 10:.1f} cm",
        ),
        ("enclosing rectangle", f"{w / 10:.1f} wide, {hgt / 10:.1f} high cm"),
        (
            "cords, blue",
            (
                f"{len(cords)} of 3 mm polyester braid, straight up the slant, "
                f"one per {CORD_EVERY} hem squares, "
                f"each {cord_len / 10:.0f} cm hem ring to strap plus {CORD_TAIL / 10:.0f} cm tails, "
                f"{(len(cords) * (cord_len + 2 * CORD_TAIL)) / 1000:.1f} m all up"
            ),
        ),
        (
            "cords, path",
            "from the notch between two hem triangles, through the corner between two squares on every second row, up the middle of the square on the rows between",
        ),
    ]
    gap = (r_tips - r1) / 10
    reach = (
        "top corners reach the post"
        if gap <= 0
        else f"top corners {gap:.0f} cm short of the post"
    )
    table.insert(
        3,
        (
            "top row",
            reach
            + ", tie the corners to the post"
            + (", loosely, out of sight" if hidden else ""),
        ),
    )
    if hidden:
        table.insert(
            3,
            (
                "out of sight",
                f"above {zv / 1000:.2f} m up the skirt, red dashed arc at flat radius {r_sight / 10:.1f} cm; squares there can hang loosely",
            ),
        )
    x0 = minx
    x1 = minx + 22 * FONT
    row_h = FONT * 1.5
    y = label_y + 5 * LABEL_FONT + FONT
    out.append(f'<g font-family="sans-serif" font-size="{FONT}" text-anchor="start">')
    out.append(
        f'<text x="{x0:.0f}" y="{y:.0f}" font-weight="bold" font-size="{FONT * 1.3:.0f}">Skirt {i + 1}</text>'
    )
    y += row_h * 0.6
    for label, value in table:
        y += row_h
        rule_y = y - row_h + FONT * 0.4
        out.append(
            f'<line x1="{x0:.0f}" y1="{rule_y:.0f}" x2="{x1 + 60 * FONT:.0f}" y2="{rule_y:.0f}" stroke="#ccc" stroke-width="1"/>'
        )
        out.append(f'<text x="{x0:.0f}" y="{y:.0f}">{label}</text>')
        if isinstance(value, list):
            # One right-aligned column per row of squares, so the two lists
            # line up on the decimal point.
            for k, v in enumerate(value):
                out.append(
                    f'<text x="{x1 + 2.8 * FONT + k * 3.6 * FONT:.0f}" y="{y:.0f}" text-anchor="end">{v / 10:.1f}</text>'
                )
        else:
            out.append(f'<text x="{x1:.0f}" y="{y:.0f}">{value}</text>')
    out.append("</g>")
    out.append("</svg>")

    vb_h = y + 2 * MARGIN - (miny - MARGIN)  # pattern, labels and legend
    # Wide enough for the pattern and for the longest legend line.
    longest = max(
        len(v) * 0.5 * FONT if isinstance(v, str) else (len(v) + 1) * 3.6 * FONT
        for _, v in table
    )
    vb_w = max(w, x1 - minx + longest) + 2 * MARGIN
    out[0] = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{minx - MARGIN:.0f} {miny - MARGIN:.0f} {vb_w:.0f} {vb_h:.0f}" '
        f'width="{vb_w / 10:.0f}mm" height="{vb_h / 10:.0f}mm">'
    )
    suffix = "" if hem_square == HEM_SQUARES[i] else f"-{hem_square:.0f}"
    (OUT / f"skirt-{i + 1}{suffix}.svg").write_text("\n".join(out) + "\n")
    cord_text = f"{len(cords)} cords of {cord_len / 10:.0f} cm plus tails"
    return n, rows, r1, r2, r3, r_tips, w, hgt, corner_r, total, cord_text


def write_section():
    """Half the tree cut through the post: post on the left, skirts to the right."""
    top = POST_H
    x_post = POST_D / 2
    x_max = HEM_D[-1] / 2 + 900
    out = [
        "",
        "<title>Tree section through the post</title>",
        '<g fill="none" stroke="#000" stroke-width="2">',
        f'<rect x="0" y="{-top:.0f}" width="{x_post:.0f}" height="{top:.0f}" fill="#ddd" stroke="#888"/>',
        f'<line x1="0" y1="0" x2="{x_max:.0f}" y2="0" stroke="#888"/>',
    ]
    labels = []
    for i in range(len(HOOP_D)):
        xh, zh = HOOP_D[i] / 2, HOOP_Z[i]
        xm, zm = HEM_D[i] / 2, HEM_Z[i]
        # Where the fabric passes out of sight for the viewer at the bottom hem.
        zv = seen_up_to(i)
        xv = xm + (zv - zm) * (xh - xm) / (zh - zm)
        out.append(f'<line x1="{xv:.0f}" y1="{-zv:.0f}" x2="{xm:.0f}" y2="{-zm:.0f}"/>')
        if zv < zh - 1:
            out.append(
                f'<line x1="{xh:.0f}" y1="{-zh:.0f}" x2="{xv:.0f}" y2="{-zv:.0f}" stroke="#888" stroke-dasharray="15 15"/>'
            )
            sight = f"out of sight above {zv / 1000:.2f} m"
        else:
            sight = "in sight all the way up"
        out.append(
            f'<line x1="{xv - 25:.0f}" y1="{-zv - 25:.0f}" x2="{xv + 25:.0f}" y2="{-zv + 25:.0f}" stroke="#c00"/>'
        )
        out.append(
            f'<line x1="{xv - 25:.0f}" y1="{-zv + 25:.0f}" x2="{xv + 25:.0f}" y2="{-zv - 25:.0f}" stroke="#c00"/>'
        )
        labels.append((xv + 40, -zv + FONT * 1.3, sight, "start", "#c00"))
        # The hem row's lower halves hanging below the ring.
        n = int(math.pi * HEM_D[i] / (HEM_SQUARES[i] * math.sqrt(2)))
        drop = math.pi * HEM_D[i] / n / 2
        out.append(
            f'<line x1="{xm:.0f}" y1="{-zm:.0f}" x2="{xm:.0f}" y2="{-zm + drop:.0f}"/>'
        )
        # Strap collar on the post where this skirt's hoop, or the skirt itself, attaches.
        out.append(
            f'<rect x="0" y="{-zh - 25:.0f}" width="{x_post:.0f}" height="50" fill="#000"/>'
        )
        on_post = xh <= x_post
        what = (
            f"skirt {i + 1} tied straight to the post"
            if on_post
            else f"collar, spokes to the {HOOP_D[i] / 10:.0f} cm hoop"
        )
        labels.append(
            (-30, -zh + FONT * 0.35, f"strap at {zh / 1000:.2f} m: {what}", "end")
        )
        if not on_post:
            out.append(f'<circle cx="{xh:.0f}" cy="{-zh:.0f}" r="10" fill="#000"/>')
            out.append(
                f'<line x1="{x_post:.0f}" y1="{-zh:.0f}" x2="{xh:.0f}" y2="{-zh:.0f}" stroke="#888" stroke-dasharray="15 15"/>'
            )
            labels.append(
                (
                    xh + 30,
                    -zh - 10,
                    f"hoop {HOOP_D[i] / 10:.0f} cm at {zh / 1000:.2f} m",
                )
            )
        out.append(f'<circle cx="{xm:.0f}" cy="{-zm:.0f}" r="10" fill="#000"/>')
        labels.append(
            (
                xm + 30,
                -zm - 10,
                f"hem {HEM_D[i] / 10:.0f} cm at {zm / 1000:.2f} m, drop {drop / 10:.0f} cm",
            )
        )
    # Star: core on the top strap, outline as circles.
    zc = HOOP_Z[0] + STAR_CORE
    out.append(
        f'<rect x="0" y="{-HOOP_Z[0] - 25:.0f}" width="{x_post:.0f}" height="50" fill="#000"/>'
    )
    labels.append(
        (
            -30,
            -HOOP_Z[0] - FONT * 1.2,
            f"strap at {HOOP_Z[0] / 1000:.2f} m: star hangs {STAR_LIFT / 10:.0f} cm above it",
            "end",
        )
    )
    out.append(f'<circle cx="0" cy="{-zc:.0f}" r="{STAR_CORE:.0f}" stroke="#c9a400"/>')
    out.append(
        f'<circle cx="0" cy="{-zc:.0f}" r="{STAR_SPAN / 2:.0f}" stroke="#c9a400" stroke-dasharray="15 15"/>'
    )
    labels.append(
        (
            STAR_SPAN / 2 + 30,
            -zc,
            f"star {STAR_SPAN / 10:.0f} cm across, centre at {zc / 1000:.2f} m",
        )
    )
    labels.append((x_post + 30, -top + FONT, f"post {POST_D / 10:.1f} cm"))
    labels.append(
        (
            x_post + 30,
            -top + FONT * 2.4,
            f"dashed fabric is out of sight from {EYE_Z / 1000:.1f} m eye height at the bottom hem",
            "start",
            "#c00",
        )
    )
    out.append("</g>")
    out.append(f'<g font-family="sans-serif" font-size="{FONT}">')
    for x, y, text, *anchor in labels:
        out.append(
            f'<text x="{x:.0f}" y="{y:.0f}" text-anchor="{anchor[0] if anchor else "start"}">{text}</text>'
        )
    out.append("</g>")
    out.append("</svg>")
    left = 1500  # room for the strap labels left of the post
    w = x_max + left + MARGIN
    h = top + 2 * MARGIN
    out[0] = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-left} {-top - MARGIN:.0f} {w:.0f} {h:.0f}" '
        f'width="{w / 10:.0f}mm" height="{h / 10:.0f}mm">'
    )
    (OUT / "section.svg").write_text("\n".join(out) + "\n")


def write_params():
    """Write platonic/tree_params.scad so the model shares these numbers."""
    counts, cord_phase = [], []
    for i in range(len(HOOP_D)):
        r1, r2, theta = skirt(i)
        zv = seen_up_to(i)
        r_sight = r2 - (r2 - r1) * (zv - HEM_Z[i]) / (HOOP_Z[i] - HEM_Z[i])
        rows = rows_for(
            r1, r2, theta, HEM_SQUARES[i], r_sight if r_sight > r1 + 1 else None
        )
        counts.append(sum(row["n"] for row in rows))
        # Where each cord sits round the skirt, in degrees from the seam.
        cord_phase.append([round(a / theta * 360, 1) for a in cord_angles(rows)])
    lines = [
        "// Written by design/skirts.py. Edit the numbers there, not here.",
        f"pole_h  = {HOOP_Z[0]};",
        f"post_d  = {POST_D};",
        f"squares = {HEM_SQUARES};",
        f"hoop_d  = {HOOP_D};",
        f"hoop_z  = {HOOP_Z};",
        f"hem_d   = {HEM_D};",
        f"hem_z   = {HEM_Z};",
        f"tier_squares = {counts};",
        f"star_span = {STAR_SPAN};",
        f"star_lift = {STAR_LIFT};",
        f"hem_first = {HEM_FIRST};",
        f"cord_phase = {cord_phase};",
        f"sag_t = {SAG_T};",
        f"sag_drop = {SAG_DROP};",
        f"fin = {FIN};",
    ]
    Path("platonic/tree_params.scad").write_text("\n".join(lines) + "\n")
    return counts


def main():
    OUT.mkdir(exist_ok=True)
    write_params()
    if len(sys.argv) > 1 and sys.argv[1] == "all":
        total = 0
        for i in range(len(HOOP_D)):
            n, rows, *_, cord_text = write_svg(i, HEM_SQUARES[i])
            count = sum(row["n"] for row in rows)
            total += count
            print(f"skirt {i + 1}: {squares_text(rows)}, {count} squares")
            print(f"  {cord_text}")
        write_section()
        print(
            f"total {total} squares; wrote skirt-1..5.svg, section.svg, tree_params.scad"
        )
        return
    if len(sys.argv) > 1 and sys.argv[1] == "section":
        write_section()
        print("wrote design/tree/section.svg")
        return
    i = int(sys.argv[1]) - 1 if len(sys.argv) > 1 else 4
    hem_square = float(sys.argv[2]) if len(sys.argv) > 2 else HEM_SQUARES[i]
    n, rows, r1, r2, r3, r_tips, w, h, corner_r, total, cord_text = write_svg(
        i, hem_square
    )
    sides = [row["side"] for row in rows]
    print(
        f"skirt {i + 1}: top hoop diameter {HOOP_D[i] / 10:.0f} cm, hem ring diameter {HEM_D[i] / 10:.0f} cm"
    )
    print(f"{n} squares a row at the hem, {len(rows)} rows, {total} squares")
    gap = (r_tips - r1) / 10
    print(
        "top corners reach the post"
        if gap <= 0
        else f"top corners {gap:.0f} cm short of the post"
    )
    print("square sides, hem to hoop (cm):", " ".join(f"{x / 10:.1f}" for x in sides))
    print(
        f"flat radii (cm): outer {r3 / 10:.1f}, dotted hem ring {r2 / 10:.1f}, inner hoop {r1 / 10:.1f}, top corners {r_tips / 10:.1f}"
    )
    print(
        "row circle radii, hem to hoop (cm):",
        " ".join(f"{r / 10:.1f}" for r in corner_r),
    )
    print(f"enclosing rectangle (cm): {w / 10:.1f} wide, {h / 10:.1f} high")
    print(cord_text)


if __name__ == "__main__":
    main()
