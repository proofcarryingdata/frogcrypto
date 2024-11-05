import React from "react";
import ReactModal from "react-modal";

// Bind modal to your appElement for accessibility
ReactModal.setAppElement("#root");

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  shouldCloseOnOverlayClick?: boolean;
  overlayClassName?: string;
}

function Modal({
  isOpen,
  onClose,
  children,
  shouldCloseOnOverlayClick,
  overlayClassName,
}: ModalProps) {
  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
      className="max-w-[calc(24rem-1.5rem)] w-full m-auto outline-none"
      overlayClassName={`fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 ${overlayClassName ?? ""}`}
    >
      {children}
    </ReactModal>
  );
}

export default Modal;
