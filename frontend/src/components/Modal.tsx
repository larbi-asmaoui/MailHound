import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  actions,
}: ModalProps) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-background-card p-6 text-left align-middle shadow-xl transition-all border border-border">
                <div className="flex items-center justify-between mb-4">
                  {title && (
                    <Dialog.Title className="text-2xl font-bold text-white">
                      {title}
                    </Dialog.Title>
                  )}
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white p-1 rounded transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="mb-4">{children}</div>
                {actions && (
                  <div className="flex justify-end gap-2 mt-6">{actions}</div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
