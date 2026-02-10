export interface HealthResponse {
  status: string;
  app: string;
}

export interface ScriptElement {
  id: number;
  element_type:
    | "DIALOGUE"
    | "ACTION"
    | "SCENE_HEADING"
    | "TRANSITION"
    | "PARENTHETICAL";
  character_name: string | null;
  text: string;
  order_index: number;
  mood: string | null;
  audio_file_path: string | null;
}

export interface SceneData {
  id: number;
  scene_number: number;
  heading: string;
  scene_type: string;
  order_index: number;
  elements: ScriptElement[];
}

export interface CharacterData {
  id: number;
  name: string;
  voice_id: string | null;
  dialogue_count: number;
}

export interface ScriptDetail {
  id: number;
  filename: string;
  title: string | null;
  uploaded_at: string;
  total_scenes: number;
  total_characters: number;
  scenes: SceneData[];
  characters: CharacterData[];
}

export interface UploadResponse {
  id: number;
  filename: string;
  total_scenes: number;
  total_characters: number;
}

// Audio / TTS types

export interface GenerateAudioResponse {
  script_id: number;
  total_dialogues: number;
  generated_count: number;
  status: string;
}

export interface AudioStatusResponse {
  script_id: number;
  total_dialogues: number;
  with_audio: number;
  status: "pending" | "in_progress" | "completed";
}

export interface PlaylistItem {
  element_id: number;
  scene_id: number;
  scene_number: number;
  order_index: number;
  type: string;
  character_name: string | null;
  text: string;
  audio_url: string | null;
}

export interface PlaylistResponse {
  script_id: number;
  items: PlaylistItem[];
}
