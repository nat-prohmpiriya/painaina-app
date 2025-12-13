export interface UnsplashUser {
  id: string;
  username: string;
  name: string;
  portfolioUrl?: string;
  bio?: string;
  profileImage?: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface UnsplashPhoto {
  id: string;
  description?: string;
  altDescription?: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  width: number;
  height: number;
  color: string;
  user: UnsplashUser;
  links: {
    self: string;
    html: string;
    download: string;
    downloadLocation: string;
  };
  likes: number;
  downloads?: number;
  createdAt: string;
}

export interface SearchPhotosQuery {
  query: string;
  page?: number;
  perPage?: number;
  orderBy?: "latest" | "relevant" | "popular";
  orientation?: "landscape" | "portrait" | "squarish";
  color?: string;
}

export interface SearchPhotosResponse {
  total: number;
  totalPages: number;
  results: UnsplashPhoto[];
}

export interface GetRandomPhotosQuery {
  query?: string;
  count?: number;
  orientation?: "landscape" | "portrait" | "squarish";
}

export interface TriggerDownloadRequest {
  downloadLocation: string;
}
