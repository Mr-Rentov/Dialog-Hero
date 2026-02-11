import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ScriptAudioPanel from "../components/ScriptAudioPanel";
import ScriptPlayer from "../components/player/ScriptPlayer";
import api from "../services/api";
import type {
  AudioStatusResponse,
  ScriptDetail,
  SceneData,
  ScriptElement,
} from "../types";

function ElementRenderer({ element }: { element: ScriptElement }) {
  switch (element.element_type) {
    case "SCENE_HEADING":
      return (
        <div className="mb-4 mt-8 first:mt-0">
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
            {element.text}
          </h3>
        </div>
      );
    case "ACTION":
      return (
        <p className="my-2 text-[14px] italic leading-relaxed text-secondary-text">
          {element.text}
        </p>
      );
    case "DIALOGUE":
      return (
        <div className="my-3 ml-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {element.character_name}
          </p>
          <p className="mt-0.5 text-[14px] leading-relaxed text-foreground">
            {element.text}
          </p>
        </div>
      );
    case "PARENTHETICAL":
      return (
        <p className="ml-20 text-[13px] italic text-secondary-text">
          {element.text}
        </p>
      );
    case "TRANSITION":
      return (
        <p className="my-4 text-right text-xs font-semibold uppercase tracking-wider text-secondary-text">
          {element.text}
        </p>
      );
    default:
      return (
        <p className="my-1 text-[14px] text-foreground">{element.text}</p>
      );
  }
}

function ScenePanel({
  scenes,
  activeScene,
  onSelect,
}: {
  scenes: SceneData[];
  activeScene: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <nav className="space-y-0.5">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-secondary-text">
        Szenen
      </h2>
      {scenes.map((scene) => (
        <button
          key={scene.id}
          onClick={() => onSelect(scene.id)}
          className={`block w-full rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
            activeScene === scene.id
              ? "bg-primary/10 font-medium text-primary"
              : "text-foreground hover:bg-background"
          }`}
        >
          <span className="font-medium">Sz. {scene.scene_number}</span>
          <span className="ml-1.5 text-secondary-text">
            {scene.heading.length > 30
              ? scene.heading.slice(0, 30) + "..."
              : scene.heading}
          </span>
        </button>
      ))}
    </nav>
  );
}

function ScriptViewPage() {
  const { id } = useParams<{ id: string }>();
  const [script, setScript] = useState<ScriptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeScene, setActiveScene] = useState<number | null>(null);
  const [hasAudio, setHasAudio] = useState(false);
  const sceneRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<ScriptDetail>(`/scripts/${id}`)
      .then((res) => {
        setScript(res.data);
        if (res.data.scenes.length > 0 && res.data.scenes[0]) {
          setActiveScene(res.data.scenes[0].id);
        }
      })
      .catch(() => setError("Drehbuch konnte nicht geladen werden."))
      .finally(() => setLoading(false));
  }, [id]);

  const scrollToScene = (sceneId: number) => {
    setActiveScene(sceneId);
    const el = sceneRefs.current.get(sceneId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAudioStatusChange = useCallback(
    (status: AudioStatusResponse) => {
      setHasAudio(
        status.status === "completed" && status.total_dialogues > 0
      );
    },
    []
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-secondary-text">Laden...</p>
      </div>
    );
  }

  if (error || !script) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-error">{error ?? "Drehbuch nicht gefunden."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Audio generation panel – always visible */}
      <div className="mb-6">
        <ScriptAudioPanel
          scriptId={script.id}
          onAudioStatusChange={handleAudioStatusChange}
        />
      </div>

      <div className="flex gap-0">
        {/* Left: Scene list */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto pr-4">
            <ScenePanel
              scenes={script.scenes}
              activeScene={activeScene}
              onSelect={scrollToScene}
            />
          </div>
        </aside>

        {/* Center: Script content */}
        <section className="min-w-0 flex-1 rounded-2xl bg-surface p-8 shadow-sm ring-1 ring-border/40">
          <header className="mb-8 border-b border-border/40 pb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {script.title ?? script.filename}
            </h1>
            <p className="mt-1 text-sm text-secondary-text">
              {script.total_scenes} Szenen &middot; {script.total_characters}{" "}
              Charaktere
            </p>
          </header>

          {script.scenes.map((scene) => (
            <div
              key={scene.id}
              ref={(el) => {
                if (el) sceneRefs.current.set(scene.id, el);
              }}
              className="mb-10"
            >
              {scene.elements.map((elem) => (
                <ElementRenderer key={elem.id} element={elem} />
              ))}
            </div>
          ))}
        </section>

        {/* Right: Character list */}
        <aside className="hidden w-52 shrink-0 xl:block">
          <div className="sticky top-16 ml-6 max-h-[calc(100vh-5rem)] space-y-6 overflow-y-auto">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-secondary-text">
              Charaktere
            </h2>
            <div className="space-y-1">
              {script.characters
                .sort((a, b) => b.dialogue_count - a.dialogue_count)
                .map((char) => (
                  <div
                    key={char.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                  >
                    <span className="text-[13px] font-medium text-foreground">
                      {char.name}
                    </span>
                    <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-secondary-text">
                      {char.dialogue_count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Audio Player – below the main content area */}
      <div className="mt-8">
        <ScriptPlayer
          scriptId={id!}
          scriptTitle={script.title ?? script.filename}
          totalScenes={script.total_scenes}
          characters={script.characters}
          hasAudio={hasAudio}
        />
      </div>
    </div>
  );
}

export default ScriptViewPage;
