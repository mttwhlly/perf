import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AnimationTest = ({ css, canvas, svg }) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  // Canvas Animation
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    const particles = Array.from({ length: canvas.particles }, () => ({
      x: Math.random() * canvasRef.current.width,
      y: Math.random() * canvasRef.current.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        if (particle.x < 0 || particle.x > canvasRef.current.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvasRef.current.height) particle.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(rafRef.current);
  }, [canvas.particles]);

  return (
    <div className="animation-test">
      {/* CSS Animations */}
      <div className="css-animations">
        {Array.from({ length: css.elements }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 0],
              opacity: [1, 0.5, 1]
            }}
            transition={{
              duration: css.duration / 1000,
              repeat: Infinity
            }}
            className="animated-element"
          />
        ))}
      </div>

      {/* Canvas Animations */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="canvas-animation"
      />

      {/* SVG Animations */}
      <svg width="800" height="600" className="svg-animation">
        {Array.from({ length: svg.paths }).map((_, i) => (
          <motion.path
            key={i}
            d="M0,50 Q100,0 200,50 T400,50"
            stroke="black"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        ))}
      </svg>
    </div>
  );
};

export default AnimationTest;