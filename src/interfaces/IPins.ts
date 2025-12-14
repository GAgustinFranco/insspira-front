// src/interfaces/IPins.ts
export interface IHashtag {
  id: string;
  tag: string;
}

export interface IPins {
  id: string;
  image?: string | null;
  description?: string | null;
  views: number;
  user: string;
  likes?: number;
  likesCount: number;
  liked: boolean;
  commentsCount: number;
  comment?: number;
  hashtag?: IHashtag[];
}

export interface IComment {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username?: string | null;
    avatar?: string | null;
  };
}