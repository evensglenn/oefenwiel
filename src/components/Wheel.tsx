import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { LucideIcon } from 'lucide-react';

interface WheelProps {
  items: string[];
  onFinish: (item: string) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  instrumentIcon?: LucideIcon;
  colors?: string[];
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

// Witte tekst zodra die voor vette tekst leesbaar is (contrast >= 3), anders donker
const textColorFor = (hex: string) => {
  const whiteContrast = 1.05 / (luminance(hex) + 0.05);
  return whiteContrast >= 3 ? '#fff' : DARK_TEXT;
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
  colors = COLORS,
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
        // On desktop, we cap it at 440
        const newSize = Math.min(width - 16, 440);
        if (newSize > 0) {
          setSize(newSize);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
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

    const styles = getComputedStyle(canvas);
    const rimColor = styles.getPropertyValue('--accent-700').trim() || '#3f3f46';
    const pinColor = styles.getPropertyValue('--accent-900').trim() || '#27272a';

    const canvasSize = size;
    const center = canvasSize / 2;
    const outerRadius = canvasSize / 2 - 2;
    const rimWidth = Math.max(12, canvasSize * 0.055);
    const radius = outerRadius - rimWidth;
    const sliceAngle = (2 * Math.PI) / items.length;
    const pinRadius = canvasSize / 18;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    items.forEach((item, i) => {
      const angle = currentRotation + i * sliceAngle;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + sliceAngle);
      ctx.closePath();
      // Laatste vak mag niet dezelfde kleur krijgen als het eerste, waar ze elkaar raken
      let colorIndex = i % colors.length;
      if (i === items.length - 1 && i > 0 && colorIndex === 0) colorIndex = 2 % colors.length;
      const color = colors[colorIndex];
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
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
      const maxWidth = radius - 12 - pinRadius - 14;
      // Het boek staat op de resultaatkaart; op het wiel enkel de titel
      const label = splitWinner(item).song;
      let displayItem = label;
      while (displayItem.length > 1 && ctx.measureText(displayItem).width > maxWidth) {
        displayItem = displayItem.slice(0, -1);
      }
      if (displayItem !== label) displayItem = displayItem.trimEnd() + '…';
      ctx.fillText(displayItem, radius - 12, fontSize / 3);
      ctx.restore();
    });

    // Diepte: licht in het midden, iets donkerder naar de rand
    const shade = ctx.createRadialGradient(center, center, pinRadius, center, center, radius);
    shade.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
    shade.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
    shade.addColorStop(1, 'rgba(0, 0, 0, 0.14)');
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.fillStyle = shade;
    ctx.fill();

    // Rand met lampjes, zoals bij een spelshow
    ctx.beginPath();
    ctx.arc(center, center, outerRadius - rimWidth / 2, 0, 2 * Math.PI);
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = rimWidth;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const lightCount = 20;
    // Tijdens het draaien springen de lampjes om met de rotatie mee
    const phase = Math.floor(currentRotation / (Math.PI / 10)) % 2;
    for (let j = 0; j < lightCount; j++) {
      const a = (j / lightCount) * 2 * Math.PI;
      const lit = (j + phase) % 2 === 0;
      ctx.beginPath();
      ctx.arc(
        center + Math.cos(a) * (outerRadius - rimWidth / 2),
        center + Math.sin(a) * (outerRadius - rimWidth / 2),
        rimWidth * 0.22, 0, 2 * Math.PI
      );
      ctx.fillStyle = lit ? '#fef3c7' : 'rgba(255, 255, 255, 0.35)';
      ctx.shadowColor = lit ? 'rgba(253, 224, 71, 0.9)' : 'transparent';
      ctx.shadowBlur = lit ? rimWidth * 0.6 : 0;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // Glanzende middenpin
    const gloss = ctx.createRadialGradient(
      center - pinRadius * 0.35, center - pinRadius * 0.35, pinRadius * 0.1,
      center, center, pinRadius
    );
    gloss.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
    gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.beginPath();
    ctx.arc(center, center, pinRadius, 0, 2 * Math.PI);
    ctx.fillStyle = pinColor;
    ctx.fill();
    ctx.fillStyle = gloss;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  useEffect(() => {
    drawWheel(rotation);
  }, [items, rotation, size, fontsReady, colors]);

  const announceWinner = (text: string) => {
    if (!window.speechSynthesis || !voiceEnabled) return;

    // Format: "Song Title uit Book Title"
    const { song, book } = splitWinner(text);
    const announcement = book ? `${song} uit ${book}` : song;

    const utterance = new SpeechSynthesisUtterance(announcement);
    utterance.lang = 'nl-NL'; // Dutch
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const spin = () => {
    if (isSpinning || items.length === 0) return;

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
        requestAnimationFrame(animate);
      } else {
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
        setTimeout(() => {
          announceWinner(result);
        }, 1700);

        setWinner(result);
        onFinish(result);
      }
    };

    requestAnimationFrame(animate);
  };

  const result = winner && !isSpinning ? splitWinner(winner) : null;

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full max-w-[450px]">
      <div className="relative">
        {/* Wijzer bovenaan */}
        <div className="absolute left-1/2 -top-3 sm:-top-4 -translate-x-1/2 z-20 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]">
          <div
            className="w-8 h-10 sm:w-10 sm:h-12 bg-amber-400"
            style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }}
          ></div>
        </div>

        <div className="rounded-full shadow-2xl">
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
    </div>
  );
};
