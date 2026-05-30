import type { ISvgIcons } from "../type";
import { BrandMark } from "./brand-mark";

export function PlaneLockup(props: ISvgIcons) {
  const { className, height, width } = props;
  return <BrandMark className={className} alt="Logo" height={height} width={width} />;
}
