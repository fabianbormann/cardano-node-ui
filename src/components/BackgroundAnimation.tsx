import React, { useEffect, useRef } from 'react';
import ParticleNetwork from './ParticleNetwork';

const BackgroundAnimation = () => {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (container.current && canvas.current) {
      const particleNetwork = new ParticleNetwork(
        container.current,
        canvas.current,
        {
          useWindowForMouseEvents: true,
        }
      );
      return () => particleNetwork.clear();
    }
  });

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: -1,
        width: '100%',
        height: '100%',
      }}
      ref={container}
    >
      <canvas ref={canvas}></canvas>
    </div>
  );
};

export default BackgroundAnimation;
