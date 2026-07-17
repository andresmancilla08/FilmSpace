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

export type TVTab = "live" | "247";

export interface IPTVChannel {
  name: string;
  logo: string;
  group: string;
  url: string;
  category: string; // clave canónica traducible (live.cat.*)
  quality?: string; // "1080P", "720P", "4K"…
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
