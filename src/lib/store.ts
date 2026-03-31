// Legacy types kept for compatibility with existing components
export interface TranslationExercise {
  id: string;
  vietnamese: string;
  chinese: string;
  pinyin: string;
  wordType: string;
}

export interface SentenceExercise {
  id: string;
  correctSentence: string;
  pinyin: string;
  vietnameseMeaning: string;
}

export interface SentenceTranslationExercise {
  id: string;
  vietnameseSentence: string;
  chineseSentence: string;
  pinyin: string;
}

export interface HskLevel {
  id: string;
  name: string;
  translationExercises: TranslationExercise[];
  sentenceExercises: SentenceExercise[];
  sentenceTranslationExercises: SentenceTranslationExercise[];
}

// ─── Store actions (delegated to api.ts) ──────────────────
// The store no longer manages local state directly.
// Components should use useHskLevels() hook instead.

export { api } from "./api";
