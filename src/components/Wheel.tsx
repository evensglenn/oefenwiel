import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface WheelProps {
  items: string[];
  onFinish: (item: string) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', 
  '#F7DC6F', '#BB8FCE', '#82E0AA', '#F1948A', '#85C1E9'
];

export const Wheel: React.FC<WheelProps> = ({ items, onFinish, isSpinning, setIsSpinning }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [size, setSize] = useState(400);

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

    const canvasSize = canvas.width;
    const center = canvasSize / 2;
    const radius = canvasSize / 2 - 10;
    const sliceAngle = (2 * Math.PI) / items.length;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    items.forEach((item, i) => {
      const angle = currentRotation + i * sliceAngle;
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      // Scale font size slightly with wheel size
      const fontSize = Math.max(9, Math.floor(canvasSize / 32));
      ctx.font = `bold ${fontSize}px Inter`;
      // Show more characters for longer strings
      const maxChars = Math.floor(canvasSize / 15);
      const displayItem = item.length > maxChars ? item.substring(0, maxChars - 3) + '...' : item;
      ctx.fillText(displayItem, radius - 15, fontSize / 3);
      ctx.restore();
    });

    // Draw center pin
    ctx.beginPath();
    ctx.arc(center, center, canvasSize / 25, 0, 2 * Math.PI);
    ctx.fillStyle = '#333';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  useEffect(() => {
    drawWheel(rotation);
  }, [items, rotation, size]);

  const announceWinner = (text: string) => {
    if (!window.speechSynthesis) return;

    // Format: "Song Title uit Book Title"
    let announcement = text;
    if (text.includes('(')) {
      const song = text.substring(0, text.lastIndexOf('(')).trim();
      const book = text.substring(text.lastIndexOf('(') + 1, text.lastIndexOf(')'));
      announcement = `${song} uit ${book}`;
    }

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
        const finalRotation = currentRotation % (2 * Math.PI);
        const sliceAngle = (2 * Math.PI) / items.length;
        const winningIndex = Math.floor((2 * Math.PI - finalRotation) / sliceAngle) % items.length;
        const result = items[winningIndex];
        
        // Play success sound
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }

        // Announce winner with a slight delay so it doesn't overlap with the success sound
        setTimeout(() => {
          announceWinner(result);
        }, 1200);

        setWinner(result);
        onFinish(result);
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full max-w-[450px]">
      <div className="relative">
        {/* Pointer */}
        <div className="absolute top-1/2 -right-2 -translate-y-1/2 z-20">
          <div 
            className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-800 shadow-lg" 
            style={{ 
              clipPath: 'polygon(100% 0%, 0% 50%, 100% 100%)',
              filter: 'drop-shadow(-2px 0px 2px rgba(0,0,0,0.2))'
            }}
          ></div>
        </div>

        <div className="bg-white p-2 sm:p-4 rounded-full shadow-2xl border-4 sm:border-8 border-zinc-800">
          <canvas 
            ref={canvasRef} 
            width={size} 
            height={size} 
            className="rounded-full"
          />
        </div>
      </div>

      <button
        onClick={spin}
        disabled={isSpinning || items.length === 0}
        className={`mt-8 px-8 py-4 rounded-full font-bold text-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg
          ${isSpinning || items.length === 0 
            ? 'bg-zinc-400 cursor-not-allowed' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
      >
        {isSpinning ? 'Draaien...' : 'Draai aan het wiel'}
      </button>

      <AnimatePresence>
        {winner && !isSpinning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 text-center"
          >
            <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-semibold">Vandaag oefenen we:</h3>
            <div className="mt-1">
              {winner.includes('(') ? (
                <>
                  <p className="text-3xl font-black text-zinc-900">
                    {winner.substring(0, winner.lastIndexOf('(')).trim()}
                  </p>
                  <p className="text-lg font-medium text-indigo-600">
                    {winner.substring(winner.lastIndexOf('(') + 1, winner.lastIndexOf(')'))}
                  </p>
                </>
              ) : (
                <p className="text-3xl font-black text-zinc-900">{winner}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
