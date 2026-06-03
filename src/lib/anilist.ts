import type { Media, MediaDetail, CastMember } from "@/types";

const URL = "https://graphql.anilist.co";

// ── GraphQL helpers ───────────────────────────────────────────

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`AniList ${res.status}`);
  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(errors[0].message);
  return data as T;
}

// ── Raw types ─────────────────────────────────────────────────

interface ALTitle { english: string | null; romaji: string }
interface ALDate  { year: number | null }
interface ALCover { large: string; extraLarge?: string | null }

interface ALMedia {
  id: number;
  title: ALTitle;
  description: string | null;
  coverImage: ALCover;
  bannerImage: string | null;
  averageScore: number | null;
  startDate: ALDate;
  genres: string[];
  episodes: number | null;
  season: string | null;
  format: string | null;
}

interface ALCharacterEdge {
  role: string;
  node: { id: number; name: { full: string }; image: { medium: string | null } };
  voiceActors: { id: number; name: { full: string }; image: { medium: string | null } }[];
}

interface ALRelationNode {
  id: number;
  title: ALTitle;
  coverImage: ALCover;
  bannerImage: string | null;
  averageScore: number | null;
  startDate: ALDate;
  genres: string[];
  description: string | null;
  type: string;
}

interface ALDetail extends ALMedia {
  studios: { nodes: { name: string }[] };
  characters: { edges: ALCharacterEdge[] };
  relations: { edges: { relationType: string; node: ALRelationNode }[] };
  trailer: { id: string; site: string } | null;
}

// ── Mapping helpers ───────────────────────────────────────────

function title(t: ALTitle) {
  return (t.english && t.english.trim()) || t.romaji;
}

function toMedia(item: ALMedia): Media {
  return {
    id: item.id,
    title: title(item.title),
    type: "anime",
    poster: item.coverImage.extraLarge || item.coverImage.large,
    backdrop: item.bannerImage || item.coverImage.extraLarge || item.coverImage.large,
    overview: item.description?.replace(/<[^>]*>/g, "").trim() ?? "",
    rating: item.averageScore != null ? Math.round(item.averageScore) / 10 : 0,
    year: item.startDate.year ?? new Date().getFullYear(),
    genres: item.genres.slice(0, 3),
  };
}

function toDetail(item: ALDetail): MediaDetail {
  const cast: CastMember[] = item.characters.edges.flatMap((edge) => {
    const va = edge.voiceActors[0];
    if (!va) return [];
    return [{
      id: va.id,
      name: va.name.full,
      character: edge.node.name.full,
      profile: va.image.medium ?? null,
    }];
  });

  const similar: Media[] = item.relations.edges
    .filter((e) => e.node.type === "ANIME" && ["SEQUEL", "PREQUEL", "SIDE_STORY", "ALTERNATIVE"].includes(e.relationType))
    .slice(0, 6)
    .map((e) => ({
      id: e.node.id,
      title: title(e.node.title),
      type: "anime" as const,
      poster: e.node.coverImage.extraLarge || e.node.coverImage.large,
      backdrop: e.node.bannerImage || e.node.coverImage.large,
      overview: e.node.description?.replace(/<[^>]*>/g, "").trim() ?? "",
      rating: e.node.averageScore != null ? Math.round(e.node.averageScore) / 10 : 0,
      year: e.node.startDate.year ?? 0,
      genres: e.node.genres.slice(0, 3),
    }));

  const trailer =
    item.trailer?.site === "youtube" || item.trailer?.site === "YouTube"
      ? item.trailer.id
      : null;

  const episodeCount = item.episodes ?? undefined;
  const runtime = item.format === "MOVIE" ? undefined : undefined;

  return {
    ...toMedia(item),
    tagline: item.studios.nodes[0] ? `Studio: ${item.studios.nodes[0].name}` : undefined,
    runtime,
    episodes: episodeCount,
    cast,
    trailer,
    similar,
  };
}

// ── Catalog ───────────────────────────────────────────────────

const TRENDING_QUERY = `
  query {
    Page(perPage: 10) {
      media(sort: TRENDING_DESC, type: ANIME, isAdult: false, status_not: NOT_YET_RELEASED) {
        id title { english romaji }
        description(asHtml: false)
        coverImage { large extraLarge }
        bannerImage averageScore
        startDate { year }
        genres episodes season format
      }
    }
  }
`;

export async function getPopularAnime(): Promise<Media[]> {
  const data = await gql<{ Page: { media: ALMedia[] } }>(TRENDING_QUERY);
  return data.Page.media.map(toMedia);
}

// ── Detail ────────────────────────────────────────────────────

const DETAIL_QUERY = `
  query($id: Int) {
    Media(id: $id, type: ANIME) {
      id title { english romaji }
      description(asHtml: false)
      coverImage { large extraLarge }
      bannerImage averageScore
      startDate { year }
      genres episodes season format
      studios(isMain: true) { nodes { name } }
      characters(sort: [ROLE, RELEVANCE], perPage: 8) {
        edges {
          role
          node { id name { full } image { medium } }
          voiceActors(language: JAPANESE, sort: RELEVANCE) {
            id name { full } image { medium }
          }
        }
      }
      relations {
        edges {
          relationType
          node {
            id title { english romaji }
            coverImage { large extraLarge }
            bannerImage averageScore
            startDate { year } genres
            description(asHtml: false)
            type
          }
        }
      }
      trailer { id site }
    }
  }
`;

export async function getAnimeDetail(id: number): Promise<MediaDetail> {
  const data = await gql<{ Media: ALDetail }>(DETAIL_QUERY, { id });
  return toDetail(data.Media);
}
