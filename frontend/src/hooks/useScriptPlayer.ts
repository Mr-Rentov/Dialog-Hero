import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";
import type { PlaylistItem, PlaylistResponse } from "../types";

export type PlayMode = "full" | "dialogOnly";

export interface ScriptPlayerState {
  playlist: PlaylistItem[];
  filteredPlaylist: PlaylistItem[];
  currentIndex: number;
  isPlaying: boolean;
  playMode: PlayMode;
  includeComments: boolean;
  myRoleName: string | null;
  myRoleEnabled: boolean;
  isMyTurn: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ScriptPlayerActions {
  loadPlaylist: () => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  jumpTo: (index: number) => void;
  setMyRole: (name: string | null) => void;
  setMyRoleEnabled: (enabled: boolean) => void;
  setPlayMode: (mode: PlayMode) => void;
  setIncludeComments: (include: boolean) => void;
}

const API_BASE = "";

function estimateDurationMs(text: string): number {
  return Math.max(1500, text.length * 60);
}

export function useScriptPlayer(scriptId: string): ScriptPlayerState & ScriptPlayerActions {
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayModeState] = useState<PlayMode>("full");
  const [includeComments, setIncludeCommentsState] = useState(true);
  const [myRoleName, setMyRoleName] = useState<string | null>(null);
  const [myRoleEnabled, setMyRoleEnabledState] = useState(false);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const myTurnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef = useRef(false);

  // Keep isPlayingRef in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // ── Filtered playlist based on mode ──
  const filteredPlaylist = useCallback(() => {
    let items = playlist;
    if (playMode === "dialogOnly") {
      items = items.filter((item) => item.element_type === "DIALOGUE");
    } else if (!includeComments) {
      items = items.filter((item) => !item.is_comment);
    }
    return items;
  }, [playlist, playMode, includeComments]);

  const filtered = filteredPlaylist();

  // ── Load playlist from backend ──
  const loadPlaylist = useCallback(() => {
    setIsLoading(true);
    setError(null);
    api
      .get<PlaylistResponse>(`/scripts/${scriptId}/playlist`)
      .then((res) => {
        setPlaylist(res.data.items);
        setCurrentIndex(0);
      })
      .catch(() => setError("Playlist konnte nicht geladen werden."))
      .finally(() => setIsLoading(false));
  }, [scriptId]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (myTurnTimerRef.current) {
        clearTimeout(myTurnTimerRef.current);
      }
    };
  }, []);

  // ── Core playback logic ──
  const playSegment = useCallback(
    (index: number) => {
      // Clear previous
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (myTurnTimerRef.current) {
        clearTimeout(myTurnTimerRef.current);
        myTurnTimerRef.current = null;
      }
      setIsMyTurn(false);

      if (index < 0 || index >= filtered.length) {
        setIsPlaying(false);
        setCurrentIndex(0);
        return;
      }

      setCurrentIndex(index);
      const segment = filtered[index];
      if (!segment) return;

      // Check if this is the user's own role
      const isOwnRole =
        myRoleEnabled &&
        myRoleName &&
        segment.element_type === "DIALOGUE" &&
        segment.character_name === myRoleName;

      if (isOwnRole) {
        setIsMyTurn(true);
        // Wait estimated duration, then auto-advance
        const duration = estimateDurationMs(segment.text);
        myTurnTimerRef.current = setTimeout(() => {
          setIsMyTurn(false);
          if (isPlayingRef.current) {
            playSegment(index + 1);
          }
        }, duration);
        return;
      }

      // Play audio if available
      if (segment.audio_url) {
        const audio = new Audio(`${API_BASE}${segment.audio_url}`);
        audioRef.current = audio;

        audio.onended = () => {
          if (isPlayingRef.current) {
            playSegment(index + 1);
          }
        };

        audio.onerror = () => {
          // Skip to next on error
          if (isPlayingRef.current) {
            playSegment(index + 1);
          }
        };

        audio.play().catch(() => {
          // Browser might block autoplay
          setIsPlaying(false);
        });
      } else {
        // No audio – skip (for comments/non-dialogue without audio)
        // Show briefly then advance
        if (isPlayingRef.current) {
          myTurnTimerRef.current = setTimeout(() => {
            playSegment(index + 1);
          }, 1500);
        }
      }
    },
    [filtered, myRoleEnabled, myRoleName]
  );

  // ── Controls ──
  const play = useCallback(() => {
    setIsPlaying(true);
    playSegment(currentIndex);
  }, [currentIndex, playSegment]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (myTurnTimerRef.current) {
      clearTimeout(myTurnTimerRef.current);
      myTurnTimerRef.current = null;
    }
    setIsMyTurn(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const playNext = useCallback(() => {
    const next = Math.min(currentIndex + 1, filtered.length - 1);
    setCurrentIndex(next);
    if (isPlaying) {
      playSegment(next);
    }
  }, [currentIndex, filtered.length, isPlaying, playSegment]);

  const playPrevious = useCallback(() => {
    const prev = Math.max(currentIndex - 1, 0);
    setCurrentIndex(prev);
    if (isPlaying) {
      playSegment(prev);
    }
  }, [currentIndex, isPlaying, playSegment]);

  const jumpTo = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      if (isPlaying) {
        playSegment(index);
      }
    },
    [isPlaying, playSegment]
  );

  const setMyRole = useCallback((name: string | null) => {
    setMyRoleName(name);
  }, []);

  const setMyRoleEnabled = useCallback((enabled: boolean) => {
    setMyRoleEnabledState(enabled);
  }, []);

  const setPlayMode = useCallback(
    (mode: PlayMode) => {
      setPlayModeState(mode);
      setCurrentIndex(0);
      if (isPlaying) {
        pause();
      }
    },
    [isPlaying, pause]
  );

  const setIncludeComments = useCallback(
    (include: boolean) => {
      setIncludeCommentsState(include);
      setCurrentIndex(0);
      if (isPlaying) {
        pause();
      }
    },
    [isPlaying, pause]
  );

  return {
    playlist,
    filteredPlaylist: filtered,
    currentIndex,
    isPlaying,
    playMode,
    includeComments,
    myRoleName,
    myRoleEnabled,
    isMyTurn,
    isLoading,
    error,
    loadPlaylist,
    play,
    pause,
    togglePlayPause,
    playNext,
    playPrevious,
    jumpTo,
    setMyRole,
    setMyRoleEnabled,
    setPlayMode,
    setIncludeComments,
  };
}
