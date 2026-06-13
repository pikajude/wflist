import cx from "../style";
import FilterOptions from "./FilterOptions";
import Tab from "./Tab";

export default function BrowserNav() {
  return (
    <nav className={cx("navbar", "navbar-expand-lg", "sticky-top", "bg-body-tertiary", "nav", "nav-pills", "mb-4")}>
      <div className={cx("container-fluid")}>
        <Tab label="All" />
        <Tab label="Warframe" />
        <Tab label="Primary" />
        <Tab label="Secondary" />
        <Tab label="Melee" />
        <FilterOptions />
      </div>
    </nav>
  );
}
