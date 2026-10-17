import { Guitar, Piano } from "lucide-react";
import { Book, Instrument, Song } from "./types";

// Vaste lijst: nieuwe instrumenten worden hier in de code toegevoegd
export const INSTRUMENTS: Instrument[] = [
  { id: "gitaar", name: "Gitaar", icon: Guitar, themeColor: "#7c3aed", confettiColors: ["#8b5cf6", "#d946ef", "#f472b6"],
    wheelColors: ["#7c3aed", "#f472b6", "#fbbf24", "#a21caf", "#fb923c", "#6366f1"] },
  { id: "piano", name: "Piano", icon: Piano, themeColor: "#047857", confettiColors: ["#10b981", "#84cc16", "#14b8a6"],
    wheelColors: ["#059669", "#fde047", "#0ea5e9", "#84cc16", "#0f766e", "#fbbf24"] },
];

export const INITIAL_BOOKS: Book[] = [
  { id: "suzuki-1", instrumentId: "gitaar", title: "Suzuki boek 1" },
  { id: "suzuki-2", instrumentId: "gitaar", title: "Suzuki boek 2" },
  { id: "suzuki-3", instrumentId: "gitaar", title: "Suzuki boek 3" },
  { id: "andere", instrumentId: "gitaar", title: "Andere" },
  { id: "piano-1", instrumentId: "piano", title: "Piano boek 1" },
];

export const INITIAL_SONGS: Song[] = [
  // Suzuki boek 1
  { id: "s1-1", title: "Twinkel", bookId: "suzuki-1" },
  { id: "s1-2", title: "Ooievaar Lepelaar", bookId: "suzuki-1" },
  { id: "s1-3", title: "Tante Roosje", bookId: "suzuki-1" },
  { id: "s1-4", title: "Reintje Vos", bookId: "suzuki-1" },
  { id: "s1-5", title: "Meilied", bookId: "suzuki-1" },
  { id: "s1-6", title: "Kabouterlied", bookId: "suzuki-1" },
  { id: "s1-7", title: "Mama Muis", bookId: "suzuki-1" },
  { id: "s1-8", title: "Rigadoon", bookId: "suzuki-1" },
  { id: "s1-9", title: "Broeder Jacob", bookId: "suzuki-1" },
  { id: "s1-10", title: "Hoog van de Maan", bookId: "suzuki-1" },
  { id: "s1-11", title: "Bijtje Zoem", bookId: "suzuki-1" },
  { id: "s1-12", title: "Tanz 2", bookId: "suzuki-1" },
  { id: "s1-13", title: "Steady Hands", bookId: "suzuki-1" },
  { id: "s1-14", title: "Meadow Minuet", bookId: "suzuki-1" },
  
  // Suzuki boek 2
  { id: "s2-1", title: "Roodborstje", bookId: "suzuki-2" },
  { id: "s2-2", title: "Allegro", bookId: "suzuki-2" },
  { id: "s2-3", title: "A Toye", bookId: "suzuki-2" },
  { id: "s2-4", title: "Andante (slakje)", bookId: "suzuki-2" },
  { id: "s2-5", title: "Andante", bookId: "suzuki-2" },
  { id: "s2-6", title: "Allegretto", bookId: "suzuki-2" },
  { id: "s2-7", title: "Corrente", bookId: "suzuki-2" },
  { id: "s2-8", title: "Andantino", bookId: "suzuki-2" },
  { id: "s2-9", title: "Waltz", bookId: "suzuki-2" },
  { id: "s2-10", title: "Danza", bookId: "suzuki-2" },

  // Suzuki boek 3
  { id: "s3-1", title: "Nonesuch", bookId: "suzuki-3" },
  { id: "s3-2", title: "Greensleeves", bookId: "suzuki-3" },
  { id: "s3-3", title: "Packington's Pound", bookId: "suzuki-3" },
  { id: "s3-4", title: "Ghiribizzo", bookId: "suzuki-3" },
  { id: "s3-5", title: "Waltz", bookId: "suzuki-3" },
  { id: "s3-6", title: "Andantino", bookId: "suzuki-3" },
  { id: "s3-7", title: "Calliope", bookId: "suzuki-3" },
  { id: "s3-8", title: "Etude (8)", bookId: "suzuki-3" },
  { id: "s3-9", title: "Etude (9)", bookId: "suzuki-3" },
  { id: "s3-10", title: "Arietta", bookId: "suzuki-3" },
  { id: "s3-11", title: "Celeste y Blanco", bookId: "suzuki-3" },

  // Andere
  { id: "sa-1", title: "Onder de zee (gitaarkamp)", bookId: "andere" },
];
