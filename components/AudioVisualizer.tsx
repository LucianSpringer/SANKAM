import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyserNode, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Array to hold frequency data
    let dataArray: Uint8Array;
    if (analyserNode) {
      const bufferLength = analyserNode.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    }

    const animate = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      
      ctx.clearRect(0, 0, width, height);
      
      timeRef.current += 0.01;

      // Get frequency data if active
      let averageFreq = 0;
      if (isActive && analyserNode) {
         analyserNode.getByteFrequencyData(dataArray);
         // Calculate average of lower frequencies for bass/volume impact
         let sum = 0;
         // Focus on the first ~50 bins (lower frequencies) for the main beat
         const limit = Math.min(50, dataArray.length);
         for(let i = 0; i < limit; i++) {
             sum += dataArray[i];
         }
         averageFreq = sum / limit;
      }

      // Base radius
      const radius = 80 + (averageFreq * 0.3); 

      // Draw the blob
      ctx.beginPath();
      
      const points = 100;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        
        // Create noise/deformation
        // We combine sine waves to simulate Perlin-like noise
        const time = timeRef.current;
        const freqOffset = isActive ? averageFreq * 0.01 : 0;
        
        const noise = Math.cos(angle * 3 + time * 2) * (10 + freqOffset) + 
                      Math.sin(angle * 5 - time * 3) * (10 + freqOffset) +
                      Math.sin(angle * 7 + time) * (5);

        const r = radius + noise;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.closePath();
      
      // Gradient Fill
      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius * 1.5);
      if (isActive) {
        gradient.addColorStop(0, 'rgba(56, 189, 248, 0.9)'); // Sky 400
        gradient.addColorStop(0.6, 'rgba(124, 58, 237, 0.6)'); // Violet 600
        gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
      } else {
        // Idle breathing state
        gradient.addColorStop(0, 'rgba(148, 163, 184, 0.3)'); // Slate 400
        gradient.addColorStop(1, 'rgba(148, 163, 184, 0.0)');
      }
      
      ctx.fillStyle = gradient;
      ctx.fill();

      // Outer glow stroke (subtle)
      ctx.lineWidth = 2;
      ctx.strokeStyle = isActive ? 'rgba(167, 139, 250, 0.3)' : 'rgba(148, 163, 184, 0.1)';
      ctx.stroke();

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [analyserNode, isActive]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={400} 
      className="mx-auto block w-full h-full"
    />
  );
};

export default AudioVisualizer;