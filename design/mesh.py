"""Sketch the mesh tube that carries the skirts' weight to the ground.

Strips of 50 x 50 mm galvanised welded mesh are wrapped tight round the lamp
post as a sleeve, one storey on top of the next with a cell of lap, and stood
on the ground. Pool noodle battens run up the post under it so the mesh never
touches the paint. The skirts and the star tie to the mesh instead of to the bare
post, so the weight goes down the sleeve to the ground rather than up the
ropes.

Writes design/tree/mesh.svg with three views: the flat strip, the sleeve from
above, and the sleeve from the side against the tree. Run from the repo
root:
    python3 design/mesh.py
"""

import math
import sys
from pathlib import Path

import skirts

# Sleeve inside diameter, mm. The 15 mm all round is what the pool noodle
# battens compress into: a noodle wall is about 20 mm, so each batten squashes
# by a quarter and the sleeve grips instead of rattling. At this diameter the
# wrapped circumference is 55 cm, so the strip comes out at exactly 60 cm.
TUBE_D = skirts.POST_D + 30
CELL = 50  # mm, mesh pitch
OVERLAP = 50  # mm, one cell of lap where the strip's ends meet
TIER_H = 3 * 1800 - 2 * 50  # mm, three full storeys lapped by a cell
TIER_H_B = 4000  # mm, plan B: enough to carry the star at its lower height
STOREY = 1800  # mm, the longest piece the mesh comes in; the sleeve stacks these
JOIN = 50  # mm, one cell of lap between storeys
# Hose clamps over the mesh, mm above ground, one near each join.
CLAMPS = [200, 1700, 3450, 5200]
CLAMPS_B = [200, 1700, 2900, 3900]

FONT = 40
OUT = Path("design/tree")


def main():
    plan_b = len(sys.argv) > 1 and sys.argv[1] == "b"
    if plan_b:
        skirts.plan_b()
    tier_h = TIER_H_B if plan_b else TIER_H
    clamps = CLAMPS_B if plan_b else CLAMPS
    suffix = "-b" if plan_b else ""
    straps = [(z, i + 1) for i, z in enumerate(skirts.HOOP_Z)]
    circ = math.pi * TUBE_D
    width = math.ceil((circ + OVERLAP) / CELL) * CELL  # cut on a wire
    # Storeys: full pieces plus one short one, each lapping the next by a cell.
    storeys = []
    left = tier_h
    while left > 0:
        piece = min(STOREY, left + (JOIN if storeys else 0))
        storeys.append(piece)
        left -= piece - (JOIN if len(storeys) > 1 else 0)
    joins = []
    z = 0
    for piece in storeys[:-1]:
        z += piece - JOIN
        joins.append(z)
    cells_w, cells_h = width // CELL, tier_h // CELL
    out = []
    g = f'<g fill="none" stroke="#000" stroke-width="2" font-family="sans-serif" font-size="{FONT}">'

    # 1. Flat sheet for one tier, at the left.
    x0, y0 = 0, 0
    out.append(g)
    out.append(f'<rect x="{x0}" y="{y0}" width="{width}" height="{tier_h}"/>')
    for k in range(1, cells_w):
        out.append(
            f'<line x1="{x0 + k * CELL}" y1="{y0}" x2="{x0 + k * CELL}" y2="{y0 + tier_h}" stroke="#bbb" stroke-width="1"/>'
        )
    for k in range(1, cells_h):
        out.append(
            f'<line x1="{x0}" y1="{y0 + k * CELL}" x2="{x0 + width}" y2="{y0 + k * CELL}" stroke="#bbb" stroke-width="1"/>'
        )
    out.append(
        f'<rect x="{x0 + width - OVERLAP}" y="{y0}" width="{OVERLAP}" height="{tier_h}" fill="#ddd" fill-opacity="0.6" stroke="none"/>'
    )
    out.append(
        f'<text x="{x0}" y="{y0 - FONT}">the strip, flat: {width / 10:.0f} cm wide x {tier_h / 10:.0f} cm long, {cells_w} x {cells_h} cells, cut along the roll on the wires</text>'
    )
    for z in joins:
        yj = y0 + tier_h - z
        out.append(
            f'<line x1="{x0 - 40}" y1="{yj:.0f}" x2="{x0 + width + 40}" y2="{yj:.0f}" stroke="#c00" stroke-width="3"/>'
        )
        out.append(
            f'<rect x="{x0}" y="{yj - JOIN:.0f}" width="{width}" height="{JOIN}" fill="#f6c6c6" fill-opacity="0.7" stroke="none"/>'
        )
    out.append(
        f'<text x="{x0}" y="{y0 + tier_h + FONT * 1.2}">shaded {OVERLAP / 10:.0f} cm laps under the other edge, cable tie every 3rd cell</text>'
    )
    out.append(
        f'<text x="{x0}" y="{y0 + tier_h + FONT * 2.6}">{len(storeys)} storeys: '
        + " + ".join(f"{p / 10:.0f}" for p in storeys)
        + " cm, red lines are the joins, one cell of lap each</text>"
    )

    # 2. Plan view: tube round the post.
    cx, cy = x0 + width + 900, y0 + 600
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{skirts.POST_D / 2}" fill="#ddd"/>')
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{TUBE_D / 2}"/>')
    for k in range(int(circ // CELL)):
        a = 2 * math.pi * k / int(circ // CELL)
        out.append(
            f'<circle cx="{cx + TUBE_D / 2 * math.cos(a):.0f}" cy="{cy + TUBE_D / 2 * math.sin(a):.0f}" r="3" fill="#000"/>'
        )
    lap = OVERLAP / (TUBE_D / 2)
    out.append(
        f'<path d="M {cx + TUBE_D / 2 + 12:.0f} {cy:.0f} A {TUBE_D / 2 + 12} {TUBE_D / 2 + 12} 0 0 1 {cx + (TUBE_D / 2 + 12) * math.cos(lap):.0f} {cy + (TUBE_D / 2 + 12) * math.sin(lap):.0f}" stroke="#888" stroke-width="6"/>'
    )
    out.append(
        f'<text x="{cx}" y="{cy - TUBE_D / 2 - FONT}" text-anchor="middle">from above: sleeve {TUBE_D / 10:.0f} cm across on the {skirts.POST_D / 10:.1f} cm post</text>'
    )
    out.append(
        f'<text x="{cx}" y="{cy + TUBE_D / 2 + FONT * 1.5}" text-anchor="middle">grey band is the lap</text>'
    )

    # 3. Side view: tube against the tree's straps.
    sx = cx + TUBE_D / 2 + 1400
    ground = y0 + tier_h  # page y of the ground line in this view
    scale = 1.0

    def sy(z):
        return ground - z * scale

    out.append(
        f'<rect x="{sx - skirts.POST_D / 2 * scale:.0f}" y="{sy(skirts.POST_H):.0f}" width="{skirts.POST_D * scale:.0f}" height="{skirts.POST_H * scale:.0f}" fill="#ddd" stroke="#888"/>'
    )
    out.append(
        f'<rect x="{sx - TUBE_D / 2 * scale:.0f}" y="{sy(tier_h):.0f}" width="{TUBE_D * scale:.0f}" height="{tier_h * scale:.0f}"/>'
    )
    for z in joins:
        out.append(
            f'<line x1="{sx - TUBE_D / 2 * scale - 8:.0f}" y1="{sy(z):.0f}" x2="{sx + TUBE_D / 2 * scale + 8:.0f}" y2="{sy(z):.0f}" stroke="#c00" stroke-width="3"/>'
        )
        out.append(
            f'<text x="{sx - TUBE_D / 2 * scale - 40:.0f}" y="{sy(z) + FONT * 0.35:.0f}" text-anchor="end" fill="#c00">storey join at {z / 1000:.2f} m</text>'
        )
    for z in clamps:
        out.append(
            f'<rect x="{sx - TUBE_D / 2 * scale - 8:.0f}" y="{sy(z) - 15:.0f}" width="{TUBE_D * scale + 16:.0f}" height="30" fill="#444"/>'
        )
        out.append(
            f'<text x="{sx - TUBE_D / 2 * scale - 40:.0f}" y="{sy(z) + FONT * 0.35:.0f}" text-anchor="end">hose clamp at {z / 1000:.1f} m</text>'
        )
    out.append(
        f'<line x1="{sx - 900:.0f}" y1="{ground}" x2="{sx + 900:.0f}" y2="{ground}" stroke="#888"/>'
    )
    # The star's core sits round the sleeve above the top strap and ties to the mesh.
    core = 0.4195 * skirts.STAR_SPAN / 2
    z0, z1 = (
        skirts.HOOP_Z[0] + skirts.STAR_LIFT,
        skirts.HOOP_Z[0] + skirts.STAR_LIFT + 2 * core,
    )
    out.append(
        f'<rect x="{sx - TUBE_D / 2 * scale - 20:.0f}" y="{sy(z1):.0f}" width="{TUBE_D * scale + 40:.0f}" height="{(z1 - z0) * scale:.0f}" fill="#f9d933" fill-opacity="0.5" stroke="none"/>'
    )
    out.append(
        f'<text x="{sx + TUBE_D / 2 * scale + 40:.0f}" y="{sy((z0 + z1) / 2) + FONT * 0.35:.0f}">star core round the sleeve, {z0 / 1000:.2f} to {z1 / 1000:.2f} m, cable tied to the mesh</text>'
    )
    for z, skirt in straps:
        out.append(
            f'<line x1="{sx - TUBE_D / 2 * scale:.0f}" y1="{sy(z):.0f}" x2="{sx + TUBE_D / 2 * scale:.0f}" y2="{sy(z):.0f}" stroke="#c00" stroke-width="4"/>'
        )
        out.append(
            f'<text x="{sx + TUBE_D / 2 * scale + 40:.0f}" y="{sy(z) + FONT * 0.35:.0f}" fill="#c00">skirt {skirt} ties to the mesh at {z / 1000:.2f} m</text>'
        )
        out.append(
            f'<text x="{sx + TUBE_D / 2 * scale + 30:.0f}" y="{sy(z) + FONT * 0.35:.0f}">skirt {skirt} strap on the post at {z / 1000:.2f} m</text>'
        )
    out.append(
        f'<text x="{sx:.0f}" y="{sy(skirts.POST_H) - FONT:.0f}" text-anchor="middle">from the side: sleeve to {tier_h / 1000:.2f} m in {len(storeys)} storeys, standing on the ground, post to {skirts.POST_H / 1000:.1f} m</text>'
    )
    out.append("</g>")
    out.append("</svg>")

    w = sx + 1600
    top = min(-FONT * 3, sy(skirts.POST_H) - FONT * 2)
    h = ground + 200 - top
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 {top:.0f} {w + 200:.0f} {h:.0f}" '
        f'width="{(w + 200) / 10:.0f}mm" height="{h / 10:.0f}mm">\n<title>Mesh sleeve round the post</title>\n'
    )
    (OUT / f"mesh{suffix}.svg").write_text(svg + "\n".join(out) + "\n")
    print(
        f"sleeve {TUBE_D / 10:.0f} cm across, {width / 10:.0f} cm wide strip, {cells_w} cells round, {tier_h / 10:.0f} cm tall"
    )
    print(
        f"storeys: {' + '.join(f'{p / 10:.0f}' for p in storeys)} cm, joins at {', '.join(f'{z / 1000:.2f}' for z in joins)} m"
    )
    print(
        f"mesh to buy: {sum(storeys) / 1000:.1f} m of {width / 10:.0f} cm wide strip, in pieces up to {STOREY / 1000:.1f} m"
    )


if __name__ == "__main__":
    main()
