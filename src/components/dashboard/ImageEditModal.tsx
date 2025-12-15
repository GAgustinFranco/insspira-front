'use client';

import { useEffect, useState } from 'react';
import { FiX, FiUpload } from 'react-icons/fi';

export default function ImageEditModal({
  open,
  onClose,
  onSave,
  currentUrl,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (file: File) => void;
  currentUrl: string | null; // ✅ Permitir null
}) {
  // ✅ FIX: Usar placeholder si currentUrl está vacío
  const fallbackAvatar = 'https://ui-avatars.com/api/?name=User&size=160&background=6B46C1&color=fff';
  
  // ✅ CRÍTICO: Inicializar con valor válido inmediatamente
  const initialPreview = currentUrl?.trim() || fallbackAvatar;
  
  const [preview, setPreview] = useState<string>(initialPreview);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (open) {
      // ✅ FIX: Prevenir string vacío
      const validUrl = currentUrl?.trim();
      setPreview(validUrl || fallbackAvatar);
      setFile(null);
      setError(null);
      setDragging(false);
    }
  }, [open, currentUrl]);

  if (!open) return null;

  const readFile = (f: File) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(f.type)) {
      setError('Unsupported format. Use PNG, JPG, or WEBP.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('The file exceeds 5MB. Please reduce the size.');
      return;
    }
    setError(null);
    setFile(f);
    const fr = new FileReader();
    fr.onload = () => {
      const dataUrl = String(fr.result || '');
      if (dataUrl) setPreview(dataUrl);
    };
    fr.readAsDataURL(f);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) readFile(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) readFile(f);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-[var(--color-violeta)] text-white border border-white/10 shadow-2xl">
        {/* header */}
        <div className="p-5 flex items-center justify-between border-b border-white/10">
          <h2 className="text-lg font-semibold">Update Profile Picture</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10"
            aria-label="Close"
            title="Close"
          >
            <FiX />
          </button>
        </div>

        {/* body */}
        <div className="p-5 grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          {/* Upload zone */}
          <div>
            <label
              htmlFor="avatarFile"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`block cursor-pointer rounded-xl border border-dashed p-6 text-center transition
                ${dragging ? 'border-white bg-white/10' : 'border-white/30 bg-white/5 hover:border-white/60'}`}
              title="Click or drag an image"
            >
              <input
                id="avatarFile"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleInput}
              />
              <div className="mx-auto mb-3 grid place-items-center">
                <FiUpload className="text-2xl" />
              </div>
              <div className="text-sm font-medium">Click or drag an image here</div>
              <div className="mt-1 text-xs text-white/70">Formats: PNG, JPG or WEBP · Max: 5MB</div>
            </label>

            {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
          </div>

          {/* Circular preview */}
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32 md:w-40 md:h-40">
              {/* ✅ CRÍTICO: Solo renderizar si preview es válido y no vacío */}
              {preview && preview.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full rounded-full object-cover ring-2 ring-white/20"
                  onError={(e) => {
                    // Fallback si la imagen falla al cargar
                    e.currentTarget.src = fallbackAvatar;
                  }}
                />
              ) : (
                // Placeholder si no hay imagen válida
                <div className="absolute inset-0 w-full h-full rounded-full bg-white/10 ring-2 ring-white/20 flex items-center justify-center text-white/50">
                  <FiUpload className="text-3xl" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="p-5 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/20 hover:border-white"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (file) onSave(file);
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-white text-[var(--color-violeta)] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!file}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}