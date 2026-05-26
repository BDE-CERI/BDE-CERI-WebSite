"use client";

import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react";

interface ImageUploadProps {
  name: string;
  defaultValue?: string;
  required?: boolean;
  aspectRatio?: number;
  circular?: boolean;
}

export default function ImageUpload({ name, defaultValue, required, aspectRatio, circular }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(defaultValue || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for Cropping Modal
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState<string>("");
  const [cropZoom, setCropZoom] = useState(1);
  const [cropRotation, setCropRotation] = useState(0);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [imageDisplaySize, setImageDisplaySize] = useState({ width: 280, height: 280 });

  // Dragging states
  const [isCroppingDrag, setIsCroppingDrag] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });

  // Touch states
  const [isCroppingTouch, setIsCroppingTouch] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchStartOffset, setTouchStartOffset] = useState({ x: 0, y: 0 });

  const cropImgRef = useRef<HTMLImageElement>(null);

  // Smooth dragging via global window listeners for Desktop Mouse
  useEffect(() => {
    if (!isCroppingDrag) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setCropOffset({
        x: dragStartOffset.x + dx,
        y: dragStartOffset.y + dy,
      });
    };

    const handleMouseUp = () => {
      setIsCroppingDrag(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isCroppingDrag, dragStart, dragStartOffset]);

  // Smooth dragging via global window listeners for Mobile Touch
  useEffect(() => {
    if (!isCroppingTouch) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const dx = e.touches[0].clientX - touchStart.x;
      const dy = e.touches[0].clientY - touchStart.y;
      setCropOffset({
        x: touchStartOffset.x + dx,
        y: touchStartOffset.y + dy,
      });
    };

    const handleTouchEnd = () => {
      setIsCroppingTouch(false);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isCroppingTouch, touchStart, touchStartOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsCroppingDrag(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragStartOffset({ ...cropOffset });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    setIsCroppingTouch(true);
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setTouchStartOffset({ ...cropOffset });
  };

  const handleFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (aspectRatio) {
          // Open cropping modal
          setCropImageSrc(result);
          setCropFileName(file.name);
          setCropZoom(1);
          setCropRotation(0);
          setCropOffset({ x: 0, y: 0 });
          setShowCropModal(true);
        } else {
          // Standard preview directly
          setPreview(result);
        }
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

  const handleCropSave = () => {
    if (!cropImageSrc || !cropImgRef.current) return;

    const img = new window.Image();
    img.src = cropImageSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 500;
      canvas.height = 500;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Fill background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 500, 500);

      // Translate context to center of the canvas
      ctx.translate(250, 250);
      
      // Apply rotation
      ctx.rotate((cropRotation * Math.PI) / 180);

      // Sizing ratio: display size was 280x280. Canvas size is 500x500.
      const S = 500 / 280;

      // Draw the image
      const drawX = cropOffset.x * S;
      const drawY = cropOffset.y * S;
      const drawW = imageDisplaySize.width * S * cropZoom;
      const drawH = imageDisplaySize.height * S * cropZoom;

      ctx.drawImage(img, drawX - drawW / 2, drawY - drawH / 2, drawW, drawH);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const croppedUrl = URL.createObjectURL(blob);
            setPreview(croppedUrl);

            // Set cropped file to the file input programmatically
            if (fileInputRef.current) {
              const croppedFile = new File([blob], cropFileName || "profile.jpg", {
                type: "image/jpeg",
              });
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(croppedFile);
              fileInputRef.current.files = dataTransfer.files;
            }

            // Close modal
            setShowCropModal(false);
            setCropImageSrc(null);
          }
        },
        "image/jpeg",
        0.9
      );
    };
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
            <img src={preview} alt="Aperçu" className="w-full h-full object-cover animate-fade-in" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <span className="material-symbols-outlined text-white text-3xl">sync</span>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); clearImage(); }}
                className="bg-error text-on-error p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
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

      {/* Cropping Modal */}
      {showCropModal && cropImageSrc && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
          onClick={() => {
            setShowCropModal(false);
            setCropImageSrc(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        >
          <div 
            className="bg-surface-container-lowest opacity-100 rounded-3xl border border-outline-variant/20 max-w-md w-full shadow-2xl p-6 flex flex-col gap-6 transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
              <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">crop</span>
                Ajuster la photo
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setShowCropModal(false);
                  setCropImageSrc(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Viewport for Cropping */}
            <div className="relative w-[280px] h-[280px] mx-auto rounded-2xl overflow-hidden bg-black/60 shadow-inner flex items-center justify-center select-none border border-outline-variant/10">
              <img
                ref={cropImgRef}
                src={cropImageSrc}
                alt="Recadrage"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                className="select-none pointer-events-auto max-w-none"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom}) rotate(${cropRotation}deg)`,
                  transformOrigin: "center center",
                  cursor: isCroppingDrag || isCroppingTouch ? "grabbing" : "grab",
                  userSelect: "none",
                  width: imageDisplaySize.width,
                  height: imageDisplaySize.height,
                }}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  const imgRatio = img.naturalWidth / img.naturalHeight;
                  let displayW = 280;
                  let displayH = 280;
                  if (imgRatio > 1) {
                    displayH = 280;
                    displayW = 280 * imgRatio;
                  } else {
                    displayW = 280;
                    displayH = 280 / imgRatio;
                  }
                  setImageDisplaySize({ width: displayW, height: displayH });
                }}
              />

              {/* Crop Mask Overlay */}
              <div 
                className="absolute pointer-events-none z-10 border border-white/25"
                style={{
                  borderRadius: circular ? "50%" : "12px",
                  top: "15px",
                  left: "15px",
                  right: "15px",
                  bottom: "15px",
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.65)",
                }}
              />
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {/* Zoom Slider */}
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-sm text-on-surface-variant">zoom_out</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  className="flex-grow accent-primary cursor-pointer h-1.5 bg-surface-container-highest rounded-lg appearance-none"
                />
                <span className="material-symbols-outlined text-sm text-on-surface-variant">zoom_in</span>
                <span className="text-xs font-mono font-bold text-primary w-8 text-right">
                  {Math.round(cropZoom * 100)}%
                </span>
              </div>

              {/* Rotate and Reset buttons */}
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setCropRotation((prev) => (prev + 90) % 360)}
                  className="flex items-center gap-2 text-xs font-bold text-on-surface-variant hover:text-on-surface bg-surface-container-highest/60 hover:bg-surface-container-highest px-3 py-2 rounded-xl transition-colors border border-outline-variant/10"
                >
                  <span className="material-symbols-outlined text-sm">rotate_right</span>
                  Faire pivoter (90°)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCropZoom(1);
                    setCropRotation(0);
                    setCropOffset({ x: 0, y: 0 });
                  }}
                  className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  Réinitialiser
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 border-t border-outline-variant/10 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCropModal(false);
                  setCropImageSrc(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="flex-1 bg-surface-container-highest hover:bg-surface-container-highest/80 text-on-surface font-bold py-2.5 rounded-xl text-sm transition-colors border border-outline-variant/10"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCropSave}
                className="flex-grow-[2] bg-primary hover:bg-primary/90 text-on-primary font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                Valider et recadrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
