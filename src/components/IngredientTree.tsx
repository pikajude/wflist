import { curveBumpX, hierarchy, HierarchyLink, HierarchyNode, link, tree } from "d3";
import { Set } from "immutable";
import { AnchorHTMLAttributes } from "preact";
import { useLocation } from "preact-iso";
import { useContext } from "preact/hooks";
import { CraftList } from "../data/craftList";
import { AppState } from "../data/state";
import cx from "../style";
import { humanName } from "../util";

type Datum = string;

export default function IngredientTree(props: { list: CraftList; showImages?: boolean }) {
  const { manifest } = useContext(AppState);
  const showImages = props.showImages ?? true;
  const { route } = useLocation();

  const tree2: Record<string, string[]> = {};

  const edges = Set(props.list.edges.map((e) => `${e[0]}!${e[1]}`))
    .toArray()
    .map((e) => e.split("!", 2));

  for (const [from, to] of edges) {
    if (tree2[from] == null) tree2[from] = [];
    tree2[from].push(to);
  }

  // TODO: can we make this work with a crafting list that has multiple roots? probably not
  const itemTree = hierarchy<string>(props.list.edges[0][1], (k) => tree2[k]);

  const padding = 1.3;
  const width = 1000;
  const dx = 40;
  const dy = width / (itemTree.height + padding);

  tree<string>().nodeSize([dx, dy])(itemTree);

  let x0 = Infinity;
  let x1 = -x0;
  itemTree.each((d) => {
    if (d.x == null) return;
    if (d.x > x1) x1 = d.x;
    if (d.x < x0) x0 = d.x;
  });

  const height = x1 - x0 + dx * 2;

  const links = itemTree.links();
  const desc = itemTree.descendants();
  const linkF = link<HierarchyLink<Datum>, HierarchyNode<Datum>>(curveBumpX)
    .x((d) => d.y ?? 0)
    .y((d) => d.x ?? 0);

  return (
    <div className={cx("justify-content-center", "d-flex")}>
      <svg
        viewBox={`${(-dy * padding) / 2},${x0 - dx},${width},${height}`}
        width={width}
        height={height}
        style={{ maxWidth: "100%", height: "auto" }}
      >
        <g fill="none" stroke="#ccc" strokeWidth={1.5} strokeOpacity={0.6}>
          {links.map((l, i) => (
            <path key={i} d={linkF(l) || undefined} />
          ))}
        </g>
        <g>
          {desc.map((d, i) => {
            const name = humanName(d.data, manifest);

            const href: AnchorHTMLAttributes = manifest.isCrafted(d.data)
              ? {
                  href: `/item/${name}`,
                  onClick: (e) => {
                    e.preventDefault();
                    route(`/item/${name}`);
                  },
                }
              : {};

            return (
              <a key={i} {...href} {...{ transform: `translate(${d.y},${d.x})` }}>
                <circle fill="#ccc" r="3" />
                {showImages && <image href={manifest.imageUrl(d.data)} width={32} x={d.children ? -36 : 4} y={-16} />}
                <text
                  dy="0.32em"
                  paint-order="stroke"
                  stroke-width={6}
                  x={(showImages ? 38 : 6) * (d.children ? -1 : 1)}
                  text-anchor={d.children ? "end" : "start"}
                  fill="#eee"
                  fontSize="1.2rem"
                >
                  {name.replace("<ARCHWING> ", "[A] ")}
                </text>
              </a>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
