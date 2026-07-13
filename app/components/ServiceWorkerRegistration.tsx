"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // O site continua funcional mesmo se o navegador bloquear o registro.
      });
    }
  }, []);

  return null;
}
