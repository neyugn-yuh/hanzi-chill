// API service — giao tiếp với backend Express

const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:3001" : "");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Types ────────────────────────────────────────────────

export interface TranslationExercise {
  id: string;
  vietnamese: string;
  chinese: string;
  pinyin: string;
  wordType: string;
}

export interface SentenceTranslationExercise {
  id: string;
  vietnameseSentence: string;
  chineseSentence: string;
  pinyin: string;
}

export interface SentenceExercise {
  id: string;
  correctSentence: string;
  pinyin: string;
  vietnameseMeaning: string;
}

export interface HskLevel {
  id: string;
  name: string;
  translationExercises: TranslationExercise[];
  sentenceTranslationExercises: SentenceTranslationExercise[];
  sentenceExercises: SentenceExercise[];
}

// ─── Level API ─────────────────────────────────────────────

export const api = {
  /** Lấy tất cả cấp độ + bài tập */
  getLevels: () => request<HskLevel[]>("/api/levels"),

  /** Ghi đè toàn bộ cấp độ (dùng cho import JSON) */
  putLevels: (levels: HskLevel[]) =>
    request<HskLevel[]>("/api/levels", {
      method: "PUT",
      body: JSON.stringify({ levels }),
    }),

  /** Tạo cấp độ mới */
  createLevel: (name: string) =>
    request<HskLevel>("/api/levels", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  /** Cập nhật tên cấp độ */
  updateLevel: (id: string, name: string) =>
    request<HskLevel>(`/api/levels/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    }),

  /** Xóa cấp độ */
  deleteLevel: (id: string) =>
    request<{ ok: boolean }>(`/api/levels/${id}`, { method: "DELETE" }),

  /** Cập nhật thứ tự cấp độ */
  reorderLevels: (orderedIds: string[]) =>
    request<{ ok: boolean }>("/api/levels/reorder", {
      method: "PUT",
      body: JSON.stringify({ orderedIds }),
    }),

  // ─── Exercise API ────────────────────────────────

  createExercise: (
    type: "translation" | "sentenceTranslation" | "sentence",
    levelId: string,
    data: Record<string, string>
  ) =>
    request<TranslationExercise | SentenceTranslationExercise | SentenceExercise>(
      `/api/exercises/${type}`,
      {
        method: "POST",
        body: JSON.stringify({ level_id: levelId, ...data }),
      }
    ),

  updateExercise: (
    type: "translation" | "sentenceTranslation" | "sentence",
    id: string,
    data: Record<string, string>
  ) =>
    request<TranslationExercise | SentenceTranslationExercise | SentenceExercise>(
      `/api/exercises/${type}/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    ),

  deleteExercise: (
    type: "translation" | "sentenceTranslation" | "sentence",
    id: string
  ) =>
    request<{ ok: boolean }>(`/api/exercises/${type}/${id}`, {
      method: "DELETE",
    }),
};
