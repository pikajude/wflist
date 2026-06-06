import { curveBumpX, hierarchy, HierarchyLink, HierarchyNode, link, tree } from "d3";
import { useContext } from "preact/hooks";
import { AppState } from "../data";
import { CraftItem, CraftList } from "../data/craftList";

export default function IngredientTree(props: { list: CraftList }) {
  const { manifest } = useContext(AppState);
  const data = hierarchy(props.list.items[0], (i) => i.recipe.requires);

  const padding = 1;
  const width = 1152;
  const dx = 50;
  const dy = width / (data.height + padding);

  tree<CraftItem>().nodeSize([dx, dy])(data);

  var x0 = Infinity;
  var x1 = -x0;
  data.each((d) => {
    if (d.x == null) return;
    if (d.x > x1) x1 = d.x;
    if (d.x < x0) x0 = d.x;
  });

  const height = x1 - x0 + dx * 2;

  const links = data.links();
  const desc = data.descendants();

  return (
    <svg
      viewBox={`${(-dy * padding) / 2},${x0 - dx},${width},${height}`}
      width={width}
      height={height}
      style={{ maxWidth: "100%", height: "auto" }}
    >
      <g fill="none" stroke="#ccc" strokeWidth={1.5} strokeOpacity={0.4}>
        {links.map((l, i) => (
          <path
            key={i}
            d={
              link<HierarchyLink<CraftItem>, HierarchyNode<CraftItem>>(curveBumpX)
                .x((d) => d.y ?? 0)
                .y((d) => d.x ?? 0)(l) || undefined
            }
          ></path>
        ))}
      </g>
      <g>
        {desc.map((d, i) => {
          const extra = { transform: `translate(${d.y},${d.x})` };
          return (
            <a key={i} style={{ textDecoration: "none" }} {...extra}>
              <image href={manifest.image_url(d.data.recipe.uniqueName)} width={32} x={d.children ? -36 : 4} y={-16} />
              <text
                dy="0.32em"
                paint-order="stroke"
                stroke-width={6}
                x={d.children ? -38 : 38}
                text-anchor={d.children ? "end" : "start"}
                fill="#eee"
                fontSize="1.2rem"
              >
                {d.data.name} x{d.data.quantity}
              </text>
            </a>
          );
        })}
      </g>
    </svg>
  );
}
