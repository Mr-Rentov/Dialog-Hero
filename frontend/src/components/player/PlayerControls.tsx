import type { PlayMode } from "../../hooks/useScriptPlayer";

interface Props {
  isPlaying: boolean;
  currentIndex: number;
  totalItems: number;
  currentSceneNumber: number | null;
  playMode: PlayMode;
  includeComments: boolean;
  scriptId: string;
  currentSceneId: number | null;
  onTogglePlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSetPlayMode: (mode: PlayMode) => void;
  onSetIncludeComments: (include: boolean) => void;
}

function PlayerControls({
  isPlaying,
  currentIndex,
  totalItems,
  currentSceneNumber,
  playMode,
  includeComments,
  scriptId,
  currentSceneId,
  onTogglePlayPause,
  onPrevious,
  onNext,
  onSetPlayMode,
  onSetIncludeComments,
}: Props) {
  const handleDownload = (scope: "full" | "scene") => {
    const params = new URLSearchParams({ scope });
    if (scope === "scene" && currentSceneId) {
      params.set("scene_id", String(currentSceneId));
    }
    window.open(
      `/api/v1/scripts/${scriptId}/download?${params}`,
      "_blank"
    );
  };

  return (
    <div className="space-y-4">
      {/* Main controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Previous */}
        <button
          onClick={onPrevious}
          disabled={currentIndex <= 0}
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-background disabled:opacity-30"
          title="Vorheriger Dialog"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={onTogglePlayPause}
          disabled={totalItems === 0}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all hover:bg-primary-hover hover:shadow-xl active:scale-95 disabled:opacity-50"
          title={isPlaying ? "Pause" : "Abspielen"}
        >
          {isPlaying ? (
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="ml-0.5 h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          disabled={currentIndex >= totalItems - 1}
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-background disabled:opacity-30"
          title="Nächster Dialog"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Progress info */}
      <div className="text-center text-[13px] text-secondary-text">
        {totalItems > 0 ? (
          <>
            Dialog {currentIndex + 1} von {totalItems}
            {currentSceneNumber && (
              <span className="mx-1.5">|</span>
            )}
            {currentSceneNumber && <>Szene {currentSceneNumber}</>}
          </>
        ) : (
          "Keine Segmente verfügbar"
        )}
      </div>

      {/* Progress bar */}
      {totalItems > 0 && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalItems) * 100}%` }}
          />
        </div>
      )}

      {/* Mode toggles */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-secondary-text">
          <input
            type="checkbox"
            checked={playMode === "dialogOnly"}
            onChange={(e) => onSetPlayMode(e.target.checked ? "dialogOnly" : "full")}
            className="h-3.5 w-3.5 rounded border-border accent-primary"
          />
          Nur Dialoge
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-secondary-text">
          <input
            type="checkbox"
            checked={includeComments}
            onChange={(e) => onSetIncludeComments(e.target.checked)}
            disabled={playMode === "dialogOnly"}
            className="h-3.5 w-3.5 rounded border-border accent-primary disabled:opacity-40"
          />
          Mit Kommentar
        </label>
      </div>

      {/* Download */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <button
          onClick={() => handleDownload("full")}
          className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-background"
        >
          MP3 herunterladen
        </button>
        {currentSceneId && (
          <button
            onClick={() => handleDownload("scene")}
            className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-secondary-text transition-colors hover:bg-background"
          >
            Szene als MP3
          </button>
        )}
      </div>
    </div>
  );
}

export default PlayerControls;
