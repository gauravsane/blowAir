import React, { useState, useEffect } from 'react';

const App = () => {
  const [recognizedText, setRecognizedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const newRecognition = new window.webkitSpeechRecognition();
      newRecognition.continuous = true;
      newRecognition.interimResults = true;
      newRecognition.lang = 'en-US'; // Or another language

      newRecognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setRecognizedText(finalTranscript + interimTranscript);
      };

      newRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      newRecognition.onend = () => {
        setIsListening(false);
      };
      setRecognition(newRecognition);
    } else {
      alert('Speech recognition is not supported in this browser.');
    }
  }, []);

  const toggleListening = () => {
    if (recognition) {
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
      setIsListening(!isListening);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Speech Recognition</h1>
      <button
        onClick={toggleListening}
        style={{ padding: '10px', fontSize: '16px', cursor: 'pointer' }}
      >
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
      <textarea
        rows="5"
        cols="50"
        value={recognizedText}
        readOnly
        placeholder="Speak here..."
        style={{ border: '1px solid #ccc', padding: '8px', fontSize: '16px', marginTop: '10px' }}
      />
      {recognizedText && (
        <div style={{ marginTop: '20px' }}>
          <h3>Recognized Text:</h3>
          <p style={{ fontSize: '18px' }}>{recognizedText}</p>
        </div>
      )}
    </div>
  );
};

export default App;
