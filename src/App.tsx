import React, { useState, useEffect, useMemo } from 'react';
import { Wheel } from './components/Wheel';
import { SongSelector } from './components/SongSelector';
import { INITIAL_BOOKS, INSTRUMENTS, INITIAL_SONGS } from './constants';
import { Profile, Book, Song, LastResult, ThemePreference } from './types';
import { Users, Settings, Music, Trophy, Plus, Trash2, Edit2, Save, X, BookOpen, Volume2, VolumeX, Mic, MicOff, Check, ChevronDown, Sun, Moon, Monitor } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

const PROFILES_KEY = 'guitar_practice_profiles_v6';
const BOOKS_KEY = 'guitar_practice_books_v6';
const SONGS_KEY = 'guitar_practice_songs_v6';
const SOUND_KEY = 'guitar_practice_sound_v1';
const LAST_RESULTS_KEY = 'guitar_practice_last_results_v1';
const VOICE_KEY = 'guitar_practice_voice_v1';
// Ook gelezen door het scriptje in index.html, zodat er bij het laden geen witte flits is
const THEME_KEY = 'guitar_practice_theme_v1';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Licht', icon: Sun },
  { value: 'auto', label: 'Automatisch', icon: Monitor },
  { value: 'dark', label: 'Donker', icon: Moon },
];

// Veer voor de glijdende keuzebolletjes (kind, instrument, thema)
const PILL_SPRING = { type: 'spring', stiffness: 500, damping: 35 } as const;

// Data van vóór de instrumenten-uitbreiding was altijd gitaar
const LEGACY_INSTRUMENT_ID = 'gitaar';

export default function App() {
  // Data State
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem(BOOKS_KEY);
    if (!saved) return INITIAL_BOOKS;
    const parsed: Book[] = JSON.parse(saved);
    if (parsed.every(b => b.instrumentId)) return parsed;
    // Migratie: bestaande boeken horen bij gitaar, en voeg een leeg pianoboek toe
    const migrated = parsed.map(b => ({ ...b, instrumentId: b.instrumentId || LEGACY_INSTRUMENT_ID }));
    const pianoBooks = INITIAL_BOOKS.filter(b => b.instrumentId !== LEGACY_INSTRUMENT_ID && !migrated.some(m => m.id === b.id));
    return [...migrated, ...pianoBooks];
  });

  const [songs, setSongs] = useState<Song[]>(() => {
    const saved = localStorage.getItem(SONGS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_SONGS;
  });

  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem(PROFILES_KEY);
    if (saved) {
      const parsed: Profile[] = JSON.parse(saved);
      return parsed.map(p => ({
        ...p,
        instrumentIds: p.instrumentIds?.length ? p.instrumentIds : [LEGACY_INSTRUMENT_ID],
      }));
    }
    return [
      { id: 'kind-1', name: 'Seppe', instrumentIds: ['gitaar', 'piano'], selectedSongIds: INITIAL_SONGS.map(s => s.id) },
      { id: 'kind-2', name: 'Rune', instrumentIds: ['gitaar'], selectedSongIds: INITIAL_SONGS.map(s => s.id) },
    ];
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(profiles[0].id);
  const [activeInstrumentId, setActiveInstrumentId] = useState<string>(profiles[0].instrumentIds[0]);
  const [dataInstrumentId, setDataInstrumentId] = useState<string>(profiles[0].instrumentIds[0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'profiles' | 'data' | 'settings'>('profiles');

  // Laatst gedraaide liedje per kind en instrument
  const [lastResults, setLastResults] = useState<Record<string, LastResult>>(() => {
    const saved = localStorage.getItem(LAST_RESULTS_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  const [songListOpen, setSongListOpen] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(SOUND_KEY);
    return saved ? JSON.parse(saved) : true;
  });

  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(VOICE_KEY);
    return saved ? JSON.parse(saved) : true;
  });

  const [theme, setTheme] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved ? JSON.parse(saved) : 'auto';
  });

  // Editing State
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newSongTitle, setNewSongTitle] = useState('');
  const [selectedBookForNewSong, setSelectedBookForNewSong] = useState<string>('');

  // Persistence
  useEffect(() => {
    localStorage.setItem(LAST_RESULTS_KEY, JSON.stringify(lastResults));
  }, [lastResults]);

  useEffect(() => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem(SONGS_KEY, JSON.stringify(songs));
  }, [songs]);

  useEffect(() => {
    localStorage.setItem(SOUND_KEY, JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem(VOICE_KEY, JSON.stringify(voiceEnabled));
  }, [voiceEnabled]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
  }, [theme]);

  // Licht/donker/automatisch toepassen op <html data-theme="...">
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyResolvedTheme = () => {
      const resolved = theme === 'auto' ? (mediaQuery.matches ? 'dark' : 'light') : theme;
      document.documentElement.setAttribute('data-theme', resolved);
      document.documentElement.style.colorScheme = resolved;
    };

    applyResolvedTheme();

    if (theme === 'auto') {
      mediaQuery.addEventListener('change', applyResolvedTheme);
      return () => mediaQuery.removeEventListener('change', applyResolvedTheme);
    }
  }, [theme]);

  const activeProfile = useMemo(() => 
    profiles.find(p => p.id === activeProfileId) || profiles[0],
  [profiles, activeProfileId]);

  const profileInstruments = useMemo(() =>
    INSTRUMENTS.filter(i => activeProfile.instrumentIds.includes(i.id)),
  [activeProfile]);

  // Valt terug op het eerste instrument als het kind het gekozen instrument niet speelt
  const activeInstrument = profileInstruments.find(i => i.id === activeInstrumentId) || profileInstruments[0];

  // Statusbalk op telefoon kleurt mee met het instrument
  useEffect(() => {
    if (!activeInstrument) return;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', activeInstrument.themeColor);
  }, [activeInstrument]);

  const instrumentBooks = useMemo(() =>
    books.filter(b => b.instrumentId === activeInstrument?.id),
  [books, activeInstrument]);

  const instrumentSongs = useMemo(() =>
    songs.filter(s => instrumentBooks.some(b => b.id === s.bookId)),
  [songs, instrumentBooks]);

  const selectedInstrumentSongCount = instrumentSongs.filter(s => activeProfile.selectedSongIds.includes(s.id)).length;

  const wheelItems = useMemo(() => {
    return instrumentSongs
      .filter(s => activeProfile.selectedSongIds.includes(s.id))
      .map(s => {
        const book = books.find(b => b.id === s.bookId);
        return `${s.title} (${book?.title || '?'})`;
      });
  }, [activeProfile, instrumentSongs, books]);

  // Instrument dat beheerd wordt in het tabblad "Liedjes & Boeken"
  const dataInstrument = INSTRUMENTS.find(i => i.id === dataInstrumentId) || INSTRUMENTS[0];
  const dataBooks = books.filter(b => b.instrumentId === dataInstrument?.id);
  const dataSongs = songs.filter(s => dataBooks.some(b => b.id === s.bookId));
  const bookForNewSong = dataBooks.some(b => b.id === selectedBookForNewSong) ? selectedBookForNewSong : dataBooks[0]?.id || '';

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

  const resultKey = `${activeProfileId}:${activeInstrument?.id}`;

  const handleWheelFinish = (item: string) => {
    setLastResults(prev => ({ ...prev, [resultKey]: { item, at: Date.now() } }));
    confetti({
      particleCount: 200,
      spread: 90,
      startVelocity: 45,
      origin: { y: 0.45 },
      colors: activeInstrument?.confettiColors ?? ['#6366f1', '#a855f7', '#ec4899']
    });
  };

  const updateProfileName = (id: string, name: string) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  };

  const toggleProfileInstrument = (profileId: string, instrumentId: string) => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== profileId) return p;
      if (p.instrumentIds.includes(instrumentId)) {
        // Een kind speelt altijd minstens één instrument
        if (p.instrumentIds.length <= 1) return p;
        return { ...p, instrumentIds: p.instrumentIds.filter(id => id !== instrumentId) };
      }
      return { ...p, instrumentIds: [...p.instrumentIds, instrumentId] };
    }));
  };

  const addProfile = () => {
    const newProfile: Profile = {
      id: `kind-${Date.now()}`,
      name: `Kind ${profiles.length + 1}`,
      instrumentIds: [INSTRUMENTS[0].id],
      selectedSongIds: songs.map(s => s.id)
    };
    setProfiles([...profiles, newProfile]);
  };

  const deleteProfile = (id: string) => {
    if (profiles.length <= 1) return;
    const newProfiles = profiles.filter(p => p.id !== id);
    setProfiles(newProfiles);
    if (activeProfileId === id) {
      setActiveProfileId(newProfiles[0].id);
    }
  };

  // Book Management
  const addBook = () => {
    if (!newBookTitle.trim() || !dataInstrument) return;
    const newBook: Book = { id: `book-${Date.now()}`, title: newBookTitle, instrumentId: dataInstrument.id };
    setBooks([...books, newBook]);
    setNewBookTitle('');
    if (!bookForNewSong) setSelectedBookForNewSong(newBook.id);
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
    if (!newSongTitle.trim() || !bookForNewSong) return;
    const newSong: Song = { id: `song-${Date.now()}`, title: newSongTitle, bookId: bookForNewSong };
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
    <div data-instrument={activeInstrument?.id} className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-accent-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-accent-200 dark:shadow-none">
              <Music size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Oefenwiel</h1>
          </div>

          {/* Thema en instellingen samen in één pil */}
          <div className="flex items-center gap-0.5 p-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60">
            {THEME_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isActive = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  aria-label={opt.label}
                  aria-pressed={isActive}
                  title={opt.label}
                  className={`relative p-1.5 rounded-full transition-colors ${
                    isActive
                      ? 'text-accent-600 dark:text-accent-300'
                      : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
                  }`}
                >
                  {isActive && (
                    <motion.span layoutId="theme-pill" transition={PILL_SPRING} className="absolute inset-0 rounded-full bg-white dark:bg-zinc-600 shadow-sm" />
                  )}
                  <Icon size={16} className="relative" />
                </button>
              );
            })}
            <div className="w-px h-5 mx-1 bg-zinc-300 dark:bg-zinc-600" />
            <button
              onClick={() => setShowSettings(!showSettings)}
              disabled={isSpinning}
              aria-label="Instellingen"
              aria-pressed={showSettings}
              title="Instellingen"
              className={`p-1.5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                showSettings
                  ? 'bg-accent-600 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 sm:py-8">
        {/* Wie oefent en op welk instrument: samen boven het wiel */}
        {!showSettings && (
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            {profiles.length > 1 && (
              <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl shadow-sm max-w-full overflow-x-auto">
                {profiles.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setActiveProfileId(p.id)}
                    disabled={isSpinning}
                    className={`relative px-4 sm:px-5 py-2 rounded-lg text-sm font-bold transition-colors max-w-[140px] disabled:cursor-not-allowed ${
                      activeProfileId === p.id
                        ? 'text-accent-700 dark:text-accent-200'
                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
                    }`}
                  >
                    {activeProfileId === p.id && (
                      <motion.span layoutId="profile-pill" transition={PILL_SPRING} className="absolute inset-0 rounded-lg bg-accent-100 dark:bg-accent-900/50 transition-colors" />
                    )}
                    <span className="relative block truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Ook bij één instrument tonen, als vrolijk label in de instrumentkleur */}
            <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl shadow-sm">
              {profileInstruments.map(i => {
                const isActive = activeInstrument?.id === i.id;
                const isOnly = profileInstruments.length === 1;
                return (
                  <button
                    key={i.id}
                    onClick={() => setActiveInstrumentId(i.id)}
                    disabled={isSpinning || isOnly}
                    className={`relative px-4 sm:px-5 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${isOnly ? 'cursor-default' : 'disabled:cursor-not-allowed'} ${
                      isActive
                        ? 'text-white'
                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
                    }`}
                  >
                    {isActive && (
                      <motion.span layoutId="instrument-pill" transition={PILL_SPRING} className="absolute inset-0 rounded-lg bg-accent-600 shadow-sm transition-colors" />
                    )}
                    <motion.span
                      key={`${activeProfileId}-${i.id}`}
                      initial={{ scale: 0.6, rotate: -15, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="relative"
                    >
                      <i.icon size={16} />
                    </motion.span>
                    <span className="relative">{i.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Column: Wheel (verborgen tijdens de instellingen) */}
          {!showSettings && (
          <div className="lg:col-span-7 flex flex-col items-center justify-center min-h-[350px] sm:min-h-[500px] lg:min-h-[600px]">
            <AnimatePresence mode="wait">
            {wheelItems.length > 0 ? (
              <motion.div
                key={resultKey}
                initial={{ opacity: 0, scale: 0.85, rotate: -30 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.85, rotate: 30 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="w-full flex justify-center"
              >
              <Wheel
                items={wheelItems}
                lastResult={lastResults[resultKey]}
                onFinish={handleWheelFinish}
                isSpinning={isSpinning}
                setIsSpinning={setIsSpinning}
                soundEnabled={soundEnabled}
                voiceEnabled={voiceEnabled}
                instrumentIcon={activeInstrument?.icon}
              />
              </motion.div>
            ) : (
              <motion.div
                key={`leeg-${resultKey}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center p-12 bg-white dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 max-w-md">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                  <Music size={32} />
                </div>
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Geen liedjes geselecteerd</h3>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                  {instrumentSongs.length > 0
                    ? `Selecteer liedjes uit de lijst aan de rechterkant om het ${activeInstrument?.name.toLowerCase()}wiel voor ${activeProfile.name} te vullen.`
                    : `Er zijn nog geen liedjes voor ${activeInstrument?.name.toLowerCase()}. Voeg ze toe via Instellingen → Liedjes & Boeken.`}
                </p>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
          )}

          {/* Right Column: Selection & Settings */}
          <div className={showSettings ? 'lg:col-span-12 w-full max-w-2xl mx-auto space-y-6' : 'lg:col-span-5 space-y-6'}>
            <AnimatePresence mode="wait">
              {showSettings ? (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                >
                  <div className="flex border-b border-zinc-100 dark:border-zinc-800">
                    <button 
                      onClick={() => setActiveTab('profiles')}
                      className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'profiles' ? 'text-accent-600 dark:text-accent-300 border-b-2 border-accent-600 dark:border-accent-400' : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'}`}
                    >
                      Profielen
                    </button>
                    <button 
                      onClick={() => setActiveTab('data')}
                      className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'data' ? 'text-accent-600 dark:text-accent-300 border-b-2 border-accent-600 dark:border-accent-400' : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'}`}
                    >
                      Liedjes & Boeken
                    </button>
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'settings' ? 'text-accent-600 dark:text-accent-300 border-b-2 border-accent-600 dark:border-accent-400' : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'}`}
                    >
                      Instellingen
                    </button>
                  </div>

                  <div className="p-6">
                    {activeTab === 'profiles' ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-bold flex items-center gap-2">
                            <Users size={20} className="text-accent-500" />
                            Profielen
                          </h2>
                          <button 
                            onClick={() => setShowSettings(false)}
                            className="text-sm text-accent-600 dark:text-accent-300 font-medium hover:underline"
                          >
                            Klaar
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          {profiles.map((p, index) => (
                            <div key={p.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                  Naam van Kind {index + 1}
                                </label>
                                {profiles.length > 1 && (
                                  <button 
                                    onClick={() => deleteProfile(p.id)}
                                    className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                                    title="Profiel verwijderen"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                              <input 
                                type="text"
                                value={p.name}
                                onChange={(e) => updateProfileName(p.id, e.target.value)}
                                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all"
                                placeholder="Naam invoeren..."
                              />
                              <div className="flex flex-wrap gap-2">
                                {INSTRUMENTS.map(i => {
                                  const plays = p.instrumentIds.includes(i.id);
                                  const isLast = plays && p.instrumentIds.length <= 1;
                                  return (
                                    <button
                                      key={i.id}
                                      data-instrument={i.id}
                                      onClick={() => toggleProfileInstrument(p.id, i.id)}
                                      disabled={isLast}
                                      title={isLast ? 'Elk kind speelt minstens één instrument' : undefined}
                                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-all flex items-center gap-1 disabled:cursor-not-allowed ${
                                        plays
                                          ? 'bg-accent-600 border-accent-600 text-white'
                                          : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-accent-300 hover:text-accent-500'
                                      }`}
                                    >
                                      {plays ? <Check size={12} strokeWidth={3} /> : <i.icon size={12} />}
                                      {i.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          
                          <button 
                            onClick={addProfile}
                            className="w-full py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-400 font-bold text-sm hover:border-accent-300 hover:text-accent-500 transition-all flex items-center justify-center gap-2"
                          >
                            <Plus size={18} />
                            Kind Toevoegen
                          </button>
                        </div>

                        <div className="mt-8 p-4 bg-accent-50 dark:bg-accent-900/30 rounded-xl border border-accent-100 dark:border-accent-900/60">
                          <h4 className="text-sm font-bold text-accent-900 dark:text-accent-200 flex items-center gap-2">
                            <Trophy size={16} />
                            Oefentip
                          </h4>
                          <p className="text-xs text-accent-700 dark:text-accent-300 mt-1 leading-relaxed">
                            Probeer elke dag minstens 15 minuten te oefenen. Consistentie is de sleutel tot succes!
                          </p>
                        </div>
                      </div>
                    ) : activeTab === 'data' ? (
                      // Kleurt mee met het instrument dat je hier beheert (piano groen, gitaar paars)
                      <div data-instrument={dataInstrument?.id} className="space-y-8">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-bold flex items-center gap-2">
                            <BookOpen size={20} className="text-accent-500" />
                            Liedjes & Boeken
                          </h2>
                          <button 
                            onClick={() => setShowSettings(false)}
                            className="text-sm text-accent-600 dark:text-accent-300 font-medium hover:underline"
                          >
                            Klaar
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                            Boeken en liedjes beheren voor
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {INSTRUMENTS.map(i => (
                              <button
                                key={i.id}
                                onClick={() => setDataInstrumentId(i.id)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                                  dataInstrument?.id === i.id
                                    ? 'bg-accent-600 text-white shadow-sm'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100'
                                }`}
                              >
                                <i.icon size={16} />
                                {i.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <section className="space-y-4">
                          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <BookOpen size={16} />
                            Boeken Beheren
                          </h3>
                          <div className="space-y-2">
                            {dataBooks.length === 0 && (
                              <p className="text-xs text-zinc-400">Nog geen boeken voor {dataInstrument?.name.toLowerCase()}.</p>
                            )}
                            {dataBooks.map(book => (
                              <div key={book.id} className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 p-2 rounded-lg border border-zinc-100 dark:border-zinc-700">
                                {editingBookId === book.id ? (
                                  <>
                                    <input 
                                      autoFocus
                                      className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-sm"
                                      defaultValue={book.title}
                                      onBlur={(e) => updateBookTitle(book.id, e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && updateBookTitle(book.id, e.currentTarget.value)}
                                    />
                                    <button onClick={() => setEditingBookId(null)} className="p-1 text-zinc-400"><X size={16}/></button>
                                  </>
                                ) : (
                                  <>
                                    <span className="flex-1 text-sm font-medium">{book.title}</span>
                                    <button onClick={() => setEditingBookId(book.id)} className="p-1 text-zinc-400 hover:text-accent-600"><Edit2 size={16}/></button>
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
                                className="flex-1 text-sm px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                              />
                              <button onClick={addBook} className="p-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors">
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
                            {dataSongs.map(song => (
                              <div key={song.id} className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 p-2 rounded-lg border border-zinc-100 dark:border-zinc-700">
                                {editingSongId === song.id ? (
                                  <>
                                    <input 
                                      autoFocus
                                      className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-sm"
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
                                    <button onClick={() => setEditingSongId(song.id)} className="p-1 text-zinc-400 hover:text-accent-600"><Edit2 size={16}/></button>
                                    <button onClick={() => deleteSong(song.id)} className="p-1 text-zinc-400 hover:text-red-600"><Trash2 size={16}/></button>
                                  </>
                                )}
                              </div>
                            ))}
                            
                            {dataBooks.length > 0 && (
                            <div className="space-y-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                              <select
                                value={bookForNewSong}
                                onChange={(e) => setSelectedBookForNewSong(e.target.value)}
                                className="w-full text-sm px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none"
                              >
                                {dataBooks.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                              </select>
                              <div className="flex gap-2">
                                <input 
                                  value={newSongTitle}
                                  onChange={(e) => setNewSongTitle(e.target.value)}
                                  placeholder="Nieuw liedje..."
                                  className="flex-1 text-sm px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                                />
                                <button onClick={addSong} className="p-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors">
                                  <Plus size={20} />
                                </button>
                              </div>
                            </div>
                            )}
                          </div>
                        </section>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-bold flex items-center gap-2">
                            <Settings size={20} className="text-accent-500" />
                            App Instellingen
                          </h2>
                          <button 
                            onClick={() => setShowSettings(false)}
                            className="text-sm text-accent-600 dark:text-accent-300 font-medium hover:underline"
                          >
                            Klaar
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl transition-colors ${soundEnabled ? 'bg-accent-100 text-accent-600 dark:bg-accent-900/40 dark:text-accent-300' : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400'}`}>
                                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                              </div>
                              <div>
                                <p className="text-sm font-bold">Overwinningsgeluid</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Speel een geluidje als het wiel stopt</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setSoundEnabled(!soundEnabled)}
                              className={`w-12 h-6 rounded-full transition-colors relative ${soundEnabled ? 'bg-accent-600' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${soundEnabled ? 'left-7' : 'left-1'}`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl transition-colors ${voiceEnabled ? 'bg-accent-100 text-accent-600 dark:bg-accent-900/40 dark:text-accent-300' : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400'}`}>
                                {voiceEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                              </div>
                              <div>
                                <p className="text-sm font-bold">Liedje uitspreken</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">De stem vertelt welk liedje gekozen is</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setVoiceEnabled(!voiceEnabled)}
                              className={`w-12 h-6 rounded-full transition-colors relative ${voiceEnabled ? 'bg-accent-600' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${voiceEnabled ? 'left-7' : 'left-1'}`} />
                            </button>
                          </div>
                        </div>
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
                  {/* Op de telefoon ingeklapt achter een knop; op groot scherm altijd open */}
                  <button
                    onClick={() => setSongListOpen(!songListOpen)}
                    aria-expanded={songListOpen}
                    className="lg:hidden w-full flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm font-bold text-zinc-800 dark:text-zinc-100"
                  >
                    <span className="flex items-center gap-2">
                      <Music size={20} className="text-accent-500" />
                      Liedjes kiezen
                    </span>
                    <span className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                      {selectedInstrumentSongCount} / {instrumentSongs.length}
                      <ChevronDown size={18} className={`text-zinc-500 transition-transform ${songListOpen ? 'rotate-180' : ''}`} />
                    </span>
                  </button>

                  <div className="hidden lg:flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Music size={20} className="text-accent-500" />
                      Liedjes selecteren
                      {activeInstrument && (
                        <span className="hidden sm:flex text-sm font-medium text-zinc-400 items-center gap-1">· <activeInstrument.icon size={14} /> {activeInstrument.name}</span>
                      )}
                    </h2>
                    <div className="text-xs font-medium text-zinc-400">
                      {selectedInstrumentSongCount} / {instrumentSongs.length} geselecteerd
                    </div>
                  </div>

                  <div className={`pr-2 ${songListOpen ? '' : 'hidden'} lg:block`}>
                    <SongSelector
                      key={activeInstrument?.id}
                      books={instrumentBooks}
                      songs={instrumentSongs}
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

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-16 mt-12 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <div className="w-6 h-6 bg-zinc-100 dark:bg-zinc-800 rounded-md flex items-center justify-center">
                <Music size={14} className="text-zinc-600 dark:text-zinc-400" />
              </div>
              <span className="font-bold tracking-tight">Oefenwiel</span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Een slimme oefentool die oefenen leuker maakt door variatie en spelplezier te combineren.
            </p>
          </div>

          <span className="text-xs text-zinc-400 font-mono">
            v{__APP_VERSION__}
          </span>
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
        [data-theme="dark"] .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
}
