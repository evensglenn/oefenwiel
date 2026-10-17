import type { LucideIcon } from 'lucide-react';

export interface Instrument {
  id: string;
  name: string;
  icon: LucideIcon;
}

export interface Song {
  id: string;
  title: string;
  bookId: string;
}

export interface Book {
  id: string;
  title: string;
  instrumentId: string;
}

export interface Profile {
  id: string;
  name: string;
  instrumentIds: string[];
  selectedSongIds: string[];
}
