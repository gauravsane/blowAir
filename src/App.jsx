import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import mainLogo from "./assets/Foracort12.png";

const App = () => {
  const [blowIntensity, setBlowIntensity] = useState(0);
  const [isBlowing, setIsBlowing] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [leafImage, setLeafImage] = useState("1.png");
  const leafImages = [
    require("./assets/1.png"),
    require("./assets/2.png"),
    require("./assets/3.png"),
    require("./assets/4.png"),
    require("./assets/5.png"),
    require("./assets/6.png"),
    require("./assets/7.png"),
    require("./assets/8.png"),
  ];

  const animationRef = useRef(null);

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

        if (intensity > 10 && isHolding) {
          const cappedIntensity = Math.min(intensity, 50);
          setBlowIntensity(cappedIntensity);
          setIsBlowing(true);
          // Pick a random leaf image
          const imgIndex = Math.floor(Math.random() * 8) + 1;
          setLeafImage(leafImages[imgIndex - 1]);
        } else {
          setIsBlowing(false);
          setBlowIntensity(0);
        }

        rafId = requestAnimationFrame(analyze);
      };

      analyze();
    };

    const initAudio = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Microphone not supported.");
        }

        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(mediaStream);
        microphone.connect(analyser);
        analyser.fftSize = 256;

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
    const elem = animationRef.current;
    if (!elem) return;

    const handleHoldStart = () => setIsHolding(true);
    const handleHoldEnd = () => {
      setIsHolding(false);
      setIsBlowing(false);
      setBlowIntensity(0);
    };

    elem.addEventListener("mousedown", handleHoldStart);
    elem.addEventListener("touchstart", handleHoldStart);
    window.addEventListener("mouseup", handleHoldEnd);
    window.addEventListener("touchend", handleHoldEnd);

    return () => {
      elem.removeEventListener("mousedown", handleHoldStart);
      elem.removeEventListener("touchstart", handleHoldStart);
      window.removeEventListener("mouseup", handleHoldEnd);
      window.removeEventListener("touchend", handleHoldEnd);
    };
  }, []);

  return (
    <div className="blow-container">
      <div
        ref={animationRef}
        className="blow-element"
        style={{
          transform: `translate(${
            blowIntensity * 1.5
          }px, ${-blowIntensity}px) rotate(${blowIntensity / 5}deg)`,
          transition: "transform 0.2s ease-out",
        }}
      >
        <img src={leafImage} alt="leaf" className="leaf-image" />
      </div>

      <div className="logo-section">
        <img src={mainLogo} alt="Logo" className="logo" />
      </div>
    </div>
  );
};

export default App;
