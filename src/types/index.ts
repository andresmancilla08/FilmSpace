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
