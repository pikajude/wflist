import { useLocation } from "preact-iso";
import cx from "../style";

export function Header() {
  const { url } = useLocation();

  return (
    <nav className={cx("navbar", "bg-body-tertiary", "navbar-expand-lg")}>
      <div className={cx("container-fluid")}>
        <ul className={cx("navbar-nav", "me-auto")}>
          <li className={cx("nav-item")}>
            <a className={cx("nav-link", { active: url == "/" })} href="/">
              Home
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
