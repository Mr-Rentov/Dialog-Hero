import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";
import type { AudioStatusResponse, GenerateAudioResponse } from "../types";

interface Props {
  scriptId: number;
  onAudioStatusChange?: (status: AudioStatusResponse) => void;
}

function ScriptAudioPanel({ scriptId, onAudioStatusChange }: Props) {
  const [status, setStatus] = useState<AudioStatusResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // -----------------------------------------------------------
  // Fetch audio status
  // -----------------------------------------------------------

  const fetchStatus = useCallback(() => {
    api
      .get<AudioStatusResponse>(`/scripts/${scriptId}/audio-status`)
      .then((res) => {
        setStatus(res.data);
        onAudioStatusChange?.(res.data);
      })
      .catch(() => {
        /* silent – status is optional info */
      });
  }, [scriptId, onAudioStatusChange]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll while generating or in_progress
  useEffect(() => {
    if (generating || status?.status === "in_progress") {
      pollRef.current = setInterval(fetchStatus, 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [generating, status?.status, fetchStatus]);

  // -----------------------------------------------------------
  // Generate audio
  // -----------------------------------------------------------

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.post<GenerateAudioResponse>(
        `/scripts/${scriptId}/generate-audio`
      );
      const data = res.data;
      setSuccessMsg(
        `Audio generiert: ${data.generated_count} von ${data.total_dialogues} Dialogen.`
      );
      fetchStatus();
    } catch {
      setError("Audio-Generierung fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setGenerating(false);
    }
  };

  // -----------------------------------------------------------
  // Render
  // -----------------------------------------------------------

  const isCompleted =
    status?.status === "completed" && (status.total_dialogues ?? 0) > 0;

  return (
    <div className="rounded-xl border border-border/40 bg-surface p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-secondary-text">
        Audio
      </h3>

      {/* Status info */}
      {status && status.total_dialogues > 0 && (
        <p className="mb-3 text-[13px] text-foreground">
          <span className="font-medium">{status.with_audio}</span>
          <span className="text-secondary-text">
            {" "}
            / {status.total_dialogues} Dialoge mit Audio
          </span>
          {status.status === "completed" && (
            <span className="ml-2 inline-block rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
              Fertig
            </span>
          )}
        </p>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {generating ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Audio wird generiert...
          </span>
        ) : isCompleted ? (
          "Audio erneut generieren"
        ) : (
          "Audio generieren"
        )}
      </button>

      {/* Progress bar while generating */}
      {generating && status && status.total_dialogues > 0 && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{
                width: `${Math.round((status.with_audio / status.total_dialogues) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Messages */}
      {error && <p className="mt-3 text-[13px] text-error">{error}</p>}
      {successMsg && !error && (
        <p className="mt-3 text-[13px] text-success">{successMsg}</p>
      )}
    </div>
  );
}

export default ScriptAudioPanel;
