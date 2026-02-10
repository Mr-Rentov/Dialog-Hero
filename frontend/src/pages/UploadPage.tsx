import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import type { UploadResponse } from "../types";
import Button from "../components/ui/Button";

function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    setError(null);
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setError("Bitte lade eine PDF-Datei hoch.");
      return;
    }
    setFile(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile],
  );

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post<UploadResponse>("/scripts/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });
      navigate(`/scripts/${res.data.id}`);
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as Record<string, unknown>).response === "object"
      ) {
        const response = (err as { response: { data?: { detail?: string } } })
          .response;
        setError(response.data?.detail ?? "Upload fehlgeschlagen.");
      } else {
        setError("Upload fehlgeschlagen. Ist das Backend gestartet?");
      }
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="text-center text-3xl font-semibold tracking-tight text-foreground">
        Drehbuch hochladen
      </h1>
      <p className="mt-3 text-center text-secondary-text">
        Lade ein PDF-Drehbuch hoch, um es automatisch zu analysieren.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`mt-10 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40"
        }`}
      >
        <div className="mb-4 text-4xl text-secondary-text">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        {file ? (
          <p className="text-[15px] font-medium text-foreground">{file.name}</p>
        ) : (
          <>
            <p className="text-[15px] font-medium text-foreground">
              PDF hierher ziehen
            </p>
            <p className="mt-1 text-sm text-secondary-text">
              oder klicken, um eine Datei auszuwählen
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {error && (
        <p className="mt-4 text-center text-sm text-error">{error}</p>
      )}

      {file && (
        <div className="mt-6 flex flex-col items-center gap-4">
          {uploading && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? `Hochladen... ${progress}%` : "Analyse starten"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default UploadPage;
