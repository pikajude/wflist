import { CraftList } from "../data/craftList";

export default function IngredientTree(props: { list: CraftList }) {
  return <></>;

  // const { manifest } = useContext(AppState);
  // const itemTree = hierarchy(props.list.items[0], (i) => i.recipe.requires);

  // const padding = 1.3;
  // const width = 1000;
  // const dx = 40;
  // const dy = width / (itemTree.height + padding);

  // tree<CraftItem>().nodeSize([dx, dy])(itemTree);

  // var x0 = Infinity;
  // var x1 = -x0;
  // itemTree.each((d) => {
  //   if (d.x == null) return;
  //   if (d.x > x1) x1 = d.x;
  //   if (d.x < x0) x0 = d.x;
  // });

  // const height = x1 - x0 + dx * 2;

  // const links = itemTree.links();
  // const desc = itemTree.descendants();
  // const linkF = link<HierarchyLink<CraftItem>, HierarchyNode<CraftItem>>(curveBumpX)
  //   .x((d) => d.y ?? 0)
  //   .y((d) => d.x ?? 0);

  // return (
  //   <div className={cx("justify-content-center", "d-flex")}>
  //     <svg
  //       viewBox={`${(-dy * padding) / 2},${x0 - dx},${width},${height}`}
  //       width={width}
  //       height={height}
  //       style={{ maxWidth: "100%", height: "auto" }}
  //     >
  //       <g fill="none" stroke="#ccc" strokeWidth={1.5} strokeOpacity={0.6}>
  //         {links.map((l, i) => (
  //           <path key={i} d={linkF(l) || undefined}></path>
  //         ))}
  //       </g>
  //       <g>
  //         {desc.map((d, i) => (
  //           <a key={i} style={{ textDecoration: "none" }} {...{ transform: `translate(${d.y},${d.x})` }}>
  //             <image href={manifest.imageUrl(d.data.recipe.uniqueName)} width={32} x={d.children ? -36 : 4} y={-16} />
  //             <text
  //               dy="0.32em"
  //               paint-order="stroke"
  //               stroke-width={6}
  //               x={d.children ? -38 : 38}
  //               text-anchor={d.children ? "end" : "start"}
  //               fill="#eee"
  //               fontSize="1.2rem"
  //             >
  //               {d.data.name}
  //             </text>
  //           </a>
  //         ))}
  //       </g>
  //     </svg>
  //   </div>
  // );
}
