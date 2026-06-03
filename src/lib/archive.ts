export interface ArchiveMedia {
  archiveId: string;
  title: string;
  overview: string;
  year: number;
  genres: string[];
  poster: string;
  rating: number;
  downloads: number;
}

export interface ArchiveDetail extends ArchiveMedia {
  director: string | null;
  creator: string | null;
  videoUrl: string;
  duration: string | null;
}

const SEARCH = "https://archive.org/advancedsearch.php";
const META   = "https://archive.org/metadata";

function posterUrl(id: string) {
  return `https://archive.org/services/img/${id}`;
}

// ── Catalog ───────────────────────────────────────────────────

export async function getClassicFilms(rows = 10): Promise<ArchiveMedia[]> {
  const params = new URLSearchParams({
    q: [
      "mediatype:movies",
      "subject:(\"feature film\" OR \"feature films\" OR \"classic film\")",
      "language:(English OR \"en\")",
      "-collection:movie_trailers",
      "-collection:silent_films",
      "year:[1920 TO 1975]",
    ].join(" AND "),
    "fl[]": "identifier,title,description,year,subject,avg_rating,downloads",
    sort: "downloads desc",
    rows: String(rows + 4), // over-fetch, then filter
    page: "1",
    output: "json",
  });

  const res = await fetch(`${SEARCH}?${params}`, { next: { revalidate: 7200 } });
  if (!res.ok) throw new Error(`Archive search ${res.status}`);
  const json = await res.json();

  const docs: Record<string, unknown>[] = json?.response?.docs ?? [];

  return docs
    .filter((d) => d.identifier && d.title)
    .slice(0, rows)
    .map((d) => ({
      archiveId: d.identifier as string,
      title: Array.isArray(d.title) ? (d.title as string[])[0] : (d.title as string),
      overview: Array.isArray(d.description)
        ? (d.description as string[])[0].replace(/<[^>]*>/g, "").trim()
        : typeof d.description === "string"
        ? (d.description as string).replace(/<[^>]*>/g, "").trim()
        : "",
      year: parseInt(String(d.year ?? "0")) || 0,
      genres: Array.isArray(d.subject)
        ? (d.subject as string[]).slice(0, 3)
        : d.subject
        ? [d.subject as string]
        : ["Classic"],
      poster: posterUrl(d.identifier as string),
      rating: parseFloat(String(d.avg_rating ?? "0")) || 0,
      downloads: parseInt(String(d.downloads ?? "0")) || 0,
    }));
}

// ── Detail + video URL ────────────────────────────────────────

interface ArchiveFile {
  name: string;
  format: string;
  size?: string;
  length?: string;
}

interface ArchiveMeta {
  title?: string | string[];
  description?: string | string[];
  year?: string | string[];
  subject?: string | string[];
  creator?: string | string[];
  director?: string | string[];
  runtime?: string | string[];
}

function pickStr(v: string | string[] | undefined): string | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] : v;
}

function pickBestVideo(files: ArchiveFile[], identifier: string): string | null {
  // Prefer h.264 MP4, then any MP4, then ogg
  const mp4 = files
    .filter((f) => f.name.endsWith(".mp4") && !f.name.includes("_thumb"))
    .sort((a, b) => {
      // Prefer files without "512kb" or "_small" — they're lower quality
      const aScore = /512kb|_small|_lo/i.test(a.name) ? 0 : 1;
      const bScore = /512kb|_small|_lo/i.test(b.name) ? 0 : 1;
      return bScore - aScore;
    })[0];

  if (mp4) return `https://archive.org/download/${identifier}/${mp4.name}`;

  const ogv = files.find((f) => f.name.endsWith(".ogv") || f.name.endsWith(".ogg"));
  if (ogv) return `https://archive.org/download/${identifier}/${ogv.name}`;

  return null;
}

export async function getArchiveDetail(identifier: string): Promise<ArchiveDetail | null> {
  try {
    const res = await fetch(`${META}/${identifier}`, { next: { revalidate: 7200 } });
    if (!res.ok) return null;
    const data = await res.json();

    const meta: ArchiveMeta = data.metadata ?? {};
    const files: ArchiveFile[] = data.files ?? [];

    const videoUrl = pickBestVideo(files, identifier);
    if (!videoUrl) return null;

    return {
      archiveId: identifier,
      title: pickStr(meta.title) ?? identifier,
      overview: (pickStr(meta.description) ?? "").replace(/<[^>]*>/g, "").trim(),
      year: parseInt(pickStr(meta.year) ?? "0") || 0,
      genres: Array.isArray(meta.subject)
        ? meta.subject.slice(0, 3)
        : meta.subject
        ? [meta.subject]
        : ["Classic"],
      poster: posterUrl(identifier),
      rating: 0,
      downloads: 0,
      director: pickStr(meta.director),
      creator: pickStr(meta.creator),
      videoUrl,
      duration: pickStr(meta.runtime),
    };
  } catch {
    return null;
  }
}
