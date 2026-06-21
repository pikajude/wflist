import { useContext } from "preact/hooks";
import { Category, InventoryState } from ".";
import cx from "../style";
import ListFilters from "./ListFilters";

export default function Nav() {
  return (
    <nav className={cx("navbar", "navbar-expand-lg", "sticky-top", "bg-body-tertiary", "nav", "nav-pills", "mb-4")}>
      <div className={cx("container-fluid")}>
        <Tab label="All" />
        <Tab label="Warframe" />
        <Tab label="Primary" />
        <Tab label="Secondary" />
        <Tab label="Melee" />
        <Tab label="Modular" />
        <ListFilters />
      </div>
    </nav>
  );
}

function Tab(props: { label: Category }) {
  const { category } = useContext(InventoryState);
  const { label } = props;

  return (
    <a className={cx("nav-link", "text-sm-center", { active: category.value == label })} href={`/?category=${label}`}>
      {label}
    </a>
  );
}
