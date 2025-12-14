import { IHashtag } from "./IHashtag";
export interface IUploadPin {
  image: string;
  description: string;
  categoryId: string;
  hashtags?: string[];  // ✅ Array de strings, NO objetos
}