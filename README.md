# FilmSpace

A modern streaming platform for **movies**, **series**, and **anime** — built for **Web** and **Google TV**.

## Stack

- **Framework**: [Next.js 15](https://nextjs.org) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + [Aceternity UI](https://ui.aceternity.com)
- **Icons**: [Tabler Icons](https://tabler.io/icons)
- **Animation**: [Framer Motion](https://www.framer.com/motion)

## Features

- Movies, TV Series & Anime catalog
- Google TV optimized (10-foot UI, D-pad navigation)
- Responsive web experience
- Search & filter by genre, year, rating
- Dark-first design

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/          # Next.js App Router pages & layouts
├── components/
│   └── ui/       # Aceternity UI components
├── hooks/        # Custom React hooks
├── lib/          # Utilities (cn, api helpers)
└── types/        # TypeScript interfaces
```

## Target Platforms

| Platform   | Resolution  | Navigation   |
|------------|-------------|--------------|
| Web        | Responsive  | Mouse/touch  |
| Google TV  | 1920x1080   | D-pad remote |