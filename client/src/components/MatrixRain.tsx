import React, { useEffect, useRef } from 'react';

const MatrixRain: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const characters = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    
    const createChar = () => {
      const char = document.createElement('div');
      char.className = 'absolute text-[#00FF41] font-mono text-lg opacity-80 animate-matrix-rain pointer-events-none';
      char.textContent = characters[Math.floor(Math.random() * characters.length)];
      char.style.left = Math.random() * 100 + '%';
      char.style.animationDuration = (Math.random() * 3 + 2) + 's';
      char.style.opacity = (Math.random() * 0.8 + 0.2).toString();
      
      container.appendChild(char);
      
      setTimeout(() => {
        if (char.parentNode) {
          char.remove();
        }
      }, 5000);
    };

    // Create initial characters
    for (let i = 0; i < 20; i++) {
      setTimeout(() => createChar(), i * 100);
    }

    const interval = setInterval(createChar, 100);

    return () => {
      clearInterval(interval);
      // Clean up any remaining characters
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[1] overflow-hidden"
      aria-hidden="true"
    />
  );
};

export default MatrixRain;
