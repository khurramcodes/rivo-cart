"use client";

import { Upload, X } from "lucide-react";
import { useRef } from "react";

interface ImageUploadProps {
  value: File | string | null;
  onChange: (file: File | null) => void;
  label: string;
  required?: boolean;
  disabled?: boolean;
  disableRemove?: boolean;
}

export function ImageUpload({ value, onChange, label, required = false, disabled = false, disableRemove = false }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = value instanceof File ? URL.createObjectURL(value) : value;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onChange(file);
  };

  const handleRemove = () => {
    if (disableRemove) {
      alert("This image is required and cannot be removed. Please upload a replacement image instead.");
      return;
    }
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {previewUrl ? (
        <div className="relative group">
          <img
            src={previewUrl}
            alt={label}
            className="w-full h-48 object-cover rounded border-2 border-zinc-200"
          />
          {!disableRemove && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 disabled:opacity-50"
            >
              <X size={16} />
            </button>
          )}
          {disableRemove && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-blue-600 disabled:opacity-50 text-xs font-medium"
            >
              Replace
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          className={`border-2 border-dashed border-zinc-300 rounded p-8 text-center transition-all ${
            disabled ? "opacity-50 cursor-not-allowed" : "hover:border-zinc-400 cursor-pointer hover:bg-zinc-50"
          }`}
        >
          <Upload className="mx-auto mb-3 text-zinc-400" size={32} />
          <p className="text-sm text-zinc-600 mb-1">Click to upload {label.toLowerCase()}</p>
          <p className="text-xs text-zinc-400">PNG, JPG, WEBP up to 10MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />
    </div>
  );
}

