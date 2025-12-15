"use client";

import Image from "next/image";
import { FiHeart, FiEye } from "react-icons/fi";
import type { Post } from "@/types/ui";

export default function PostCard({ post }: { post: Post }) {
  // ✅ FIX: Placeholder si no hay imagen válida
  const imageSrc = post.imageUrl?.trim() || '/placeholder-post.png';
  
  return (
    <div className="group relative w-full rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition">
      <div className="relative w-full aspect-[3/4]">
        <Image
          src={imageSrc}
          alt={post.title || 'Post image'}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          unoptimized={imageSrc.startsWith('/placeholder')}
        />
        
        {/* Overlay con stats */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            {post.title && (
              <h3 className="font-semibold text-sm mb-2 line-clamp-2">{post.title}</h3>
            )}
            
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <FiHeart />
                <span>{post.stats.likes}</span>
              </div>
              <div className="flex items-center gap-1">
                <FiEye />
                <span>{post.stats.views}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}