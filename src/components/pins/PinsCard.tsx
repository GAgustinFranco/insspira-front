import { IPins } from "@/interfaces/IPins";
import { FaCommentDots } from "react-icons/fa";
import SafeImage from "../others/SafeImage";
import { addLike } from "@/services/pins.services";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import { FiHeart } from "react-icons/fi";
import { GoHeartFill } from "react-icons/go";
import { useState } from "react";

interface PinsCardProps {
  pin: IPins;
  likesState: {
    liked: boolean;
    likesCount: number;
  };
  setLikesState: (newState: { likesCount: number, liked: boolean }) => void;
  onOpenModal: () => void;
}

const PinsCard: React.FC<PinsCardProps> = ({ 
  pin, 
  likesState, 
  setLikesState, 
  onOpenModal 
}) => {
  const [isLiking, setIsLiking] = useState(false);
  const comments = typeof pin.commentsCount === "number" ? pin.commentsCount : 0;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // ✅ Prevenir clicks múltiples
    if (isLiking) return;
    
    setIsLiking(true);
    
    // Guardar estado previo para rollback en caso de error
    const previousState = { ...likesState };
    
    // Actualización optimista
    const newLiked = !likesState.liked;
    const newCount = newLiked
      ? likesState.likesCount + 1
      : Math.max(likesState.likesCount - 1, 0);
    
    setLikesState({
      liked: newLiked,
      likesCount: newCount,
    });

    try {
      //  Esperar respuesta del backend
      await addLike(pin.id);
    } catch (err) {
      // Rollback en caso de error
      setLikesState(previousState);
      
      const error = err as AxiosError;
      if (error.response?.status === 403) {
        toast.error("Has alcanzado tu límite diario de likes.");
      } else {
        toast.error("Algo salió mal. Intenta de nuevo.");
      }
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div
      className="w-full sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px] h-auto mt-6 flex flex-col cursor-pointer"
      onClick={onOpenModal}
    >
      <SafeImage
        width={500}
        height={500}
        src={pin.image}
        alt={pin.description ?? ""}
        className="w-full h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] object-cover opacity-80 rounded-t-xl hover:opacity-100 hover:shadow-xl hover:shadow-gray-500 transition-all"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
      />

      <div className="flex flex-col text-xs md:text-sm bg-[var(--color-rosa)] p-2 rounded-b-xl mb-6">
        <div className="flex items-center mb-2">
          <p className="mr-2">{pin.user}</p>

          {/* Likes */}
          <div className="flex items-center mr-4">
            <button 
              onClick={handleLike}
              disabled={isLiking}
              className={`transition-opacity ${isLiking ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
            >
              {likesState.liked ? (
                <GoHeartFill size={20} color="red" />
              ) : (
                <FiHeart size={20} />
              )}
            </button>
            <span className="ml-1">{likesState.likesCount ?? 0}</span>
          </div>

          {/* Comments */}
          <div className="flex items-center">
            <FaCommentDots size={18} className="md:size-[20px]" />
            <span className="ml-1">{comments}</span>
          </div>
        </div>

        <span className="font-semibold">{pin.description ?? ""}</span>
        {pin.hashtag && pin.hashtag.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {pin.hashtag.map((h) => (
              <span
                key={h.id}
                className="bg-[#ffffff20] px-2 py-1 rounded-full text-xs text-white"
              >
                #{h.tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PinsCard;