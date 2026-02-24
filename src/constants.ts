import { Book, Song } from "./types";

export const INITIAL_BOOKS: Book[] = [
  { id: "suzuki-1", title: "Suzuki boek 1" },
  { id: "suzuki-2", title: "Suzuki boek 2" },
  { id: "suzuki-3", title: "Suzuki boek 3" },
  { id: "andere", title: "Andere" },
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

  // Andere
  { id: "sa-1", title: "Onder de zee (gitaarkamp)", bookId: "andere" },
];
