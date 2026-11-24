import { useEffect, useState } from "react";
import { API_URL } from "../api/client.ts";

export function MediaImage({ file, alt, className }: { file: string | null | undefined; alt: string; className?: string }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!file) return;
    let active = true;
    let url = "";
    fetch(`${API_URL}/api/media/${file}`, { credentials: "include" })
      .then((response) => (response.ok ? response.blob() : Promise.reject(new Error("missing"))))
      .then((blob) => {
        url = URL.createObjectURL(blob);
        if (active) setSrc(url);
      })
      .catch(() => {
        if (active) setSrc("");
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!file || !src) {
    return <span className={`media-fallback ${className ?? ""}`} aria-hidden="true" />;
  }
  return <img className={className} src={src} alt={alt} />;
}
