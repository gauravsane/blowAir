import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import mainLogo from "./assets/Foracort12.png";
import image1 from "./assets/1.png";
import image2 from "./assets/2.png";
import image3 from "./assets/3.png";
import image4 from "./assets/4.png";
import image5 from "./assets/5.png";
import image6 from "./assets/6.png";
import image7 from "./assets/7.png";
import image8 from "./assets/8.png";

const leafImages = [
  image1,
  image2,
  image3,
  image4,
  image5,
  image6,
  image7,
  image8,
];

const generateLeaves = (count) => {
  const leaves = [];
  for (let i = 0; i < count; i++) {
    const img = leafImages[i % leafImages.length];
    const x = Math.random() * (500 - 60);
    const y = Math.random() * (500 - 60);
    const rotation = Math.random() * 360;
    // leaves.push({ id: i, src: img, x, y, rotation, removed: false });
    leaves.push({ id: i, src: img, x, y, rotation, hasMoved: false });
  }
  return leaves;
};

const App = () => {
  const [leaves, setLeaves] = useState(generateLeaves(250)); // Try 60 or more
  const [isHolding, setIsHolding] = useState(false);
  const containerRef = useRef(null);
  const [logoVisible,setShowLogo] = useState(false);

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
        const lowFreqRange = dataArray.slice(0, 4);
        const intensity =
          lowFreqRange.reduce((a, b) => a + b, 0) / lowFreqRange.length;

        if (intensity > 200 && isHolding) {
          setShowLogo(true)
          setLeaves((prev) =>
            prev.map((leaf) => {
              if (leaf.hasMoved || Math.random() > 0.3) return leaf;
              // const angle = Math.atan2(leaf.y - 250, leaf.x - 250); // from center
              // const distance = 300 + Math.random() * 200;
              // const newX = leaf.x + Math.cos(angle) * distance;
              // const newY = leaf.y + Math.sin(angle) * distance;
              const angle = Math.atan2(leaf.y - 250, leaf.x - 250);
              let newX, newY;
              let tries = 0;

              do {
                const distance = 50 + Math.random() * 100; // shorter distance
                newX = leaf.x + Math.cos(angle) * distance;
                newY = leaf.y + Math.sin(angle) * distance;
                tries++;
              } while (
                // prevent overlap with center (100px radius)
                Math.hypot(newX - 250, newY - 250) < 100 &&
                tries < 10
              );

              // keep within bounds of 0–500px
              newX = Math.max(0, Math.min(440, newX));
              newY = Math.max(0, Math.min(440, newY));

              return {
                ...leaf,
                x: newX,
                y: newY,
                hasMoved: true,
              };
            })
          );
        }

        rafId = requestAnimationFrame(analyze);
      };

      analyze();
    };

    const initAudio = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(mediaStream);
        microphone.connect(analyser);
        analyser.fftSize = 1024;

        detectBlowing();
      } catch (err) {
        console.error("Microphone error:", err);
      }
    };

    initAudio();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (mediaStream) mediaStream.getTracks().forEach((track) => track.stop());
      if (audioContext) audioContext.close();
    };
  }, [isHolding]);

  useEffect(() => {
    const elem = containerRef.current;
    if (!elem) return;

    const start = () => setIsHolding(true);
    const end = () => setIsHolding(false);

    elem.addEventListener("mousedown", start);
    elem.addEventListener("touchstart", start);
    window.addEventListener("mouseup", end);
    window.addEventListener("touchend", end);

    return () => {
      elem.removeEventListener("mousedown", start);
      elem.removeEventListener("touchstart", start);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchend", end);
    };
  }, []);

  return (
    <div className="blow-container" ref={containerRef}>
      <div className="logo-section">
       { logoVisible ?
        <img src={mainLogo} alt="Logo" className="logo" style={{width: 300}}/> : ""}
        {leaves.map((leaf) => (
          <img
            key={leaf.id}
            src={leaf.src}
            alt="leaf"
            className={`leaf`} // no condition on removed
            style={{
              top: `${leaf.y}px`, // use 'px' instead of '%' since x/y are from `Math.random() * 500`
              left: `${leaf.x}px`,
              transform: `rotate(${leaf.rotation}deg)`,
              position: "absolute",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default App;
