import { useState, useRef, useEffect, useMemo } from "react";
import type { TranslationExercise as TExercise } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Check, X, ArrowRight, RotateCcw, Target, Zap } from "lucide-react";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  exercises: TExercise[];
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
        <p className="mt-2 text-muted-foreground">Bạn đã hoàn thành tất cả bài tập dịch từ</p>
      </div>
      <button
        onClick={onComplete}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
      >
        <ArrowRight className="h-4 w-4" /> Tiếp tục luyện tập
      </button>
    </div>
  );
}

export default function TranslationExercise({ exercises, onComplete }: Props) {
  const shuffledExercises = useMemo(() => shuffleArray(exercises), [exercises]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  const current = shuffledExercises[currentIndex];
  const progress = (currentIndex / shuffledExercises.length) * 100;

  useEffect(() => {
    setMounted(true);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (mounted) inputRef.current?.focus();
  }, [currentIndex, status, mounted]);

  if (!current) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center">
        <CompletionScreen onComplete={onComplete} />
      </div>
    );
  }

  const handleSubmit = () => {
    if (status === "correct") return;
    const trimmed = input.trim();
    if (!trimmed) return;

    if (trimmed === current.chinese) {
      setStatus("correct");
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setInput("");
        setStatus("idle");
        setShowHint(false);
      }, 1000);
    } else {
      setStatus("wrong");
    }
  };

  const handleRetry = () => {
    setInput("");
    setStatus("idle");
    inputRef.current?.focus();
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
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Dịch sang tiếng Trung
        </p>
        <p className="text-center font-semibold text-2xl text-foreground sm:text-3xl">
          {current.vietnamese}
        </p>
        {current.wordType && (() => {
          const WORD_TYPE_COLORS: Record<string, string> = {
            "Danh từ": "bg-sky-50 text-sky-700 border-sky-200",
            "Động từ": "bg-emerald-50 text-emerald-700 border-emerald-200",
            "Tính từ": "bg-amber-50 text-amber-700 border-amber-200",
            "Phó từ": "bg-violet-50 text-violet-700 border-violet-200",
            "Đại từ": "bg-pink-50 text-pink-700 border-pink-200",
            "Đại từ nhân xưng": "bg-pink-50 text-pink-700 border-pink-200",
            "Lượng từ": "bg-orange-50 text-orange-700 border-orange-200",
            "Liên từ": "bg-cyan-50 text-cyan-700 border-cyan-200",
            "Trợ từ": "bg-slate-50 text-slate-600 border-slate-200",
            "Số đếm": "bg-indigo-50 text-indigo-700 border-indigo-200",
            "Thành ngữ": "bg-rose-50 text-rose-700 border-rose-200",
            "Danh từ riêng": "bg-teal-50 text-teal-700 border-teal-200",
            "Danh từ / Động từ": "bg-lime-50 text-lime-700 border-lime-200",
            "Lượng từ + Danh từ": "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
          };
          const colors = WORD_TYPE_COLORS[current.wordType] || "bg-muted text-muted-foreground border-border";
          return (
            <p className="mt-2 text-center">
              <span className={`inline-block rounded-full border px-3 py-0.5 text-xs font-medium ${colors}`}>
                {current.wordType}
              </span>
            </p>
          );
        })()}
        {/* Pinyin hint shown after wrong */}
        {showHint && status === "wrong" && (
          <p className="mt-3 text-center text-sm text-muted-foreground/60 font-chinese">
            {current.pinyin}
          </p>
        )}
      </div>

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (status === "wrong") setStatus("idle");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (status === "wrong") handleRetry();
              else handleSubmit();
            }
          }}
          placeholder="Nhập tiếng Trung..."
          className={cn(
            "w-full rounded-2xl border-2 bg-card px-6 py-4 text-center font-chinese text-2xl outline-none transition-all duration-200",
            status === "idle" && "border-border/60 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10",
            status === "correct" && "border-emerald-400 bg-emerald-50/50 shadow-sm shadow-emerald-500/10",
            status === "wrong" && "border-amber-400 bg-amber-50/50 shadow-sm shadow-amber-500/10"
          )}
          disabled={status === "correct"}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />


        {status === "wrong" && (
          <button
            onClick={handleRetry}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg transition hover:bg-amber-600"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
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
            <p className="font-chinese text-2xl font-bold text-foreground">{current.chinese}</p>
            <p className="mt-1 text-sm text-muted-foreground">{current.pinyin}</p>
          </div>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:shadow-md"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Thử lại
          </button>
        </div>
      )}

      {status === "idle" && (
        <p className="text-center text-xs text-muted-foreground/60">
          Nhấn <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Enter</kbd> để kiểm tra
        </p>
      )}
    </div>
  );
}
