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
  const [expandedBooks, setExpandedBooks] = React.useState<Set<string>>(new Set([books[0]?.id]));

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
          <div key={book.id} className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="flex items-center p-4 hover:bg-zinc-50 transition-colors cursor-pointer">
              <button 
                onClick={() => toggleBookExpand(book.id)}
                className="p-1 hover:bg-zinc-200 rounded mr-2"
              >
                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>
              
              <div 
                className="flex-1 flex items-center"
                onClick={() => toggleBookExpand(book.id)}
              >
                <BookIcon size={18} className="text-indigo-500 mr-3" />
                <span className="font-semibold text-zinc-800">{book.title}</span>
                <span className="ml-2 text-xs text-zinc-400">({bookSongs.length} liedjes)</span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBook(book.id, !isFull);
                }}
                className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all
                  ${isFull ? 'bg-indigo-600 border-indigo-600 text-white' : 
                    isPartial ? 'bg-indigo-100 border-indigo-600 text-indigo-600' : 
                    'border-zinc-300 bg-white'}`}
              >
                {isFull && <Check size={14} strokeWidth={3} />}
                {isPartial && <div className="w-2 h-0.5 bg-indigo-600 rounded-full" />}
              </button>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-zinc-50/50"
                >
                  <div className="p-2 pl-12 space-y-1">
                    {bookSongs.map((song) => {
                      const isSelected = selectedSongIds.includes(song.id);
                      return (
                        <div 
                          key={song.id}
                          onClick={() => onToggleSong(song.id)}
                          className="flex items-center p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all cursor-pointer group"
                        >
                          <Music size={14} className={`mr-3 ${isSelected ? 'text-indigo-500' : 'text-zinc-400'}`} />
                          <span className={`flex-1 text-sm ${isSelected ? 'text-zinc-900 font-medium' : 'text-zinc-500'}`}>
                            {song.title}
                          </span>
                          <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center
                            ${isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-zinc-300 group-hover:border-zinc-400'}`}>
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
