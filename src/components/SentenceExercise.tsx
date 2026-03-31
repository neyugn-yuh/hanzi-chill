import { useState, useEffect, useMemo } from "react";
import type { SentenceExercise as SExercise } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Check, X, RotateCcw, Target, Zap, ChevronRight } from "lucide-react";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  exercises: SExercise[];
  onComplete: () => void;
}

function CompletionScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 animate-in-up">
      <div className="relative">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl shadow-emerald-500/30">
          <Check className="h-14 w-14 text-white" />
        </div>
        <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
          <Zap className="h-4 w-4 text-white" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-foreground">Xuất sắc! 🎉</h2>
        <p className="mt-2 text-muted-foreground">Bạn đã hoàn thành tất cả bài tập sắp xếp câu</p>
      </div>
      <button
        onClick={onComplete}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3.5 font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
      >
        <ChevronRight className="h-4 w-4" /> Tiếp tục luyện tập
      </button>
    </div>
  );
}

export default function SentenceExercise({ exercises, onComplete }: Props) {
  const shuffledExercises = useMemo(() => shuffleArray(exercises), [exercises]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [mounted, setMounted] = useState(false);

  const current = shuffledExercises[currentIndex];
  const progress = (currentIndex / shuffledExercises.length) * 100;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (current && mounted) {
      const chars = current.correctSentence.split("");
      setAvailable(shuffleArray(chars));
      setSelected([]);
      setStatus("idle");
    }
  }, [currentIndex, current, mounted]);

  if (!current) {
    return (
      <div className="mx-auto flex w-full max-w-lg items-center">
        <CompletionScreen onComplete={onComplete} />
      </div>
    );
  }

  const handleSelect = (char: string, index: number) => {
    if (status !== "idle") return;
    setSelected([...selected, char]);
    const newAvailable = [...available];
    newAvailable.splice(index, 1);
    setAvailable(newAvailable);
  };

  const handleDeselect = (char: string, index: number) => {
    if (status !== "idle") return;
    setAvailable([...available, char]);
    const newSelected = [...selected];
    newSelected.splice(index, 1);
    setSelected(newSelected);
  };

  const handleCheck = () => {
    const answer = selected.join("");
    if (answer === current.correctSentence) {
      setStatus("correct");
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
      }, 1000);
    } else {
      setStatus("wrong");
    }
  };

  const handleReset = () => {
    const chars = current.correctSentence.split("");
    setAvailable(shuffleArray(chars));
    setSelected([]);
    setStatus("idle");
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 animate-in-up">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" />
            Câu {currentIndex + 1} / {shuffledExercises.length}
          </span>
          <span>{Math.round(progress)}% hoàn thành</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Meaning card */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Sắp xếp thành câu đúng
        </p>
        <p className="text-lg font-medium text-foreground sm:text-xl">
          {current.vietnameseMeaning}
        </p>
      </div>

      {/* Selected area */}
      <div className={cn(
        "min-h-[72px] flex flex-wrap justify-center items-center gap-2 rounded-2xl border-2 p-4 transition-all",
        status === "idle" && selected.length === 0 && "border-dashed border-border/60 bg-muted/20",
        status === "idle" && selected.length > 0 && "border-emerald-300/60 bg-emerald-50/30",
        status === "correct" && "border-emerald-400 bg-emerald-50 shadow-sm shadow-emerald-500/10",
        status === "wrong" && "border-amber-300 bg-amber-50/30"
      )}>
        {selected.length === 0 && (
          <span className="text-sm text-muted-foreground/50">Chạm vào chữ bên dưới để chọn...</span>
        )}
        {selected.map((char, i) => (
          <button
            key={`sel-${i}`}
            onClick={() => handleDeselect(char, i)}
            disabled={status !== "idle"}
            className={cn(
              "font-chinese rounded-xl px-4 py-2.5 text-xl font-bold transition-all duration-150",
              status === "idle" && "bg-white text-emerald-700 border border-emerald-200 hover:border-emerald-400 hover:text-emerald-800 hover:bg-emerald-50 shadow-sm cursor-pointer active:scale-95",
              status === "correct" && "bg-emerald-100 text-emerald-700 border border-emerald-200",
              status === "wrong" && "bg-amber-100 text-amber-700 border border-amber-200"
            )}
          >
            {char}
          </button>
        ))}
      </div>

      {/* Available chars */}
      <div className="flex flex-wrap justify-center gap-2">
        {available.map((char, i) => (
          <button
            key={`avl-${i}`}
            onClick={() => handleSelect(char, i)}
            className={cn(
              "font-chinese rounded-xl border-2 bg-white px-4 py-2.5 text-xl font-bold text-foreground shadow-sm transition-all duration-150",
              status === "idle" && "border-border/60 hover:border-emerald-400 hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer",
              status !== "idle" && "opacity-40 cursor-not-allowed"
            )}
          >
            {char}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {status === "correct" && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border-2 border-emerald-200/60 bg-emerald-50/80 p-4 shadow-sm pulse-glow">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-emerald-700">Chính xác!</p>
            <p className="font-chinese text-sm text-emerald-600/80">{current.pinyin}</p>
          </div>
        </div>
      )}

      {status === "wrong" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-amber-200/60 bg-amber-50/80 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white">
              <X className="h-4 w-4" />
            </div>
            <p className="font-bold">Sai rồi!</p>
          </div>
          <div className="text-center">
            <p className="mb-1 text-xs text-muted-foreground">Đáp án đúng</p>
            <p className="font-chinese text-2xl font-bold text-foreground">{current.correctSentence}</p>
            <p className="mt-1 text-sm text-muted-foreground">{current.pinyin}</p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            <RotateCcw className="h-4 w-4" /> Thử lại
          </button>
        </div>
      )}

      {status === "idle" && available.length === 0 && selected.length > 0 && (
        <button
          onClick={handleCheck}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3.5 font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
        >
          Kiểm tra ngay <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {status === "idle" && available.length > 0 && (
        <p className="text-center text-xs text-muted-foreground/60">
          Chọn đủ chữ rồi nhấn <strong>Kiểm tra</strong>
        </p>
      )}
    </div>
  );
}
