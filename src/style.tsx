import classNames from "classnames/bind";
import styles from "./style.module.scss";

export type Classname = keyof typeof styles;
export type Argument = Classname | { [K in Classname]?: boolean } | Argument[];

const cx: (...args: Argument[]) => string = classNames.bind(styles);

export default cx;
