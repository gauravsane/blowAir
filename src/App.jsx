import React, { useState, useEffect, useRef } from 'react';
import "./App.css"
const App = () => {
  const [blowIntensity, setBlowIntensity] = useState(0);
  const [isBlowing, setIsBlowing] = useState(false);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const [isHolding, setIsHolding] = useState(false);


 useEffect(() => {
    let audioContext;
    let analyser;
    let microphone;
    let rafId;
    let mediaStream;

    const initAudio = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("getUserMedia is not supported in this browser.");
        }
    
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(mediaStream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
    
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
    
        const detectBlowing = () => {
          analyser.getByteFrequencyData(dataArray);
          const lowFreqRange = dataArray.slice(0, 10);
          const intensity = lowFreqRange.reduce((a, b) => a + b, 0) / lowFreqRange.length;
        
          if (intensity > 30 && isHolding) {
            setBlowIntensity(Math.min(intensity, 50));
            setIsBlowing(true);
          } else {
            setIsBlowing(false);
          }
        
          rafId = requestAnimationFrame(detectBlowing);
        };
        
    
        detectBlowing();
      } catch (err) {
        console.error('Error accessing microphone:', err);
        setupFallbackInteraction();
      }
    };
    

    const setupFallbackInteraction = () => {
      const handleHoldStart = () => setIsHolding(true);
      const handleHoldEnd = () => {
        setIsHolding(false);
        setIsBlowing(false); // stop blowing effect on release
        setBlowIntensity(0);
      };
    
      animationRef.current.addEventListener('mousedown', handleHoldStart);
      animationRef.current.addEventListener('touchstart', handleHoldStart);
      window.addEventListener('mouseup', handleHoldEnd);
      window.addEventListener('touchend', handleHoldEnd);
    };
    

    initAudio();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
      if (audioContext) audioContext.close();
    };
  }, []);

  // useEffect(()=>{
  //   setupFallbackInteraction();
  // },[])

  // Generate particles when blowing
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
          opacity: Math.random() * 0.5 + 0.5
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
          transform: `scale(${1 + blowIntensity / 50}) rotate(${blowIntensity / 10}deg)`
        }}
      >
        Blow on your microphone!
        {!isBlowing && <div className="instruction">Or click/touch to simulate</div>}
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
                                       ${particle.speedY * blowIntensity / 10}px)`
              }}
            />
          ))}
        </div>
      )}
    </div>
  ); 
};

export default App;
