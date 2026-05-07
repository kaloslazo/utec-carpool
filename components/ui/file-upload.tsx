"use client";

import * as React from "react";
import { useRef } from "react";
import { Upload, X, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  label?: string;
  hint?: string;
  preview?: string | null;
  fileName?: string | null;
  onChange: (file: File) => void;
  onClear?: () => void;
  className?: string;
}

export function FileUpload({
  accept = "image/*",
  label = "Subir archivo",
  hint = "JPG o PNG, máx. 2 MB",
  preview,
  fileName,
  onChange,
  onClear,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onChange(file);
  }

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />

      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-white">
          <img
            src={preview}
            alt="Preview"
            className="h-40 w-full object-cover"
          />
          <div className="flex items-center justify-between border-t border-border bg-surface/60 px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileImage className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate text-xs font-medium text-dark">{fileName ?? "Archivo seleccionado"}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Cambiar
              </button>
              {onClear && (
                <button
                  type="button"
                  onClick={onClear}
                  className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-2.5 rounded-xl border-2 border-dashed border-border bg-white px-4 py-6 transition-colors hover:border-primary/50 hover:bg-primary/3 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-dark">{label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          </div>
        </button>
      )}
    </div>
  );
}
