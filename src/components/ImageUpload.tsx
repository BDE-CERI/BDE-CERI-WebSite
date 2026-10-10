"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, PointerEvent } from "react";

interface ImageUploadProps {
  name: string;
  defaultValue?: string;
  required?: boolean;
  aspectRatio?: number;
  circular?: boolean;
  english?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
type Offset = { x: number; y: number };

function getCropDimensions(width: number, height: number, ratio: number, rotation: number) {
  const rotated = rotation % 180 !== 0;
  const scale = Math.max(ratio / (rotated ? height : width), 1 / (rotated ? width : height));
  return { width: width * scale, height: height * scale };
}

export default function ImageUpload({ name, defaultValue, required, aspectRatio, circular, english = false }: ImageUploadProps) {
  const inputId = useId();
  const titleId = useId();
  const [syncedDefault, setSyncedDefault] = useState(defaultValue);
  const [preview, setPreview] = useState<string | null>(defaultValue || null);
  const [selectedName, setSelectedName] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isSavingCrop, setIsSavingCrop] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropName, setCropName] = useState("");
  const [cropZoom, setCropZoom] = useState(1);
  const [cropRotation, setCropRotation] = useState(0);
  const [cropOffset, setCropOffset] = useState<Offset>({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const committedFileRef = useRef<File | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const cropUrlRef = useRef<string | null>(null);
  const dispatchingRef = useRef(false);
  const operationRef = useRef(0);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; offset: Offset } | null>(null);
  // Every uploaded image is cropped before it enters the form. The default matches
  // the wide cards used for events, poles and news; profile/shop uploads override it.
  const ratio = aspectRatio && Number.isFinite(aspectRatio) && aspectRatio > 0 ? Math.min(10, Math.max(0.1, aspectRatio)) : 16 / 9;
  const dimensions = getCropDimensions(naturalSize.width, naturalSize.height, ratio, cropRotation);
  const rotated = cropRotation % 180 !== 0;
  const bounds = {
    x: Math.max(0, ((rotated ? dimensions.height : dimensions.width) * cropZoom - ratio) / (2 * ratio)),
    y: Math.max(0, ((rotated ? dimensions.width : dimensions.height) * cropZoom - 1) / 2),
  };


  const copy = english ? {
    formatError: "Choose a JPEG, PNG, WebP, GIF or AVIF image.",
    emptyError: "This file is empty. Choose another image.",
    sizeError: "This image exceeds 5 MB. Choose a smaller file.",
    preparing: "Preparing the image…",
    preparingValidity: "Please wait while the image is prepared.",
    cropValidity: "Confirm or cancel cropping before saving.",
    readError: "This image could not be read. Try another file.",
    cropError: "Cropping failed. Try again or choose another image.",
    preview: "Preview of the selected image",
    drop: "Drop an image here",
    chooseBelow: "or choose a file below",
    replace: "Replace image",
    choose: "Choose image",
    formats: "JPEG, PNG, WebP, GIF or AVIF · up to 5 MB.",
    undo: "Cancel replacement",
    remove: "Remove selected file",
    cropTitle: "Adjust the photo",
    cropCancel: "Cancel cropping",
    cropHelp: "Drag the image or use the sliders to adjust the framing. The file will be saved as JPEG.",
    cropPreview: "Crop preview",
    zoom: "Zoom",
    horizontal: "Horizontal position",
    vertical: "Vertical position",
    rotate: "Rotate by 90°",
    reset: "Reset",
    cancel: "Cancel",
    save: "Confirm crop",
  } : {
    formatError: "Choisissez une image JPEG, PNG, WebP, GIF ou AVIF.",
    emptyError: "Ce fichier est vide. Choisissez une autre image.",
    sizeError: "Cette image dépasse 5 Mo. Choisissez un fichier plus léger.",
    preparing: "Préparation de l’image…",
    preparingValidity: "Veuillez attendre la préparation de l’image.",
    cropValidity: "Validez ou annulez le recadrage avant d’enregistrer.",
    readError: "Cette image ne peut pas être lue. Essayez un autre fichier.",
    cropError: "Le recadrage a échoué. Réessayez ou choisissez une autre image.",
    preview: "Aperçu de l’image choisie",
    drop: "Glissez une image ici",
    chooseBelow: "ou choisissez un fichier ci-dessous",
    replace: "Remplacer l’image",
    choose: "Choisir une image",
    formats: "JPEG, PNG, WebP, GIF ou AVIF · 5 Mo maximum.",
    undo: "Annuler le remplacement",
    remove: "Retirer le fichier sélectionné",
    cropTitle: "Ajuster la photo",
    cropCancel: "Annuler le recadrage",
    cropHelp: "Déplacez l’image ou utilisez les curseurs pour ajuster le cadrage. Le fichier sera enregistré en JPEG.",
    cropPreview: "Aperçu du recadrage",
    zoom: "Zoom",
    horizontal: "Position horizontale",
    vertical: "Position verticale",
    rotate: "Pivoter de 90°",
    reset: "Réinitialiser",
    cancel: "Annuler",
    save: "Valider le recadrage",
  };

  // A refreshed saved image replaces the preview only when no selection is in progress.
  // This conditional state adjustment also avoids a delayed effect overwriting a new file.
  if (defaultValue !== syncedDefault && !selectedName && !cropSource && !isReading && !isSavingCrop) {
    setSyncedDefault(defaultValue);
    setPreview(defaultValue || null);
  }

  useEffect(() => {
    const input = fileInputRef.current;
    const form = input?.form;
    if (!input || !form) return;

    const clearSelection = (preservePreview: boolean) => {
      operationRef.current += 1;
      committedFileRef.current = null;
      input.value = "";
      input.setCustomValidity("");
      setSelectedName("");
      setError("");
      setIsReading(false);
      setIsSavingCrop(false);
      setIsDragging(false);
      setSyncedDefault(defaultValue);
      if (cropUrlRef.current) URL.revokeObjectURL(cropUrlRef.current);
      cropUrlRef.current = null;
      dragRef.current = null;
      setCropSource(null);
      dialogRef.current?.close();
      if (!preservePreview) {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
        setPreview(defaultValue || null);
      }
      // Do not emit input/change here: a successful save must leave the form clean.
    };

    const onReset = () => clearSelection(false);
    const onSaved = () => clearSelection(true);
    form.addEventListener("reset", onReset);
    form.addEventListener("admin:saved", onSaved);
    return () => {
      form.removeEventListener("reset", onReset);
      form.removeEventListener("admin:saved", onSaved);
    };
  }, [defaultValue]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (cropSource && dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, [cropSource]);

  useEffect(() => () => {
    operationRef.current += 1;
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    if (cropUrlRef.current) URL.revokeObjectURL(cropUrlRef.current);
  }, []);

  // The parent form receives programmatic selections just like native file selections.
  const writeInputFile = (file: File | null) => {
    const input = fileInputRef.current;
    if (!input) return;
    const transfer = new DataTransfer();
    if (file) transfer.items.add(file);
    input.files = transfer.files;
    input.setCustomValidity("");
    dispatchingRef.current = true;
    try {
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    } finally {
      dispatchingRef.current = false;
    }
  };

  const commitFile = (file: File, url: string) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = url;
    committedFileRef.current = file;
    setPreview(url);
    setSelectedName(file.name);
    setError("");
    writeInputFile(file);
  };

  const releaseCrop = () => {
    if (cropUrlRef.current) URL.revokeObjectURL(cropUrlRef.current);
    cropUrlRef.current = null;
    dragRef.current = null;
    setCropSource(null);
    dialogRef.current?.close();
  };

  const cancelCrop = () => {
    if (isSavingCrop) return;
    operationRef.current += 1;
    writeInputFile(committedFileRef.current);
    releaseCrop();
    setError("");
  };

  const chooseFile = async (file: File) => {
    const operation = ++operationRef.current;
    setError("");
    setIsReading(false);
    if (!IMAGE_TYPES.includes(file.type)) {
      writeInputFile(committedFileRef.current);
      setError(copy.formatError);
      return;
    }
    if (file.size > MAX_FILE_SIZE || file.size === 0) {
      writeInputFile(committedFileRef.current);
      setError(file.size === 0 ? copy.emptyError : copy.sizeError);
      return;
    }
    setIsReading(true);
    fileInputRef.current?.setCustomValidity(copy.preparingValidity);
    const url = URL.createObjectURL(file);
    try {
      const image = new window.Image();
      image.src = url;
      await image.decode();
      if (operation !== operationRef.current) {
        URL.revokeObjectURL(url);
        return;
      }
      if (!image.naturalWidth || !image.naturalHeight) throw new Error("Invalid image");
      cropUrlRef.current = url;
      setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight });
      setCropName(file.name);
      setCropZoom(1);
      setCropRotation(0);
      setCropOffset({ x: 0, y: 0 });
      setCropSource(url);
      fileInputRef.current?.setCustomValidity(copy.cropValidity);
    } catch {
      URL.revokeObjectURL(url);
      if (operation === operationRef.current) {
        writeInputFile(committedFileRef.current);
        setError(copy.readError);
      }
    } finally {
      if (operation === operationRef.current) setIsReading(false);
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (dispatchingRef.current) return;
    const file = event.currentTarget.files?.[0];
    if (file) void chooseFile(file);
    else {
      operationRef.current += 1;
      setIsReading(false);
      writeInputFile(committedFileRef.current);
    }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (isReading || isSavingCrop || cropSource) return;
    const file = event.dataTransfer.files[0];
    if (file) void chooseFile(file);
  };

  const undoSelection = () => {
    operationRef.current += 1;
    committedFileRef.current = null;
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setSelectedName("");
    setPreview(defaultValue || null);
    setError("");
    writeInputFile(null);
  };

  const setClampedOffset = (offset: Offset) => setCropOffset({
    x: Math.min(bounds.x, Math.max(-bounds.x, offset.x)),
    y: Math.min(bounds.y, Math.max(-bounds.y, offset.y)),
  });

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (isSavingCrop || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, offset: cropOffset };
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!drag || drag.pointerId !== event.pointerId || !rect) return;
    setClampedOffset({ x: drag.offset.x + (event.clientX - drag.x) / rect.width, y: drag.offset.y + (event.clientY - drag.y) / rect.height });
  };

  const finishDrag = () => { dragRef.current = null; };

  const saveCrop = async () => {
    const image = cropImageRef.current;
    if (!image || !image.complete || isSavingCrop) return;
    const operation = ++operationRef.current;
    setIsSavingCrop(true);
    setError("");
    try {
      const width = Math.max(1, Math.round(ratio >= 1 ? 720 : 720 * ratio));
      const height = Math.max(1, Math.round(ratio >= 1 ? 720 / ratio : 720));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.translate(width * (0.5 + cropOffset.x), height * (0.5 + cropOffset.y));
      context.rotate(cropRotation * Math.PI / 180);
      const scale = height;
      const drawWidth = dimensions.width * scale * cropZoom;
      const drawHeight = dimensions.height * scale * cropZoom;
      context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Image encoding failed")), "image/jpeg", 0.9));
      if (operation !== operationRef.current) return;
      const file = new File([blob], cropName.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
      commitFile(file, URL.createObjectURL(blob));
      releaseCrop();
    } catch {
      setError(copy.cropError);
    } finally {
      if (operation === operationRef.current) setIsSavingCrop(false);
    }
  };

  return (
    <div className="min-w-0 space-y-3">
      <div
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false); }}
        onDrop={onDrop}
        className={"overflow-hidden rounded-xl border-2 border-dashed transition-colors " + (isDragging ? "border-primary bg-primary/10" : "border-outline-variant/30 bg-surface-container-high")}
      >
        <div className="relative flex w-full items-center justify-center overflow-hidden" style={{ aspectRatio: aspectRatio || 16 / 9 }}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- Local blob previews need a native image and do not use the optimisation endpoint.
            <img src={preview} alt={copy.preview} className={"h-full w-full object-cover " + (circular ? "rounded-full" : "")} />
          ) : (
            <div className="p-6 text-center">
              <span aria-hidden="true" className="material-symbols-outlined mb-2 text-3xl text-primary">add_photo_alternate</span>
              <p className="text-sm font-bold">{copy.drop}</p>
              <p className="mt-1 text-xs text-on-surface-variant">{copy.chooseBelow}</p>
            </div>
          )}
        </div>
        <div className="border-t border-outline-variant/15 p-3">
          <label htmlFor={inputId} className="mb-2 block text-sm font-bold">
            {defaultValue ? copy.replace : copy.choose}
          </label>
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            name={name}
            accept={IMAGE_TYPES.join(",")}
            required={required && !defaultValue}
            aria-busy={isReading || isSavingCrop}
            onChange={onFileChange}
            aria-invalid={!!error}
            aria-describedby={inputId + "-help" + (error ? " " + inputId + "-error" : "")}
            className="block w-full min-w-0 rounded-lg text-xs text-on-surface-variant file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2.5 file:text-xs file:font-bold file:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
          />
          <p id={inputId + "-help"} className="mt-2 text-xs leading-relaxed text-on-surface-variant">
            {copy.formats}
          </p>
        </div>
      </div>
      {isReading && <p role="status" className="text-xs text-on-surface-variant">{copy.preparing}</p>}
      {selectedName && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 break-all text-xs text-on-surface-variant">{selectedName}</p>
          <button type="button" disabled={isReading || isSavingCrop} onClick={undoSelection} className="min-h-10 rounded-lg border border-outline-variant/25 px-3 py-2 text-xs font-bold hover:bg-surface-container-high disabled:opacity-50">
            {defaultValue ? copy.undo : copy.remove}
          </button>
        </div>
      )}
      {error && !cropSource && <p id={inputId + "-error"} role="alert" className="rounded-lg bg-error/10 p-3 text-sm text-error">{error}</p>}

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={titleId + "-help"}
        onCancel={(event) => { event.preventDefault(); cancelCrop(); }}
        className="fixed inset-0 m-auto overflow-y-auto rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 text-on-surface shadow-2xl backdrop:bg-black/75 sm:p-6"
        style={{ width: "min(28rem, calc(100vw - 2rem))", maxHeight: "calc(100dvh - 2rem)" }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 id={titleId} className="font-headline text-lg font-bold">{copy.cropTitle}</h3>
          <button type="button" onClick={cancelCrop} disabled={isSavingCrop} aria-label={copy.cropCancel} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-surface-container-high disabled:opacity-50">
            <span aria-hidden="true" className="material-symbols-outlined">close</span>
          </button>
        </div>
        <p id={titleId + "-help"} className="mb-4 text-xs leading-relaxed text-on-surface-variant">
          {copy.cropHelp}
        </p>
        {cropSource && (
          <div
            ref={viewportRef}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            className="relative mx-auto touch-none select-none overflow-hidden bg-black"
            style={{ width: "100%", maxWidth: Math.min(300, 300 * ratio), aspectRatio: ratio, borderRadius: circular ? "50%" : "0.75rem", cursor: "grab" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- The crop canvas needs this native image element and its decoded pixels. */}
            <img
              ref={cropImageRef}
              src={cropSource}
              alt={copy.cropPreview}
              draggable={false}
              className="pointer-events-none absolute max-w-none"
              style={{
                left: (50 + cropOffset.x * 100) + "%",
                top: (50 + cropOffset.y * 100) + "%",
                width: dimensions.width / ratio * 100 + "%",
                height: dimensions.height * 100 + "%",
                transform: "translate(-50%, -50%) rotate(" + cropRotation + "deg) scale(" + cropZoom + ")",
                transformOrigin: "center",
              }}
            />
          </div>
        )}
        <fieldset disabled={isSavingCrop} className="mt-5 space-y-4 disabled:opacity-60">
          <label className="block text-xs font-bold">
            {copy.zoom} · {Math.round(cropZoom * 100)} %
            <input
              type="range" min="1" max="3" step="0.01" value={cropZoom}
              onChange={(event) => {
                const zoom = Number(event.target.value);
                const nextBounds = {
                  x: Math.max(0, ((rotated ? dimensions.height : dimensions.width) * zoom - ratio) / (2 * ratio)),
                  y: Math.max(0, ((rotated ? dimensions.width : dimensions.height) * zoom - 1) / 2),
                };
                setCropZoom(zoom);
                setCropOffset((offset) => ({ x: Math.min(nextBounds.x, Math.max(-nextBounds.x, offset.x)), y: Math.min(nextBounds.y, Math.max(-nextBounds.y, offset.y)) }));
              }}
              className="mt-2 block w-full accent-primary"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-xs font-bold">
              {copy.horizontal}
              <input type="range" min={-bounds.x} max={bounds.x || 0.001} step="0.001" value={cropOffset.x} disabled={bounds.x === 0} onChange={(event) => setClampedOffset({ ...cropOffset, x: Number(event.target.value) })} className="mt-2 block w-full accent-primary disabled:opacity-40" />
            </label>
            <label className="block text-xs font-bold">
              {copy.vertical}
              <input type="range" min={-bounds.y} max={bounds.y || 0.001} step="0.001" value={cropOffset.y} disabled={bounds.y === 0} onChange={(event) => setClampedOffset({ ...cropOffset, y: Number(event.target.value) })} className="mt-2 block w-full accent-primary disabled:opacity-40" />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { setCropRotation((rotation) => (rotation + 90) % 360); setCropOffset({ x: 0, y: 0 }); }} className="min-h-10 rounded-lg border border-outline-variant/25 px-3 py-2 text-xs font-bold hover:bg-surface-container-high">
              {copy.rotate}
            </button>
            <button type="button" onClick={() => { setCropRotation(0); setCropZoom(1); setCropOffset({ x: 0, y: 0 }); }} className="min-h-10 rounded-lg px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10">
              {copy.reset}
            </button>
          </div>
        </fieldset>
        {error && <p id={inputId + "-error"} role="alert" className="mt-4 rounded-lg bg-error/10 p-3 text-sm text-error">{error}</p>}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-outline-variant/20 pt-4">
          <button type="button" onClick={cancelCrop} disabled={isSavingCrop} className="min-h-11 flex-1 rounded-xl border border-outline-variant/30 px-3 py-2 text-sm font-bold disabled:opacity-50">
            {copy.cancel}
          </button>
          <button type="button" onClick={() => void saveCrop()} disabled={isSavingCrop} className="min-h-11 flex-[2] rounded-xl bg-primary px-3 py-2 text-sm font-bold text-on-primary disabled:opacity-50">
            {isSavingCrop ? copy.preparing : copy.save}
          </button>
        </div>
      </dialog>
    </div>
  );
}
