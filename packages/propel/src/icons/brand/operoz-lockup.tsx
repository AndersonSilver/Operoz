import type { TBrandMarkProps } from "./brand-mark";
import { BrandMark } from "./brand-mark";

export type TOperozLockupProps = TBrandMarkProps;

export function OperozLockup(props: TOperozLockupProps) {
  return <BrandMark {...props} />;
}
