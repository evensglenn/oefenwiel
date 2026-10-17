import React from 'react';
import { Book, Song } from '../types';
import { Check, ChevronDown, ChevronRight, Music, Book as BookIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SongSelectorProps {
  books: Book[];
  songs: Song[];
  selectedSongIds: string[];
  onToggleSong: (songId: string) => void;
  onToggleBook: (bookId: string, selectAll: boolean) => void;
}

export const SongSelector: React.FC<SongSelectorProps> = ({
  books,
  songs,
  selectedSongIds,
  onToggleSong,
  onToggleBook,
}) => {
  const [expandedBooks, setExpandedBooks] = React.useState<Set<string>>(new Set());

  const toggleBookExpand = (bookId: string) => {
    const newExpanded = new Set(expandedBooks);
    if (newExpanded.has(bookId)) {
      newExpanded.delete(bookId);
    } else {
      newExpanded.add(bookId);
    }
    setExpandedBooks(newExpanded);
  };

  const isBookFullySelected = (bookId: string) => {
    const bookSongs = songs.filter(s => s.bookId === bookId);
    return bookSongs.every(s => selectedSongIds.includes(s.id));
  };

  const isBookPartiallySelected = (bookId: string) => {
    const bookSongs = songs.filter(s => s.bookId === bookId);
    const selectedCount = bookSongs.filter(s => selectedSongIds.includes(s.id)).length;
    return selectedCount > 0 && selectedCount < bookSongs.length;
  };

  return (
    <div className="space-y-4">
      {books.map((book) => {
        const bookSongs = songs.filter(s => s.bookId === book.id);
        const isExpanded = expandedBooks.has(book.id);
        const isFull = isBookFullySelected(book.id);
        const isPartial = isBookPartiallySelected(book.id);

        return (
          <div key={book.id} className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
            <div className="flex items-center p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
              <button 
                onClick={() => toggleBookExpand(book.id)}
                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded mr-2"
              >
                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>
              
              <div 
                className="flex-1 flex items-center"
                onClick={() => toggleBookExpand(book.id)}
              >
                <BookIcon size={18} className="text-accent-500 mr-3" />
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{book.title}</span>
                <span className="ml-2 text-xs text-zinc-400">({bookSongs.length} liedjes)</span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBook(book.id, !isFull);
                }}
                className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all
                  ${isFull ? 'bg-accent-600 border-accent-600 text-white' : 
                    isPartial ? 'bg-accent-100 border-accent-600 text-accent-600 dark:bg-accent-900/40 dark:border-accent-400' : 
                    'border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800'}`}
              >
                {isFull && <Check size={14} strokeWidth={3} />}
                {isPartial && <div className="w-2 h-0.5 bg-accent-600 dark:bg-accent-400 rounded-full" />}
              </button>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/40"
                >
                  <div className="p-2 pl-8 sm:pl-12 space-y-1">
                    {bookSongs.map((song) => {
                      const isSelected = selectedSongIds.includes(song.id);
                      return (
                        <div 
                          key={song.id}
                          onClick={() => onToggleSong(song.id)}
                          className="flex items-center p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm transition-all cursor-pointer group"
                        >
                          <Music size={14} className={`mr-3 ${isSelected ? 'text-accent-500' : 'text-zinc-400'}`} />
                          <span className={`flex-1 text-sm ${isSelected ? 'text-zinc-900 dark:text-zinc-100 font-medium' : 'text-zinc-500 dark:text-zinc-400'}`}>
                            {song.title}
                          </span>
                          <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center
                            ${isSelected ? 'bg-accent-500 border-accent-500 text-white' : 'border-zinc-300 group-hover:border-zinc-400 dark:border-zinc-600 dark:group-hover:border-zinc-500'}`}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
