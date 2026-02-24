import React, { useState, useEffect, useMemo } from 'react';
import { Wheel } from './components/Wheel';
import { SongSelector } from './components/SongSelector';
import { INITIAL_BOOKS, INITIAL_SONGS } from './constants';
import { Profile, Book, Song } from './types';
import { Users, Settings, Music, Trophy, Plus, Trash2, Edit2, Save, X, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

const PROFILES_KEY = 'guitar_practice_profiles_v6';
const BOOKS_KEY = 'guitar_practice_books_v6';
const SONGS_KEY = 'guitar_practice_songs_v6';

export default function App() {
  // Data State
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem(BOOKS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_BOOKS;
  });

  const [songs, setSongs] = useState<Song[]>(() => {
    const saved = localStorage.getItem(SONGS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_SONGS;
  });

  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem(PROFILES_KEY);
    if (saved) return JSON.parse(saved);
    return [
      { id: 'kind-1', name: 'Seppe', selectedSongIds: INITIAL_SONGS.map(s => s.id) },
      { id: 'kind-2', name: 'Rune', selectedSongIds: INITIAL_SONGS.map(s => s.id) },
    ];
  });
  
  const [activeProfileId, setActiveProfileId] = useState<string>(profiles[0].id);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'profiles' | 'data'>('profiles');

  // Editing State
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newSongTitle, setNewSongTitle] = useState('');
  const [selectedBookForNewSong, setSelectedBookForNewSong] = useState<string>(books[0]?.id || '');

  // Persistence
  useEffect(() => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem(SONGS_KEY, JSON.stringify(songs));
  }, [songs]);

  const activeProfile = useMemo(() => 
    profiles.find(p => p.id === activeProfileId) || profiles[0],
  [profiles, activeProfileId]);

  const wheelItems = useMemo(() => {
    return songs
      .filter(s => activeProfile.selectedSongIds.includes(s.id))
      .map(s => s.title);
  }, [activeProfile, songs]);

  // Handlers
  const handleToggleSong = (songId: string) => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== activeProfileId) return p;
      const newIds = p.selectedSongIds.includes(songId)
        ? p.selectedSongIds.filter(id => id !== songId)
        : [...p.selectedSongIds, songId];
      return { ...p, selectedSongIds: newIds };
    }));
  };

  const handleToggleBook = (bookId: string, selectAll: boolean) => {
    const bookSongIds = songs.filter(s => s.bookId === bookId).map(s => s.id);
    setProfiles(prev => prev.map(p => {
      if (p.id !== activeProfileId) return p;
      let newIds;
      if (selectAll) {
        newIds = Array.from(new Set([...p.selectedSongIds, ...bookSongIds]));
      } else {
        newIds = p.selectedSongIds.filter(id => !bookSongIds.includes(id));
      }
      return { ...p, selectedSongIds: newIds };
    }));
  };

  const handleWheelFinish = (item: string) => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#a855f7', '#ec4899']
    });
  };

  const updateProfileName = (id: string, name: string) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  };

  // Book Management
  const addBook = () => {
    if (!newBookTitle.trim()) return;
    const newBook: Book = { id: `book-${Date.now()}`, title: newBookTitle };
    setBooks([...books, newBook]);
    setNewBookTitle('');
    if (!selectedBookForNewSong) setSelectedBookForNewSong(newBook.id);
  };

  const deleteBook = (id: string) => {
    setBooks(books.filter(b => b.id !== id));
    setSongs(songs.filter(s => s.bookId !== id));
    // Clean up profiles
    const bookSongIds = songs.filter(s => s.bookId === id).map(s => s.id);
    setProfiles(profiles.map(p => ({
      ...p,
      selectedSongIds: p.selectedSongIds.filter(sid => !bookSongIds.includes(sid))
    })));
  };

  const updateBookTitle = (id: string, title: string) => {
    setBooks(books.map(b => b.id === id ? { ...b, title } : b));
    setEditingBookId(null);
  };

  // Song Management
  const addSong = () => {
    if (!newSongTitle.trim() || !selectedBookForNewSong) return;
    const newSong: Song = { id: `song-${Date.now()}`, title: newSongTitle, bookId: selectedBookForNewSong };
    setSongs([...songs, newSong]);
    setNewSongTitle('');
    // Auto-select for all profiles
    setProfiles(profiles.map(p => ({
      ...p,
      selectedSongIds: [...p.selectedSongIds, newSong.id]
    })));
  };

  const deleteSong = (id: string) => {
    setSongs(songs.filter(s => s.id !== id));
    setProfiles(profiles.map(p => ({
      ...p,
      selectedSongIds: p.selectedSongIds.filter(sid => sid !== id)
    })));
  };

  const updateSongTitle = (id: string, title: string) => {
    setSongs(songs.map(s => s.id === id ? { ...s, title } : s));
    setEditingSongId(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Music size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Oefenwiel</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex bg-zinc-100 p-1 rounded-lg overflow-hidden">
              {profiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActiveProfileId(p.id)}
                  className={`px-2 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all truncate max-w-[80px] sm:max-w-[120px] ${
                    activeProfileId === p.id 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-indigo-50 text-indigo-600' : 'text-zinc-400 hover:bg-zinc-100'}`}
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Column: Wheel */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center min-h-[350px] sm:min-h-[500px] lg:min-h-[600px]">
            {wheelItems.length > 0 ? (
              <Wheel 
                items={wheelItems} 
                onFinish={handleWheelFinish}
                isSpinning={isSpinning}
                setIsSpinning={setIsSpinning}
              />
            ) : (
              <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-zinc-200 max-w-md">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                  <Music size={32} />
                </div>
                <h3 className="text-lg font-bold text-zinc-800">Geen liedjes geselecteerd</h3>
                <p className="text-zinc-500 mt-2">
                  Selecteer liedjes uit de lijst aan de rechterkant om het wiel voor {activeProfile.name} te vullen.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Selection & Settings */}
          <div className="lg:col-span-5 space-y-6">
            <AnimatePresence mode="wait">
              {showSettings ? (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden"
                >
                  <div className="flex border-b border-zinc-100">
                    <button 
                      onClick={() => setActiveTab('profiles')}
                      className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'profiles' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-zinc-400 hover:text-zinc-600'}`}
                    >
                      Profielen
                    </button>
                    <button 
                      onClick={() => setActiveTab('data')}
                      className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'data' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-zinc-400 hover:text-zinc-600'}`}
                    >
                      Liedjes & Boeken
                    </button>
                  </div>

                  <div className="p-6 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
                    {activeTab === 'profiles' ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-bold flex items-center gap-2">
                            <Users size={20} className="text-indigo-500" />
                            Profiel Instellingen
                          </h2>
                          <button 
                            onClick={() => setShowSettings(false)}
                            className="text-sm text-indigo-600 font-medium hover:underline"
                          >
                            Klaar
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          {profiles.map(p => (
                            <div key={p.id} className="space-y-2">
                              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                Naam van {p.id === 'kind-1' ? 'Kind 1' : 'Kind 2'}
                              </label>
                              <input 
                                type="text"
                                value={p.name}
                                onChange={(e) => updateProfileName(p.id, e.target.value)}
                                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                placeholder="Naam invoeren..."
                              />
                            </div>
                          ))}
                        </div>

                        <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                          <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                            <Trophy size={16} />
                            Oefentip
                          </h4>
                          <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                            Probeer elke dag minstens 15 minuten te oefenen. Consistentie is de sleutel tot succes!
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* Books Management */}
                        <section className="space-y-4">
                          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <BookOpen size={16} />
                            Boeken Beheren
                          </h3>
                          <div className="space-y-2">
                            {books.map(book => (
                              <div key={book.id} className="flex items-center gap-2 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                                {editingBookId === book.id ? (
                                  <>
                                    <input 
                                      autoFocus
                                      className="flex-1 bg-white border border-zinc-200 rounded px-2 py-1 text-sm"
                                      defaultValue={book.title}
                                      onBlur={(e) => updateBookTitle(book.id, e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && updateBookTitle(book.id, e.currentTarget.value)}
                                    />
                                    <button onClick={() => setEditingBookId(null)} className="p-1 text-zinc-400"><X size={16}/></button>
                                  </>
                                ) : (
                                  <>
                                    <span className="flex-1 text-sm font-medium">{book.title}</span>
                                    <button onClick={() => setEditingBookId(book.id)} className="p-1 text-zinc-400 hover:text-indigo-600"><Edit2 size={16}/></button>
                                    <button onClick={() => deleteBook(book.id)} className="p-1 text-zinc-400 hover:text-red-600"><Trash2 size={16}/></button>
                                  </>
                                )}
                              </div>
                            ))}
                            <div className="flex gap-2 mt-2">
                              <input 
                                value={newBookTitle}
                                onChange={(e) => setNewBookTitle(e.target.value)}
                                placeholder="Nieuw boek..."
                                className="flex-1 text-sm px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              />
                              <button onClick={addBook} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                <Plus size={20} />
                              </button>
                            </div>
                          </div>
                        </section>

                        {/* Songs Management */}
                        <section className="space-y-4">
                          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Music size={16} />
                            Liedjes Beheren
                          </h3>
                          <div className="space-y-2">
                            {songs.map(song => (
                              <div key={song.id} className="flex items-center gap-2 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                                {editingSongId === song.id ? (
                                  <>
                                    <input 
                                      autoFocus
                                      className="flex-1 bg-white border border-zinc-200 rounded px-2 py-1 text-sm"
                                      defaultValue={song.title}
                                      onBlur={(e) => updateSongTitle(song.id, e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && updateSongTitle(song.id, e.currentTarget.value)}
                                    />
                                    <button onClick={() => setEditingSongId(null)} className="p-1 text-zinc-400"><X size={16}/></button>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex-1 flex flex-col">
                                      <span className="text-sm font-medium">{song.title}</span>
                                      <span className="text-[10px] text-zinc-400">{books.find(b => b.id === song.bookId)?.title}</span>
                                    </div>
                                    <button onClick={() => setEditingSongId(song.id)} className="p-1 text-zinc-400 hover:text-indigo-600"><Edit2 size={16}/></button>
                                    <button onClick={() => deleteSong(song.id)} className="p-1 text-zinc-400 hover:text-red-600"><Trash2 size={16}/></button>
                                  </>
                                )}
                              </div>
                            ))}
                            
                            <div className="space-y-2 mt-4 pt-4 border-t border-zinc-100">
                              <select 
                                value={selectedBookForNewSong}
                                onChange={(e) => setSelectedBookForNewSong(e.target.value)}
                                className="w-full text-sm px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none"
                              >
                                {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                              </select>
                              <div className="flex gap-2">
                                <input 
                                  value={newSongTitle}
                                  onChange={(e) => setNewSongTitle(e.target.value)}
                                  placeholder="Nieuw liedje..."
                                  className="flex-1 text-sm px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                <button onClick={addSong} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                  <Plus size={20} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </section>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="selector"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Music size={20} className="text-indigo-500" />
                      Liedjes Selecteren
                    </h2>
                    <div className="text-xs font-medium text-zinc-400">
                      {activeProfile.selectedSongIds.length} / {songs.length} geselecteerd
                    </div>
                  </div>

                  <div className="max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                    <SongSelector 
                      books={books}
                      songs={songs}
                      selectedSongIds={activeProfile.selectedSongIds}
                      onToggleSong={handleToggleSong}
                      onToggleBook={handleToggleBook}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer / Stats */}
      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-zinc-200 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h4 className="font-bold text-zinc-400 text-xs uppercase tracking-widest">Over</h4>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Een eenvoudig hulpmiddel om gitaar oefenen leuker te maken. Draai aan het wiel om je volgende liedje te kiezen!
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-zinc-400 text-xs uppercase tracking-widest">Statistieken</h4>
            <div className="flex gap-4">
              <div className="bg-white p-3 rounded-xl border border-zinc-200 flex-1">
                <div className="text-2xl font-black text-indigo-600">{books.length}</div>
                <div className="text-[10px] text-zinc-400 font-bold uppercase">Boeken</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-zinc-200 flex-1">
                <div className="text-2xl font-black text-indigo-600">{songs.length}</div>
                <div className="text-[10px] text-zinc-400 font-bold uppercase">Totaal Liedjes</div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-zinc-400 text-xs uppercase tracking-widest">Maker</h4>
            <p className="text-sm text-zinc-500">
              Deze app is met behulp van AI gemaakt door Glenn Evens.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e4e4e7;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d4d4d8;
        }
      `}</style>
    </div>
  );
}
