import React from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, className }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={cn("relative bg-card dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6", className)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-100 dark:text-white">
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-bold"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        {children}
      </div>
    </div>
  );
};