import { useContext } from "preact/hooks";
import BrowserContext, { SelectedCategory } from "../../pages/itemBrowser/BrowserContext";
import cx from "../../style";

export default function Tab(props: { label: SelectedCategory }) {
  const { category } = useContext(BrowserContext);
  const { label } = props;

  return (
    <li className={cx("nav-item")}>
      <a
        className={cx("nav-link", { active: category.value == label })}
        onClick={() => (category.value = label)}
        href={`#${label}`}
      >
        {label}
      </a>
    </li>
  );
}
