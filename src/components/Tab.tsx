import { useContext } from "preact/hooks";
import BrowserContext, { SelectedCategory } from "../BrowserContext";
import cx from "../style";

export default function Tab(props: { label: SelectedCategory }) {
  const { category } = useContext(BrowserContext);
  const { label } = props;

  return (
    <a
      className={cx("nav-link", "text-sm-center", { active: category.value == label })}
      href={`/?category=${label}`}
      onClick={() => (category.value = label)}
    >
      {label}
    </a>
  );
}
