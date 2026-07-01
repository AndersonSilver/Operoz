import { EModalWidth, ModalCore } from "@operoz/ui";
import { Stickies } from "./stickies";

type TProps = {
  isOpen: boolean;
  handleClose: () => void;
};
export function AllStickiesModal(props: TProps) {
  const { isOpen, handleClose } = props;
  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.VXL}>
      <Stickies handleClose={handleClose} />
    </ModalCore>
  );
}
