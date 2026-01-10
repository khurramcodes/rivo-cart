"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: "text-red-600 bg-red-50",
    warning: "text-yellow-600 bg-yellow-50",
    info: "text-blue-600 bg-blue-50",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded shadow-2xl w-full max-w-md animate-slideUp">
        <div className="p-6">
          <div className={`w-12 h-12 rounded-full ${variantStyles[variant]} flex items-center justify-center mb-4`}>
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">{title}</h3>
          <p className="text-zinc-600 mb-6">{message}</p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={onClose}>
              {cancelText}
            </Button>
            <Button
              variant={variant === "danger" ? "danger" : "primary"}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

