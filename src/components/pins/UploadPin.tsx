// src/view/CreatePin.tsx (o UploadPin.tsx)
"use client";

import { useEffect, useState } from "react";
import type { DragEvent, ChangeEvent, FormEvent } from "react";
import { getCloudinarySignature, uploadToCloudinary, getCategories, savePin } from "@/services/pins.services";
import type { ICategory } from "@/interfaces/ICategory";
import { toast } from "react-toastify";
import Image from "next/image";

function validateFile(f: File) {
  const MAX_BYTES = 2 * 1024 * 1024; 
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(f.type)) return "File format not allowed (jpg/png/webp).";
  if (f.size > MAX_BYTES) return "File exceeds 2 MB.";
  return null;
}

export default function UploadPin() {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState<string>("");
  const [hashtagsInput, setHashtagsInput] = useState<string>("");
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectFile = (f: File) => {
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      selectFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      selectFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats); 
        if (cats.length > 0) {
          setCategoryId(cats[0].id); 
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleUpload = async () => {
    if (!file || !description.trim() || !categoryId) {
      setError("Image, description and category are required.");
      return;
    }
  
    // 🔍 DEBUG: Verificar token
    const token = localStorage.getItem('auth:token');
    console.log('🔑 Token before upload:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
    
    if (!token) {
      toast.error('You must be logged in to upload pins');
      return;
    }
  
    setError(null);
    setUploading(true);
  
    try {
      const sigData = await getCloudinarySignature();
      const result = await uploadToCloudinary(file, sigData);
      const imageUrl = result.secure_url;
  
      const hashtagsArray = hashtagsInput
        .split(/[\s,]+/)
        .map(tag => tag.trim().replace(/^#/, ''))
        .filter(tag => tag.length > 0);
  
      console.log('📤 About to save pin...'); // Debug
      await savePin({
        image: imageUrl,
        description,
        categoryId,
        hashtags: hashtagsArray
      });
  
      toast.success("Pin uploaded successfully!");
      setFile(null);
      setPreviewUrl(null);
      setDescription("");
      setHashtagsInput("");
    } catch (err: any) {
      console.error('❌ Upload error:', err);
      console.error('❌ Error response:', err.response);
      
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem('auth:token');
        localStorage.removeItem('auth:user');
        window.location.href = '/login';
      } else if (err.response?.status === 403) {
        toast.error("You have reached your daily limit. Please subscribe.");
      } else if (err.response?.data?.message) {
        const msg = Array.isArray(err.response.data.message)
          ? err.response.data.message.join(", ")
          : err.response.data.message;
        setError(msg);
        toast.error(msg);
      } else {
        setError("Failed to upload pin. Please try again.");
        toast.error("Failed to upload pin.");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleUpload();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--color-violeta)] px-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-stretch gap-4 p-6 border border-white/15 bg-[var(--color-morado)] rounded-2xl w-full max-w-md mx-auto"
      >
        {error && (
          <div className="rounded-lg border border-red-300/40 bg-red-100 text-red-800 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {/* File upload area */}
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-white/90">{file.name}</p>
            {previewUrl && (
              <Image
                width={160}
                height={160}
                src={previewUrl}
                alt="preview"
                className="w-40 h-40 object-cover rounded-lg shadow"
              />
            )}
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
              }}
              className="text-sm text-red-200 underline hover:text-red-100"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`w-full h-32 flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isDragging ? "border-blue-400 bg-blue-50/20" : "border-white/30"
            }`}
          >
            <p className="text-sm text-white/80 text-center">
              Drag and drop or{" "}
              <label htmlFor="fileInput" className="text-white underline cursor-pointer">
                browse files
              </label>
            </p>
          </div>
        )}

        <input
          type="file"
          id="fileInput"
          className="hidden"
          onChange={handleFileChange}
          accept="image/*"
        />

        {/* Description */}
        <label className="w-full text-md text-white/90">
          Description
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full mt-1 p-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 outline-none focus:border-white/40"
            placeholder="Share your thoughts..."
          />
        </label>

        {/* Hashtags */}
        <label className="w-full text-md text-white/90">
          Hashtags (optional)
          <input
            type="text"
            placeholder="tech art nature (no # needed)"
            value={hashtagsInput}
            onChange={(e) => setHashtagsInput(e.target.value)}
            className="w-full mt-1 p-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 outline-none focus:border-white/40"
          />
          <span className="text-xs text-white/60 mt-1 block">
            Separate with spaces or commas
          </span>
        </label>

        {/* Category */}
        <label className="w-full text-md text-white/90">
          Category
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full mt-1 p-2 rounded-lg bg-white/10 border border-white/20 text-white outline-none focus:border-white/40"
          >
            <option value="" disabled className="bg-[var(--color-morado)]">
              Choose a category
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-[var(--color-morado)] text-white">
                {cat.name}
              </option>
            ))}
          </select>
        </label>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!file || uploading}
          className="px-4 py-2 rounded-lg bg-white text-[var(--color-violeta)] font-semibold hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading..." : "Upload Pin"}
        </button>
      </form>
    </div>
  );
}