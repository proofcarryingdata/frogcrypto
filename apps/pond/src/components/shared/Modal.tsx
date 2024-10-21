import React from "react";
import ReactModal from "react-modal";

// Bind modal to your appElement for accessibility
ReactModal.setAppElement("#root");

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, children }: ModalProps) {
  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-white max-w-[calc(24rem-1.5rem)] w-full m-auto"
      overlayClassName="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50"
    >
      {children}
    </ReactModal>
  );
}

export default Modal;
