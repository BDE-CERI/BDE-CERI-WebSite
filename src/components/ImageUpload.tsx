"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";

interface ImageUploadProps {
  name: string;
  defaultValue?: string;
  required?: boolean;
}

export default function ImageUpload({ name, defaultValue, required }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(defaultValue || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
      }
      handleFile(file);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative group cursor-pointer
          w-full aspect-video rounded-xl border-2 border-dashed transition-all
          flex flex-col items-center justify-center overflow-hidden
          ${isDragging 
            ? "border-primary bg-primary/10 scale-[1.02]" 
            : "border-outline-variant/30 bg-surface-container-high hover:border-primary/50 hover:bg-surface-container-highest"}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          name={name}
          accept="image/*"
          required={required && !preview}
          onChange={onFileChange}
          className="hidden"
        />

        {preview ? (
          <>
            <img src={preview} alt="Aperçu" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <span className="material-symbols-outlined text-white text-3xl">sync</span>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); clearImage(); }}
                className="bg-error text-on-error p-2 rounded-full shadow-lg"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          </>
        ) : (
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary">
              <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
            </div>
            <p className="font-headline font-bold text-sm text-on-surface">
              Glisser-déposer ou cliquer
            </p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
              PNG, JPG ou WebP (max 5 Mo)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
