import type { ISvgIcons } from "../type";
import { BrandMark } from "./brand-mark";

export function PlaneLogo(props: ISvgIcons & { alt?: string }) {
  const { className, alt = "Logo", height, width } = props;
  return <BrandMark className={className} alt={alt} height={height} width={width} />;
}
