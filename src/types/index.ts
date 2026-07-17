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

export type TVTab = "live" | "247" | "radio" | "movies" | "series";

/** live = canal lineal; movie = VOD; series = ficha de serie (episodios aparte) */
export type IPTVKind = "live" | "movie" | "series";

export interface IPTVChannel {
  name: string;
  logo: string;
  group: string;
  url: string;
  category: string; // clave canónica traducible (live.cat.*) o nombre de categoría Xtream
  quality?: string; // "1080P", "720P", "4K"…
  kind?: IPTVKind;
  /** ID Xtream de la serie; al reproducir se pide get_series_info */
  seriesId?: string;
  plot?: string;
  year?: string;
  rating?: string;
}

export interface IPTVCategory {
  id: string;
  name: string;
}

export interface IPTVEpisode {
  id: string;
  title: string;
  season: number;
  episode: number;
  url: string;
  plot?: string;
  duration?: string;
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
