import { useState } from "react";
import type { CharacterData } from "../../types";

interface Props {
  characters: CharacterData[];
  currentRole: string | null;
  roleEnabled: boolean;
  onSave: (name: string | null, enabled: boolean) => void;
  onClose: () => void;
}

function RoleSelectionDialog({
  characters,
  currentRole,
  roleEnabled,
  onSave,
  onClose,
}: Props) {
  const [selectedName, setSelectedName] = useState<string | null>(currentRole);
  const [enabled, setEnabled] = useState(roleEnabled);

  const sortedChars = [...characters].sort(
    (a, b) => b.dialogue_count - a.dialogue_count
  );

  const handleSave = () => {
    onSave(enabled ? selectedName : null, enabled);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-surface p-6 shadow-2xl ring-1 ring-border/40">
        <h2 className="text-lg font-semibold text-foreground">
          Meine Rolle wählen
        </h2>
        <p className="mt-1 text-[13px] text-secondary-text">
          Deine eigenen Dialoge werden stummgeschaltet, damit du sie selbst
          sprechen kannst.
        </p>

        {/* Enable toggle */}
        <label className="mt-5 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-sm text-foreground">
            Ich möchte meine Rolle selbst sprechen
          </span>
        </label>

        {/* Character select */}
        {enabled && (
          <div className="mt-4">
            <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-wider text-secondary-text">
              Charakter
            </label>
            <select
              value={selectedName ?? ""}
              onChange={(e) =>
                setSelectedName(e.target.value || null)
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">— Bitte wählen —</option>
              {sortedChars.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.dialogue_count} Dialoge)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={enabled && !selectedName}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            Speichern
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background"
          >
            Später entscheiden
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoleSelectionDialog;
