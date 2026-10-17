import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import type { LastResult } from '../types';

interface WheelProps {
  items: string[];
  onFinish: (item: string) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  instrumentIcon?: LucideIcon;
  lastResult?: LastResult;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', 
  '#F7DC6F', '#BB8FCE', '#82E0AA', '#F1948A', '#85C1E9'
];

const DARK_TEXT = '#27272a';
const WHEEL_FONT = 'Nunito, ui-sans-serif, system-ui, sans-serif';
// Wijzer staat bovenaan; in canvas-hoeken is dat -90°
const POINTER_ANGLE = -Math.PI / 2;

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Kies per vak de tekstkleur (wit of donker) met het meeste contrast
const textColorFor = (hex: string) => {
  const l = luminance(hex);
  const whiteContrast = 1.05 / (l + 0.05);
  const darkContrast = (l + 0.05) / (luminance(DARK_TEXT) + 0.05);
  return whiteContrast >= darkContrast ? '#fff' : DARK_TEXT;
};

const dayLabel = (timestamp: number) => {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(new Date()) - startOfDay(new Date(timestamp))) / 86400000);
  if (days === 0) return 'vandaag';
  if (days === 1) return 'gisteren';
  return new Date(timestamp).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' });
};

const splitWinner = (text: string) => {
  if (!text.includes('(')) return { song: text, book: null };
  return {
    song: text.substring(0, text.lastIndexOf('(')).trim(),
    book: text.substring(text.lastIndexOf('(') + 1, text.lastIndexOf(')')),
  };
};

export const Wheel: React.FC<WheelProps> = ({ 
  items, 
  onFinish, 
  isSpinning, 
  setIsSpinning,
  soundEnabled,
  voiceEnabled,
  instrumentIcon: InstrumentIcon,
  lastResult,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [size, setSize] = useState(400);
  const [fontsReady, setFontsReady] = useState(false);

  // Canvas tekent pas met het juiste lettertype als het geladen is
  useEffect(() => {
    document.fonts?.load(`800 16px ${WHEEL_FONT}`).finally(() => setFontsReady(true));
  }, []);

  // Initialize audio
  useEffect(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}success-rune.mp3`);
    audio.preload = 'auto';
    audioRef.current = audio;

    // Pre-unlock audio for mobile devices on first interaction
    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current?.pause();
          audioRef.current!.currentTime = 0;
        }).catch(() => {});
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        // On mobile, we want it to be responsive but not too tiny
        // On desktop, we cap it at 400
        const newSize = Math.min(width - 32, 400);
        if (newSize > 0) {
          setSize(newSize);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Lopende animatie en geplande aankondiging, zodat we ze kunnen stoppen
  const frameRef = useRef<number | null>(null);
  const announceTimeoutRef = useRef<number | null>(null);

  const stopPending = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    if (announceTimeoutRef.current !== null) clearTimeout(announceTimeoutRef.current);
    frameRef.current = null;
    announceTimeoutRef.current = null;
    window.speechSynthesis?.cancel();
  };

  // Verdwijnt het wiel (instellingen, ander kind of instrument), dan mag een
  // halve draai niet op de achtergrond verder lopen en een liedje uitspreken
  useEffect(() => () => {
    if (frameRef.current !== null) setIsSpinning(false);
    stopPending();
  }, []);

  const spinRef = useRef({
    startRotation: 0,
    targetRotation: 0,
    startTime: 0,
    duration: 5000,
  });

  const drawWheel = (currentRotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Teken op de pixeldichtheid van het scherm, zodat het wiel scherp blijft op retina
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const canvasSize = size;
    const center = canvasSize / 2;
    const radius = canvasSize / 2 - 10;
    const sliceAngle = (2 * Math.PI) / items.length;
    const pinRadius = canvasSize / 25;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    items.forEach((item, i) => {
      const angle = currentRotation + i * sliceAngle;
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + sliceAngle);
      ctx.closePath();
      const color = COLORS[i % COLORS.length];
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = textColorFor(color);
      // Schaal met het wiel, maar nooit hoger dan het vak breed is
      const fontSize = Math.max(9, Math.floor(Math.min(canvasSize / 28, sliceAngle * radius * 0.5)));
      ctx.font = `800 ${fontSize}px ${WHEEL_FONT}`;
      // Kort de tekst in tot hij tussen de rand en de middenpin past
      const maxWidth = radius - 15 - pinRadius - 8;
      // Het boek staat op de resultaatkaart; op het wiel enkel de titel
      const label = splitWinner(item).song;
      let displayItem = label;
      while (displayItem.length > 1 && ctx.measureText(displayItem).width > maxWidth) {
        displayItem = displayItem.slice(0, -1);
      }
      if (displayItem !== label) displayItem = displayItem.trimEnd() + '…';
      ctx.fillText(displayItem, radius - 15, fontSize / 3);
      ctx.restore();
    });

    // Draw center pin
    ctx.beginPath();
    ctx.arc(center, center, pinRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#333';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  useEffect(() => {
    drawWheel(rotation);
  }, [items, rotation, size, fontsReady]);

  const announceWinner = (text: string) => {
    if (!window.speechSynthesis || !voiceEnabled) return;
    // Niet voorlezen als de app niet in beeld is; anders klinkt het later "uit het niets"
    if (document.visibilityState !== 'visible') return;

    // Format: "Song Title uit Book Title"
    const { song, book } = splitWinner(text);
    const announcement = book ? `${song} uit ${book}` : song;

    const utterance = new SpeechSynthesisUtterance(announcement);
    utterance.lang = 'nl-NL'; // Dutch
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    // Oude, nog wachtende aankondigingen eerst wissen
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const spin = () => {
    if (isSpinning || items.length === 0) return;

    stopPending();
    setIsSpinning(true);
    setWinner(null);
    
    const extraSpins = 5 + Math.random() * 5;
    const target = rotation + extraSpins * 2 * Math.PI + Math.random() * 2 * Math.PI;
    
    spinRef.current = {
      startRotation: rotation,
      targetRotation: target,
      startTime: performance.now(),
      duration: 4000 + Math.random() * 2000,
    };

    const animate = (currentTime: number) => {
      const elapsed = currentTime - spinRef.current.startTime;
      const progress = Math.min(elapsed / spinRef.current.duration, 1);
      
      // Easing function: cubic out
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
      const currentRotation = spinRef.current.startRotation + (spinRef.current.targetRotation - spinRef.current.startRotation) * easeOut(progress);
      
      setRotation(currentRotation);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        frameRef.current = null;
        setIsSpinning(false);
        // Welk vak staat onder de wijzer bovenaan?
        const fullTurn = 2 * Math.PI;
        const sliceAngle = fullTurn / items.length;
        const offset = (((POINTER_ANGLE - currentRotation) % fullTurn) + fullTurn) % fullTurn;
        const winningIndex = Math.floor(offset / sliceAngle) % items.length;
        const result = items[winningIndex];
        
        // Play success sound
        if (audioRef.current && soundEnabled) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }

        // Announce winner with a slight delay so it doesn't overlap with the success sound
        announceTimeoutRef.current = window.setTimeout(() => {
          announceTimeoutRef.current = null;
          announceWinner(result);
        }, 1700);

        setWinner(result);
        onFinish(result);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
  };

  const result = winner && !isSpinning ? splitWinner(winner) : null;

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full max-w-[450px]">
      <div className="relative">
        {/* Wijzer bovenaan */}
        <div className="absolute left-1/2 -top-3 sm:-top-4 -translate-x-1/2 z-20 drop-shadow-md">
          <div
            className="w-8 h-10 sm:w-10 sm:h-12 bg-zinc-800"
            style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }}
          ></div>
        </div>

        <div className="bg-white p-2 sm:p-4 rounded-full shadow-2xl border-4 sm:border-8 border-zinc-800">
          <canvas
            ref={canvasRef}
            width={Math.round(size * (window.devicePixelRatio || 1))}
            height={Math.round(size * (window.devicePixelRatio || 1))}
            style={{ width: size, height: size }}
            className="rounded-full block"
          />
        </div>

        {/* Resultaatkaart over het wiel */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.6, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="w-[85%] bg-white rounded-3xl shadow-2xl border-4 border-accent-500 p-5 sm:p-7 text-center"
              >
                {InstrumentIcon && (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto -mt-11 sm:-mt-14 mb-2 bg-accent-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                    <InstrumentIcon size={28} />
                  </div>
                )}
                <h3 className="text-xs sm:text-sm uppercase tracking-widest text-zinc-500 font-bold">Vandaag oefenen we</h3>
                <p className="mt-2 text-2xl sm:text-3xl font-black text-zinc-900 leading-tight break-words">{result.song}</p>
                {result.book && (
                  <p className="mt-1 text-base sm:text-lg font-bold text-accent-600">{result.book}</p>
                )}
                <button
                  onClick={() => setWinner(null)}
                  className="mt-5 px-6 py-2.5 rounded-full bg-accent-600 text-white font-bold hover:bg-accent-700 active:scale-95 transition-all"
                >
                  Oké, aan de slag!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={spin}
        disabled={isSpinning || items.length === 0}
        className={`mt-8 px-8 py-4 rounded-full font-black text-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg
          ${isSpinning || items.length === 0
            ? 'bg-zinc-400 text-white cursor-not-allowed'
            : 'bg-accent-600 text-white hover:bg-accent-700'}`}
      >
        {isSpinning ? 'Draaien...' : 'Draai aan het wiel'}
      </button>

      {lastResult && !result && !isSpinning && (() => {
        const last = splitWinner(lastResult.item);
        return (
          <p className="mt-4 text-sm text-zinc-500 text-center">
            Laatst gedraaid {dayLabel(lastResult.at)}:{' '}
            <span className="font-bold text-zinc-800">{last.song}</span>
            {last.book && <span className="text-accent-600"> · {last.book}</span>}
          </p>
        );
      })()}
    </div>
  );
};
