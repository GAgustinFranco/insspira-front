// src/components/dashboard/ProfileEditForm.tsx
"use client";

import { useState } from "react";
import type { UserProfile } from "@/types/ui";
import { updateUserProfile } from "@/services/dashboard";

type FormData = {
  name: string;
  username: string;
  email: string;
  bio: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function ProfileEditForm({
  value,
  onChange,
  onSaved,
}: {
  value: UserProfile;
  onChange: (next: UserProfile) => void;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<FormData>({
    name: value.name || "",
    username: value.username || "",
    email: value.email || "",
    bio: value.bio || "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Validaciones del lado del cliente
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!form.username.trim()) {
      newErrors.username = "Username is required";
    } else if (form.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      newErrors.username = "Username can only contain letters, numbers and underscores";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (form.bio.length > 150) {
      newErrors.bio = "Bio must not exceed 150 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, val: string) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setIsDirty(true);
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleUndo = () => {
    setForm({
      name: value.name || "",
      username: value.username || "",
      email: value.email || "",
      bio: value.bio || "",
    });
    setErrors({});
    setIsDirty(false);
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      const updated = await updateUserProfile(value.id, {
        name: form.name,
        username: form.username,
        email: form.email,
        biography: form.bio,
      });

      // Actualizar el estado local
      onChange({
        ...value,
        name: updated.name ?? form.name,
        username: updated.username ?? form.username,
        email: updated.email ?? form.email,
        bio: updated.biography ?? form.bio,
      });

      setIsDirty(false);
      onSaved?.();
    } catch (e: any) {
      console.error("updateUserProfile failed:", e);
      
      // Manejar errores del backend
      if (e.response?.data?.message) {
        const msg = Array.isArray(e.response.data.message)
          ? e.response.data.message.join(", ")
          : e.response.data.message;
        
        // Intentar asociar el error a un campo específico
        if (msg.toLowerCase().includes("email")) {
          setErrors({ email: msg });
        } else if (msg.toLowerCase().includes("username")) {
          setErrors({ username: msg });
        } else {
          alert(`Error: ${msg}`);
        }
      } else {
        alert("Failed to update profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-1">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className={`w-full px-4 py-2 rounded-lg bg-white/5 border ${
            errors.name ? "border-red-500" : "border-white/20"
          } text-white placeholder:text-white/40 focus:outline-none focus:border-white/40`}
          placeholder="John Doe"
        />
        {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
      </div>

      {/* Username */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-1">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={form.username}
          onChange={(e) => handleChange("username", e.target.value)}
          className={`w-full px-4 py-2 rounded-lg bg-white/5 border ${
            errors.username ? "border-red-500" : "border-white/20"
          } text-white placeholder:text-white/40 focus:outline-none focus:border-white/40`}
          placeholder="johndoe"
        />
        {errors.username && <p className="mt-1 text-sm text-red-400">{errors.username}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
          className={`w-full px-4 py-2 rounded-lg bg-white/5 border ${
            errors.email ? "border-red-500" : "border-white/20"
          } text-white placeholder:text-white/40 focus:outline-none focus:border-white/40`}
          placeholder="john@example.com"
        />
        {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-white/80 mb-1">
          Biography
          <span className="ml-2 text-xs text-white/60">
            ({form.bio.length}/150)
          </span>
        </label>
        <textarea
          id="bio"
          value={form.bio}
          onChange={(e) => handleChange("bio", e.target.value)}
          rows={3}
          maxLength={150}
          className={`w-full px-4 py-2 rounded-lg bg-white/5 border ${
            errors.bio ? "border-red-500" : "border-white/20"
          } text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 resize-none`}
          placeholder="Tell us about yourself..."
        />
        {errors.bio && <p className="mt-1 text-sm text-red-400">{errors.bio}</p>}
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleUndo}
          disabled={!isDirty || saving}
          className="px-4 py-2 rounded-lg border border-white/20 text-white hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="px-4 py-2 rounded-lg bg-white text-[var(--color-violeta)] font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}