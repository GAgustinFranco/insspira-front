// src/components/pins/PinModal.tsx
'use client'

import { useEffect, useState } from "react";
import { getPinById, addLike, addComment, reportTarget, fetchLikeStatus } from "@/services/pins.services";
import Image from "next/image";
import { IoClose } from "react-icons/io5";
import { FiHeart } from "react-icons/fi";
import { GoHeartFill } from "react-icons/go";
import { AiOutlineEye } from "react-icons/ai";
import { FaRegPaperPlane } from "react-icons/fa6";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { IHashtag } from "@/interfaces/IHashtag";
import type { IComment } from "@/interfaces/IPins";

interface PinModalProps {
  id: string;
  onClose: () => void;
  likesState?: {
    liked: boolean;
    likesCount: number;
  };
  setLikesState?: (newState: { liked: boolean; likesCount: number }) => void;
}

interface PinModalType {
  id: string;
  name: string;
  image: string;
  description?: string | null;
  likes: number;
  comment: number;
  views: number;
  created: string;
  hashtag: IHashtag[];
}

type ReportType = "spam" | "violence" | "sexual" | "hate" | "other";

const PinModal: React.FC<PinModalProps> = ({ 
  id, 
  onClose, 
  likesState: externalLikesState, 
  setLikesState: setExternalLikesState 
}) => {
  const [pin, setPin] = useState<PinModalType | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<IComment[]>([]);
  const [newComment, setNewComment] = useState("");

  // Estado local de likes
  const [localLikesState, setLocalLikesState] = useState({
    liked: false,
    likesCount: 0
  });

  const [showReportMenu, setShowReportMenu] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('spam');
  const [reason, setReason] = useState("");

  // ✅ Cargar pin y estado de like (SIN setExternalLikesState en dependencias)
  useEffect(() => {
    let cancelled = false;

    const fetchPin = async () => {
      setLoading(true);
      
      try {
        const data = await getPinById(id);
     
        if (cancelled) return;

        if (data) {
          setPin(data);
          setComments(data.comments || []);
          
          // Obtener estado de like
          try {
            const likeStatus = await fetchLikeStatus(id);
            
            if (cancelled) return;

            const newLikesState = {
              liked: likeStatus.liked,
              likesCount: likeStatus.likesCount || 0
            };

            setLocalLikesState(newLikesState);
            
            // ✅ Sincronizar con estado externo una sola vez
            if (setExternalLikesState) {
              setExternalLikesState(newLikesState);
            }
          } catch (error) {
            console.error("Error loading like status:", error);
          }
        } else {
          setPin(null);
          setComments([]);
        }
      } catch (error) {
        console.error("Error loading pin:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPin();

    // Cleanup para evitar actualizaciones en componente desmontado
    return () => {
      cancelled = true;
    };
  }, [id]); // ✅ Solo depende de 'id'

  // ✅ Manejar like correctamente
  const handleLike = async () => {
    if (!pin) return;
    
    try {
      await addLike(pin.id);
      
      // Toggle del estado de like
      const newLiked = !localLikesState.liked;
      const newCount = newLiked 
        ? localLikesState.likesCount + 1 
        : Math.max(localLikesState.likesCount - 1, 0);
      
      const newState = {
        liked: newLiked,
        likesCount: newCount
      };
      
      setLocalLikesState(newState);
      
      // Sincronizar con estado externo
      if (setExternalLikesState) {
        setExternalLikesState(newState);
      }
      
      // Actualizar el pin local
      setPin(prev => prev ? { ...prev, likes: newCount } : null);
      
    } catch (err) {
      const error = err as AxiosError;
      if (error.response?.status === 403) {
        toast.error("You have reached your daily like limit.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }
  };

  // ✅ Agregar comentario
  const handleAddComment = async () => {
    if (!pin || !newComment.trim()) return;

    try {
      const res = await addComment(pin.id, newComment);
      
      if (res && res.data) {
        setComments(prev => [...prev, res.data]);
        setNewComment("");
        toast.success("Comment added successfully");
        
        // Actualizar contador
        setPin(prev => prev ? { ...prev, comment: prev.comment + 1 } : null);
      }
    } catch (err) {
      const error = err as AxiosError;
      if (error.response?.status === 403) {
        toast.error("You have reached your daily comment limit.");
      } else {
        toast.error("Failed to add comment. Try again.");
      }
    }
  };

  const handleReport = async () => {
    if (!pin) return;
    try {
      await reportTarget("pin", pin.id, reportType, reason);
      toast.success("Report sent successfully");
      setShowReportMenu(false);
      setReason("");
    } catch (error) {
      toast.error("Error sending report");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg text-black">Loading...</div>
      </div>
    );
  }

  if (!pin) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg text-black">
          <p>Pin not found</p>
          <button onClick={onClose} className="mt-4 bg-gray-700 text-white px-4 py-2 rounded">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose} // ✅ Cerrar al hacer click en el fondo
    >
      <div 
        className="bg-gradient-to-r from-[#0E172B]/90 to-[#1B273B] rounded-lg 
                    flex flex-col md:flex-row w-full max-w-[1200px] h-[95%] 
                    shadow-xl shadow-slate-800/50 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()} // ✅ Prevenir cierre al hacer click dentro
      >
        
        <button
          onClick={onClose}
          className="absolute top-2 right-2 md:top-3 md:right-3 z-10 text-white hover:text-gray-300"
        >
          <IoClose size={28} />
        </button>

        {/* Imagen */}
        <div className="relative w-full md:w-1/2 h-64 md:h-auto flex-shrink-0">
          <Image
            src={pin.image}
            alt="Pin photo"
            fill
            className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
          />
        </div>

        {/* Contenido */}
        <div className="w-full md:w-1/2 p-4 flex flex-col text-white overflow-y-auto">
          <h3 className="font-[montserrat] text-lg mb-2">{pin.name}</h3>
          <p className="mb-4">{pin.description}</p>
          {pin.hashtag && pin.hashtag.length > 0 && (
          <div className="flex flex-wrap gap-2 my-3">
            {pin.hashtag.map(h => (
              <span
                key={h.id}
                className="bg-[#ffffff20] px-2 py-1 rounded-full text-xs text-gray-200"
              >
                #{h.tag}
              </span>
            ))}
          </div>
        )}

          {/* Comentarios */}
          <div className="flex-1 flex flex-col">
            <div className="w-full h-[500px] md:h-[620px] border border-gray-500 rounded-t-lg overflow-y-auto p-2 space-y-2">
              {comments.length === 0 ? (
                <p className="text-gray-400 text-sm">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-2">
                    {/* Avatar del usuario */}
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                      {comment.user?.avatar ? (
                        <Image
                          src={comment.user.avatar}
                          alt={comment.user.name || 'User'}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <span className="text-sm font-bold text-white">
                          {(comment.user?.name || 'A').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    {/* Nombre y comentario */}
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{comment.user?.name || 'Anonymous'}</p>
                      <p className="text-sm text-gray-300">{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Input de comentario */}
            <div className="w-full h-10 border border-gray-500 rounded-b-lg flex">
              <input
                className="bg-transparent text-white w-full px-2 outline-none"
                type="text"
                placeholder="Add comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              />
              <button
                onClick={handleAddComment}
                className="px-2 bg-blue-600 text-white rounded-br hover:bg-blue-700"
                disabled={!newComment.trim()}
              >
                <FaRegPaperPlane size={20}/>
              </button>
            </div>
          </div>

          {/* Likes, Views y Reporte */}
          <div className="flex items-center mt-4 space-x-4">
            <button 
              className="flex items-center hover:text-pink-500 transition"
              onClick={handleLike}
            >
              {localLikesState.liked ? (
                <GoHeartFill size={24} color="red" />
              ) : (
                <FiHeart size={24} />
              )}
              <span className="ml-1">{localLikesState.likesCount}</span>
            </button>
            
            <div className="flex items-center">
              <AiOutlineEye size={22} />
              <span className="ml-1">{pin.views}</span>
            </div>

            <button
              className="ml-auto text-sm bg-red-600 px-3 py-1 rounded hover:bg-red-700"
              onClick={() => setShowReportMenu(true)}
            >
              Report
            </button>
          </div>
        </div>
      </div>

      {/* Modal Reporte */}
      {showReportMenu && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 text-gray-200"
          onClick={() => setShowReportMenu(false)}
        >
          <div 
            className="bg-gradient-to-r from-[#0E172B]/90 to-[#1B273B] rounded-lg flex flex-col p-4 w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-3">Report Pin</h2>

            <label className="block mb-2 text-sm">Reason</label>
            <select
              className="w-full border px-2 py-1 rounded mb-3 bg-gray-800 text-white"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
            >
              <option value="spam">Spam</option>
              <option value="sexual">Inappropriate content</option>
              <option value="violence">Violence</option>
              <option value="hate">Hate speech</option>
              <option value="other">Other</option>
            </select>

            <label className="block mb-2 text-sm">Details (optional)</label>
            <textarea
              className="w-full border px-2 py-1 rounded mb-3 bg-gray-800 text-white"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain briefly..."
            />

            <div className="flex justify-end space-x-2">
              <button
                className="px-3 py-1 text-black font-semibold bg-gray-300 rounded-md hover:bg-gray-400"
                onClick={() => setShowReportMenu(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold"
                onClick={handleReport}
              >
                Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PinModal;