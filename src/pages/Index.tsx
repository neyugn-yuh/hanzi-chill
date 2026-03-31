import { useState } from "react";
import { useHskLevels } from "@/hooks/useHskLevels";
import TranslationExercise from "@/components/TranslationExercise";
import SentenceExercise from "@/components/SentenceExercise";
import SentenceTranslationExercise from "@/components/SentenceTranslationExercise";
import {
  ArrowLeft,
  Languages,
  Shuffle,
  FileText,
  ChevronRight,
  BookOpen,
  Sparkles,
  Brain,
  Trophy,
  Layers,
  Loader2,
  GraduationCap,
} from "lucide-react";
import type { HskLevel } from "@/lib/api";

type ExerciseType = "translation" | "sentence" | "sentenceTranslation";

// ─── Exercise type configs ─────────────────────────────────

const EXERCISE_TYPES = [
  {
    type: "translation" as ExerciseType,
    title: "Gõ từ vựng",
    description: "Nhập từ tiếng Trung tương ứng với nghĩa tiếng Việt",
    icon: Languages,
    grad: "from-emerald-400 to-green-500",
    tagBg: "bg-emerald-50 border-emerald-200",
    tagText: "text-emerald-700",
    countLabel: "từ",
    getCount: (l: HskLevel) => l.translationExercises.length,
  },
  {
    type: "sentenceTranslation" as ExerciseType,
    title: "Dịch câu",
    description: "Dịch câu hoàn chỉnh sang tiếng Trung chính xác",
    icon: FileText,
    grad: "from-teal-400 to-cyan-500",
    tagBg: "bg-teal-50 border-teal-200",
    tagText: "text-teal-700",
    countLabel: "câu",
    getCount: (l: HskLevel) => l.sentenceTranslationExercises.length,
  },
  {
    type: "sentence" as ExerciseType,
    title: "Sắp xếp câu",
    description: "Chọn và sắp xếp các từ thành câu hoàn chỉnh",
    icon: Shuffle,
    grad: "from-lime-400 to-emerald-500",
    tagBg: "bg-lime-50 border-lime-200",
    tagText: "text-lime-700",
    countLabel: "câu",
    getCount: (l: HskLevel) => l.sentenceExercises.length,
  },
];

// ─── Level color palette ──────────────────────────────────

const LEVEL_COLORS = [
  {
    grad: "from-emerald-400 to-green-500",
    ring: "ring-emerald-300",
    text: "text-emerald-600",
  },
  {
    grad: "from-teal-400 to-cyan-500",
    ring: "ring-teal-300",
    text: "text-teal-600",
  },
  {
    grad: "from-sky-400 to-blue-500",
    ring: "ring-sky-300",
    text: "text-sky-600",
  },
  {
    grad: "from-violet-400 to-purple-500",
    ring: "ring-violet-300",
    text: "text-violet-600",
  },
  {
    grad: "from-pink-400 to-rose-500",
    ring: "ring-pink-300",
    text: "text-pink-600",
  },
  {
    grad: "from-amber-400 to-orange-500",
    ring: "ring-amber-300",
    text: "text-amber-600",
  },
  {
    grad: "from-lime-400 to-emerald-500",
    ring: "ring-lime-300",
    text: "text-lime-600",
  },
];

// ─── Error / Loading states ───────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background/90 p-6">
      <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      <p className="text-muted-foreground">Đang kết nối server...</p>
    </div>
  );
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background/90 p-6">
      <div className="text-6xl">📡</div>
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-foreground">
          Không thể kết nối
        </h2>
        <p className="mt-2 text-muted-foreground">
          Không thể kết nối đến server.
          <br />
          Hãy đảm bảo backend đang chạy ở{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            localhost:3001
          </code>
        </p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-3 font-bold text-white shadow-lg transition hover:shadow-xl hover:-translate-y-0.5"
      >
        Thử lại
      </button>
    </div>
  );
}

// ─── Exercise Screen ───────────────────────────────────────

function ExerciseScreen({
  level,
  exerciseType,
  onBack,
}: {
  level: HskLevel;
  exerciseType: ExerciseType;
  onBack: () => void;
}) {
  const info = EXERCISE_TYPES.find((e) => e.type === exerciseType)!;

  const exercises =
    exerciseType === "translation"
      ? level.translationExercises
      : exerciseType === "sentence"
        ? level.sentenceExercises
        : level.sentenceTranslationExercises;

  if (exercises.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background/90 p-6">
        <div className="text-7xl">📭</div>
        <h2 className="text-2xl font-extrabold text-foreground">
          Chưa có bài tập
        </h2>
        <p className="text-muted-foreground">Phần này hiện chưa có nội dung.</p>
        <button
          onClick={onBack}
          className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-medium text-foreground shadow-sm transition hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background/90">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${info.tagBg} ${info.tagText}`}
          >
            <info.icon className="h-3.5 w-3.5" />
            {level.name} · {info.title}
          </span>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-xl">
          {exerciseType === "translation" && (
            <TranslationExercise
              exercises={level.translationExercises}
              onComplete={onBack}
            />
          )}
          {exerciseType === "sentence" && (
            <SentenceExercise
              exercises={level.sentenceExercises}
              onComplete={onBack}
            />
          )}
          {exerciseType === "sentenceTranslation" && (
            <SentenceTranslationExercise
              exercises={level.sentenceTranslationExercises}
              onComplete={onBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Exercise Picker ──────────────────────────────────────

function ExercisePicker({
  level,
  onSelect,
  onBack,
}: {
  level: HskLevel;
  onSelect: (t: ExerciseType) => void;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-background/90">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute -left-16 top-1/3 h-64 w-64 rounded-full bg-teal-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-xl px-4 pt-10 pb-10 sm:pt-14">
        {/* Back button */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Chọn trình độ khác
        </button>

        {/* Level header */}
        <div className="mb-8 text-center stagger-children">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            {level.name}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Chọn loại bài tập bạn muốn luyện
          </p>
        </div>

        {/* Exercise cards */}
        <div className="stagger-children flex flex-col gap-3">
          {EXERCISE_TYPES.map((info) => {
            const Icon = info.icon;
            const count = info.getCount(level);
            const isEmpty = count === 0;

            return (
              <button
                key={info.type}
                onClick={() => !isEmpty && onSelect(info.type)}
                disabled={isEmpty}
                className={`
                  group relative flex items-center gap-4 rounded-2xl border-2 border-border/50
                  bg-card p-4 text-left transition-all duration-200
                  hover:-translate-y-0.5 hover:shadow-xl sm:p-5
                  ${
                    isEmpty
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-emerald-300"
                  }
                `}
              >
                <div
                  className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${info.grad} shadow-md transition-transform group-hover:scale-110`}
                  style={{ width: "3.25rem", height: "3.25rem" }}
                >
                  <Icon className="h-7 w-7 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-foreground text-base sm:text-lg">
                      {info.title}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${info.tagBg} ${info.tagText}`}
                    >
                      {count} {info.countLabel}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                    {info.description}
                  </p>
                </div>

                {isEmpty ? (
                  <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    Chưa có bài
                  </span>
                ) : (
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-1.5 group-hover:text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Home Screen (Level Selector) ─────────────────────────

export default function Index() {
  const { levels, isLoading, isError, refetch } = useHskLevels();
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [exerciseType, setExerciseType] = useState<ExerciseType | null>(null);

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorScreen onRetry={refetch} />;

  const selectedLevel = levels.find((l) => l.id === selectedLevelId);

  // Exercise screen
  if (selectedLevel && exerciseType) {
    return (
      <ExerciseScreen
        level={selectedLevel}
        exerciseType={exerciseType}
        onBack={() => setExerciseType(null)}
      />
    );
  }

  // Exercise type picker
  if (selectedLevel) {
    return (
      <ExercisePicker
        level={selectedLevel}
        onSelect={setExerciseType}
        onBack={() => setSelectedLevelId(null)}
      />
    );
  }

  // Level selector (home)
  return (
    <div className="min-h-screen bg-background/90">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute -left-24 top-1/2 h-72 w-72 rounded-full bg-teal-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-xl px-4 pt-14 pb-10 sm:pt-20 sm:pb-16">
        {/* Hero */}

        {/* Divider */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            Chọn Bài Tập
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
        </div>

        {/* Level cards */}
        <div className="stagger-children grid grid-cols-3 gap-3">
          {levels.map((level, i) => {
            const color = LEVEL_COLORS[i % LEVEL_COLORS.length];
            const totalExercises =
              level.translationExercises.length +
              level.sentenceExercises.length +
              level.sentenceTranslationExercises.length;

            return (
              <button
                key={level.id}
                onClick={() => setSelectedLevelId(level.id)}
                className={`
                  group relative flex flex-col items-center gap-3 rounded-2xl border-2 border-border/50
                  bg-card p-5 text-center transition-all duration-200
                  hover:-translate-y-1 hover:shadow-xl hover:border-emerald-300
                `}
              >
                {/* Icon */}
                <div
                  className={`flex items-center justify-center rounded-2xl bg-gradient-to-br ${color.grad} shadow-md transition-transform group-hover:scale-110`}
                  style={{ width: "3rem", height: "3rem" }}
                >
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>

                {/* Name */}
                <p className="font-bold text-foreground text-sm sm:text-base">
                  {level.name}
                </p>

                {/* Count */}
                <span className="text-xs text-muted-foreground">
                  {totalExercises} bài tập
                </span>

                {/* Arrow hint */}
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
