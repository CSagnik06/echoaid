import { useCallback, useEffect } from "react";

export function useVoiceSynthesis() {
  const speak = useCallback((text, language = "en-IN", onEnd = null) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    // Map internal languages to BCP-47 for synthesis
    const langMap = {
      "English": "en-IN",
      "Hindi": "hi-IN",
      "Bengali": "bn-IN",
      "Marathi": "mr-IN",
      "Gujarati": "gu-IN",
      "Telugu": "te-IN",
      "Tamil": "ta-IN"
    };
    
    const bcp47 = langMap[language] || "en-IN";
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = bcp47;
    if (onEnd) {
      utterance.onend = onEnd;
    }
    window.speechSynthesis.speak(utterance);
  }, []);
  
  const stop = useCallback(() => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { speak, stop };
}
