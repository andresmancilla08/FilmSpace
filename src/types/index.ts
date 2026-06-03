export type ContentType = "movie" | "series" | "anime";

export interface Media {
  id: number;
  title: string;
  type: ContentType;
  poster: string;
  backdrop: string;
  overview: string;
  rating: number;
  year: number;
  genres: string[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile: string | null;
}

export interface MediaDetail extends Media {
  tagline?: string;
  runtime?: number;
  seasons?: number;
  episodes?: number;
  cast: CastMember[];
  trailer: string | null;
  similar: Media[];
}
