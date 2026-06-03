import type { Media } from "@/types";

// Placeholder images — swap with TMDB when TMDB_READ_TOKEN is set
function p(seed: string) {
  return `https://picsum.photos/seed/${seed}/500/750`;
}
function b(seed: string) {
  return `https://picsum.photos/seed/${seed}/1920/1080`;
}

export const FEATURED: Media = {
  id: 1,
  title: "Dune: Part Two",
  type: "movie",
  poster: p("dune2"),
  backdrop: b("dune2bg"),
  overview:
    "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
  rating: 8.5,
  year: 2024,
  genres: ["Sci-Fi", "Adventure", "Drama"],
};

export const TRENDING: Media[] = [
  {
    id: 2, title: "Oppenheimer", type: "movie",
    poster: p("oppen"), backdrop: b("oppenbg"),
    overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
    rating: 8.3, year: 2023, genres: ["Drama", "History", "Thriller"],
  },
  {
    id: 3, title: "Interstellar", type: "movie",
    poster: p("interstellar"), backdrop: b("interstellarbg"),
    overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    rating: 8.7, year: 2014, genres: ["Sci-Fi", "Drama"],
  },
  {
    id: 4, title: "Blade Runner 2049", type: "movie",
    poster: p("blade49"), backdrop: b("blade49bg"),
    overview: "Officer K unearths a long-buried secret that has the potential to plunge what's left of society into chaos.",
    rating: 8.0, year: 2017, genres: ["Sci-Fi", "Thriller"],
  },
  {
    id: 5, title: "The Batman", type: "movie",
    poster: p("tbatman"), backdrop: b("tbatmanbg"),
    overview: "When the Riddler begins murdering key political figures in Gotham, Batman is forced to investigate the city's dark secrets.",
    rating: 7.8, year: 2022, genres: ["Action", "Crime"],
  },
  {
    id: 6, title: "Poor Things", type: "movie",
    poster: p("poorthings"), backdrop: b("poorthingsbg"),
    overview: "The incredible tale about the fantastical evolution of Bella Baxter, a young woman brought back to life by an unorthodox scientist.",
    rating: 8.0, year: 2023, genres: ["Comedy", "Drama", "Fantasy"],
  },
  {
    id: 7, title: "Past Lives", type: "movie",
    poster: p("pastlives"), backdrop: b("pastlivesbg"),
    overview: "Two childhood sweethearts separated when one emigrates from South Korea. Decades later, they reunite for one week in New York.",
    rating: 7.9, year: 2023, genres: ["Drama", "Romance"],
  },
  {
    id: 8, title: "Killers of the Flower Moon", type: "movie",
    poster: p("killers"), backdrop: b("killersbg"),
    overview: "Members of the Osage tribe are murdered under mysterious circumstances in the 1920s, sparking one of the first FBI investigations.",
    rating: 7.6, year: 2023, genres: ["Crime", "Drama", "History"],
  },
];

export const NEW_SERIES: Media[] = [
  {
    id: 9, title: "Shogun", type: "series",
    poster: p("shogun24"), backdrop: b("shogun24bg"),
    overview: "In feudal Japan, Lord Yoshii Toranaga fights for his survival as his enemies on the Council of Regents unite against him.",
    rating: 9.0, year: 2024, genres: ["Drama", "History", "War"],
  },
  {
    id: 10, title: "The Bear", type: "series",
    poster: p("thebear22"), backdrop: b("thebear22bg"),
    overview: "A young chef from the fine dining world returns to Chicago to run his family's chaotic sandwich shop.",
    rating: 9.0, year: 2022, genres: ["Drama", "Comedy"],
  },
  {
    id: 11, title: "Succession", type: "series",
    poster: p("succession18"), backdrop: b("succession18bg"),
    overview: "The Roy family, which controls one of the biggest media conglomerates in the world, is fighting over who will take over the company.",
    rating: 8.8, year: 2018, genres: ["Drama"],
  },
  {
    id: 12, title: "House of the Dragon", type: "series",
    poster: p("hotd22"), backdrop: b("hotd22bg"),
    overview: "An internal succession war within House Targaryen at the height of its power, set 200 years before Game of Thrones.",
    rating: 8.4, year: 2022, genres: ["Action", "Adventure", "Drama"],
  },
  {
    id: 13, title: "Severance", type: "series",
    poster: p("severance22"), backdrop: b("severance22bg"),
    overview: "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.",
    rating: 8.7, year: 2022, genres: ["Drama", "Sci-Fi", "Thriller"],
  },
  {
    id: 14, title: "The Last of Us", type: "series",
    poster: p("tlou23"), backdrop: b("tlou23bg"),
    overview: "After a global catastrophe, a hardened survivor takes charge of a 14-year-old girl who may be humanity's last hope.",
    rating: 8.8, year: 2023, genres: ["Drama", "Action", "Horror"],
  },
];

export const ANIME_PICKS: Media[] = [
  {
    id: 15, title: "Attack on Titan: Final Season", type: "anime",
    poster: p("aot23"), backdrop: b("aot23bg"),
    overview: "Eren Yeager, now with the power of the Founding Titan, embarks on the ultimate mission to save his people.",
    rating: 9.1, year: 2023, genres: ["Action", "Fantasy", "Drama"],
  },
  {
    id: 16, title: "Jujutsu Kaisen", type: "anime",
    poster: p("jjk20"), backdrop: b("jjk20bg"),
    overview: "Yuji Itadori joins a secret organization of Jujutsu Sorcerers in order to kill a powerful Curse named Ryomen Sukuna.",
    rating: 8.6, year: 2020, genres: ["Action", "Fantasy"],
  },
  {
    id: 17, title: "Demon Slayer", type: "anime",
    poster: p("kimetsu19"), backdrop: b("kimetsu19bg"),
    overview: "Tanjiro sets out to become a demon slayer after his family is attacked and his sister is turned into a demon.",
    rating: 8.7, year: 2019, genres: ["Action", "Fantasy"],
  },
  {
    id: 18, title: "Frieren: Beyond Journey's End", type: "anime",
    poster: p("frieren23"), backdrop: b("frieren23bg"),
    overview: "The adventure is over but life goes on for an elf mage just beginning to learn what truly living means.",
    rating: 9.0, year: 2023, genres: ["Adventure", "Fantasy", "Drama"],
  },
  {
    id: 19, title: "Chainsaw Man", type: "anime",
    poster: p("csm22"), backdrop: b("csm22bg"),
    overview: "Denji dreams of a happy, peaceful life — a far cry from his reality as a devil hunter bonded to a chainsaw devil.",
    rating: 8.4, year: 2022, genres: ["Action", "Fantasy", "Horror"],
  },
  {
    id: 20, title: "Vinland Saga", type: "anime",
    poster: p("vinland19"), backdrop: b("vinland19bg"),
    overview: "Thorfinn pursues a journey with his father's killer in order to take revenge and end his life in a duel as equals.",
    rating: 8.8, year: 2019, genres: ["Action", "Adventure", "Drama"],
  },
];
