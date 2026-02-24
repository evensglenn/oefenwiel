export interface Song {
  id: string;
  title: string;
  bookId: string;
}

export interface Book {
  id: string;
  title: string;
}

export interface Profile {
  id: string;
  name: string;
  selectedSongIds: string[];
}
