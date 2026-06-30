import { useContext } from "preact/hooks";
import { InventoryState } from ".";
import cx from "../style";
import ListFilters from "./ListFilters";
import { Categories, typedKeys } from "./category";

export default function Nav() {
  const { category } = useContext(InventoryState);

  return (
    <nav className={cx("navbar", "navbar-expand-lg", "sticky-top", "bg-body-tertiary", "nav", "nav-pills", "mb-4")}>
      <div className={cx("container-fluid")}>
        {typedKeys(Categories).map((c) => (
          <a
            key={c}
            className={cx("nav-link", "text-sm-center", { active: category.value == c })}
            href={`/?category=${c}`}
          >
            {c}
          </a>
        ))}
        <ListFilters />
      </div>
    </nav>
  );
}
