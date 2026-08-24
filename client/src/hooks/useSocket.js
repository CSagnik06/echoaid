import { useEffect, useState } from "react";
import { io } from "socket.io-client";
function useSocket(onAlert) {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, { path: "/socket.io", reconnection: true, timeout: 4e3 });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    for (const e of ["sos:created", "sos:update", "sos:acknowledged"]) socket.on(e, onAlert);
    return () => {
      socket.disconnect();
    };
  }, [onAlert]);
  return connected;
}
export {
  useSocket
};
