import { useRef, useState } from "react";
function useVoiceRecorder() {
  const [recording, setRecording] = useState(false), [error, setError] = useState(), rec = useRef(), stream = useRef();
  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Microphone recording is not supported in this browser.");
      return false;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      rec.current = new MediaRecorder(stream.current);
      rec.current.ondataavailable = (e) => chunks.push(e.data);
      rec.current.start();
      setRecording(true);
      setError(void 0);
      return true;
    } catch {
      setError("Microphone permission was not granted.");
      return false;
    }
  };
  const stop = () => new Promise((resolve) => {
    if (!rec.current) {
      resolve(null);
      return;
    }
    rec.current.onstop = () => {
      const blob = new Blob(rec.current.chunks || [], { type: "audio/webm" });
      stream.current?.getTracks().forEach((t) => t.stop());
      setRecording(false);
      resolve(blob.size ? blob : null);
    };
    const chunks = [];
    rec.current.ondataavailable = (e) => chunks.push(e.data);
    rec.current.onstop = () => {
      stream.current?.getTracks().forEach((t) => t.stop());
      setRecording(false);
      resolve(new Blob(chunks, { type: "audio/webm" }));
    };
    rec.current.stop();
  });
  return { recording, error, start, stop };
}
export {
  useVoiceRecorder
};
