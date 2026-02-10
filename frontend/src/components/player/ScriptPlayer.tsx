import { useCallback, useEffect, useState } from "react";
import { useScriptPlayer } from "../../hooks/useScriptPlayer";
import type { CharacterData } from "../../types";
import PlayerControls from "./PlayerControls";
import RoleSelectionDialog from "./RoleSelectionDialog";

interface Props {
  scriptId: string;
  scriptTitle: string;
  totalScenes: number;
  characters: CharacterData[];
  hasAudio: boolean;
}

function ScriptPlayer({
  scriptId,
  scriptTitle,
  totalScenes,
  characters,
  hasAudio,
}: Props) {
  const player = useScriptPlayer(scriptId);
  const [showRoleDialog, setShowRoleDialog] = useState(false);

  // Load playlist when audio is available
  useEffect(() => {
    if (hasAudio) {
      player.loadPlaylist();
    }
  }, [hasAudio]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard shortcuts ──
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          player.togglePlayPause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          player.playPrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          player.playNext();
          break;
      }
    },
    [player.togglePlayPause, player.playPrevious, player.playNext]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Current segment
  const currentSegment =
    player.filteredPlaylist.length > 0
      ? player.filteredPlaylist[player.currentIndex] ?? null
      : null;

  // ── No audio state ──
  if (!hasAudio) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
        <p className="text-sm text-secondary-text">
          Noch kein Audio generiert. Bitte klicke oben auf „Audio generieren".
        </p>
      </div>
    );
  }

  if (player.isLoading) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center shadow-sm ring-1 ring-border/40">
        <p className="text-sm text-secondary-text">Playlist wird geladen...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface shadow-sm ring-1 ring-border/40">
      {/* Header */}
      <div className="border-b border-border/40 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {scriptTitle}
            </h2>
            {currentSegment && (
              <p className="mt-0.5 text-[12px] text-secondary-text">
                Szene {currentSegment.scene_number} von {totalScenes}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowRoleDialog(true)}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
              player.myRoleEnabled && player.myRoleName
                ? "bg-primary/10 text-primary"
                : "border border-border text-secondary-text hover:bg-background"
            }`}
          >
            {player.myRoleEnabled && player.myRoleName
              ? `Rolle: ${player.myRoleName}`
              : "Rolle wählen"}
          </button>
        </div>
      </div>

      {/* Current segment display */}
      <div className="min-h-[180px] px-6 py-6">
        {currentSegment ? (
          <div className="flex flex-col items-center text-center">
            {/* "Your turn" banner */}
            {player.isMyTurn && (
              <div className="mb-4 w-full rounded-xl bg-primary/10 px-4 py-3">
                <p className="text-sm font-semibold text-primary">
                  DU BIST DRAN als {player.myRoleName}
                </p>
                <p className="mt-0.5 text-[12px] text-primary/70">
                  Sprich deine Zeilen laut.
                </p>
                <button
                  onClick={player.playNext}
                  className="mt-2 rounded-lg bg-primary px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-primary-hover"
                >
                  Weiter
                </button>
              </div>
            )}

            {/* Element type badge */}
            {currentSegment.element_type !== "DIALOGUE" && (
              <span className="mb-2 rounded-full bg-background px-2.5 py-0.5 text-[11px] font-medium text-secondary-text">
                {currentSegment.element_type === "SCENE_HEADING"
                  ? "Szene"
                  : currentSegment.element_type === "ACTION"
                    ? "Regieanweisung"
                    : currentSegment.element_type}
              </span>
            )}

            {/* Character name */}
            {currentSegment.character_name && (
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                {currentSegment.character_name}
              </p>
            )}

            {/* Text */}
            <p
              className={`text-base leading-relaxed ${
                currentSegment.element_type === "DIALOGUE"
                  ? "text-foreground"
                  : "italic text-secondary-text"
              }`}
            >
              {currentSegment.text}
            </p>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-secondary-text">
              Drücke Play, um das Drehbuch abzuspielen.
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="border-t border-border/40 px-6 py-5">
        <PlayerControls
          isPlaying={player.isPlaying}
          currentIndex={player.currentIndex}
          totalItems={player.filteredPlaylist.length}
          currentSceneNumber={currentSegment?.scene_number ?? null}
          playMode={player.playMode}
          includeComments={player.includeComments}
          scriptId={scriptId}
          currentSceneId={currentSegment?.scene_id ?? null}
          onTogglePlayPause={player.togglePlayPause}
          onPrevious={player.playPrevious}
          onNext={player.playNext}
          onSetPlayMode={player.setPlayMode}
          onSetIncludeComments={player.setIncludeComments}
        />
      </div>

      {/* Role selection dialog */}
      {showRoleDialog && (
        <RoleSelectionDialog
          characters={characters}
          currentRole={player.myRoleName}
          roleEnabled={player.myRoleEnabled}
          onSave={(name, enabled) => {
            player.setMyRole(name);
            player.setMyRoleEnabled(enabled);
          }}
          onClose={() => setShowRoleDialog(false)}
        />
      )}
    </div>
  );
}

export default ScriptPlayer;
