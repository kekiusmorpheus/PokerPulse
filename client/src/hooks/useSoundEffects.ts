import { useCallback } from 'react';

export const useSoundEffects = () => {
  const playSound = useCallback((soundType: string) => {
    try {
      // Create audio context for web audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      };

      switch (soundType) {
        case 'cardDeal':
          playTone(800, 0.1, 'square');
          setTimeout(() => playTone(600, 0.1, 'square'), 50);
          break;
          
        case 'cardFlip':
          playTone(1000, 0.2, 'triangle');
          break;
          
        case 'chipBet':
          playTone(400, 0.3, 'sine');
          setTimeout(() => playTone(500, 0.2, 'sine'), 100);
          break;
          
        case 'fold':
          playTone(200, 0.5, 'sawtooth');
          break;
          
        case 'call':
          playTone(600, 0.3, 'triangle');
          break;
          
        case 'raise':
          playTone(800, 0.2, 'square');
          setTimeout(() => playTone(1000, 0.2, 'square'), 150);
          setTimeout(() => playTone(1200, 0.2, 'square'), 300);
          break;
          
        case 'win':
          // Chip collecting sounds followed by victory
          for (let i = 0; i < 8; i++) {
            setTimeout(() => {
              playTone(400 + Math.random() * 200, 0.1, 'triangle');
            }, i * 100);
          }
          // Victory fanfare after chip sounds
          setTimeout(() => {
            const notes = [523, 659, 784, 1047]; // C, E, G, C
            notes.forEach((note, index) => {
              setTimeout(() => playTone(note, 0.5, 'triangle'), index * 200);
            });
          }, 800);
          break;
          
        case 'chipStack':
          // Multiple chip stacking sounds
          for (let i = 0; i < 5; i++) {
            setTimeout(() => {
              playTone(300 + i * 50, 0.2, 'square');
            }, i * 80);
          }
          break;
          
        case 'potWin':
          // Cascading chip collection sound
          for (let i = 0; i < 12; i++) {
            setTimeout(() => {
              const freq = 400 + Math.random() * 300;
              playTone(freq, 0.15, 'triangle');
            }, i * 60);
          }
          break;
          
        case 'lose':
          playTone(300, 0.8, 'sawtooth');
          setTimeout(() => playTone(200, 0.8, 'sawtooth'), 200);
          break;
          
        case 'notification':
          playTone(800, 0.2, 'sine');
          setTimeout(() => playTone(1000, 0.2, 'sine'), 100);
          break;
          
        case 'turnTimer':
          playTone(600, 0.1, 'triangle');
          break;
          
        default:
          playTone(440, 0.2, 'sine');
      }
    } catch (error) {
      console.warn('Could not play sound:', error);
    }
  }, []);

  return { playSound };
};