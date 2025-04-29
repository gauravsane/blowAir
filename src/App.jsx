import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const App = () => {
  const [blowIntensity, setBlowIntensity] = useState(0);
  const [isBlowing, setIsBlowing] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    let audioContext;
    let analyser;
    let microphone;
    let rafId;
    let mediaStream;

    const detectBlowing = () => {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const analyze = () => {
        analyser.getByteFrequencyData(dataArray);
        const lowFreqRange = dataArray.slice(0, 10);
        const intensity = lowFreqRange.reduce((a, b) => a + b, 0) / lowFreqRange.length;

        if (intensity > 30 && isHolding) {
          setBlowIntensity(Math.min(intensity, 50));
          setIsBlowing(true);
        } else {
          setIsBlowing(false);
        }

        rafId = requestAnimationFrame(analyze);
      };

      analyze();
    };

    const initAudio = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Microphone not supported.');
        }

        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(mediaStream);
        microphone.connect(analyser);
        analyser.fftSize = 256;

        detectBlowing();
      } catch (err) {
        console.error('Microphone error:', err);
      }
    };

    initAudio();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
      if (audioContext) audioContext.close();
    };
  }, [isHolding]); // Re-run detection if isHolding state changes

  // Attach hold listeners after the DOM is ready
  useEffect(() => {
    const elem = animationRef.current;
    if (!elem) return;

    const handleHoldStart = () => setIsHolding(true);
    const handleHoldEnd = () => {
      setIsHolding(false);
      setIsBlowing(false);
      setBlowIntensity(0);
    };

    elem.addEventListener('mousedown', handleHoldStart);
    elem.addEventListener('touchstart', handleHoldStart);
    window.addEventListener('mouseup', handleHoldEnd);
    window.addEventListener('touchend', handleHoldEnd);

    return () => {
      elem.removeEventListener('mousedown', handleHoldStart);
      elem.removeEventListener('touchstart', handleHoldStart);
      window.removeEventListener('mouseup', handleHoldEnd);
      window.removeEventListener('touchend', handleHoldEnd);
    };
  }, []);

  useEffect(() => {
    if (isBlowing) {
      const particles = [];
      for (let i = 0; i < 15; i++) {
        particles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 10 + 5,
          speedX: (Math.random() - 0.5) * 5,
          speedY: (Math.random() - 0.5) * 5,
          opacity: Math.random() * 0.5 + 0.5,
        });
      }
      particlesRef.current = particles;
    }
  }, [isBlowing]);

  return (
    <div className="blow-container">
      <div
        ref={animationRef}
        className={`blow-element ${isBlowing ? 'active' : ''}`}
        style={{
          transform: `scale(${1 + blowIntensity / 50}) rotate(${blowIntensity / 10}deg)`,
        }}
      >
        Blow on your microphone!
        {!isBlowing && <div className="instruction">Hold & blow — or tap & blow</div>}
      </div>

      {isBlowing && (
        <div className="particles-container">
          {particlesRef.current.map((particle) => (
            <div
              key={particle.id}
              className="particle"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                opacity: particle.opacity,
                transform: `translate(${particle.speedX * blowIntensity / 10}px, 
                                       ${particle.speedY * blowIntensity / 10}px)`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
