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
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 shadow-xl shadow-sky-500/30">
          <Check className="h-14 w-14 text-white" />
        </div>
        <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
          <Zap className="h-4 w-4 text-white" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-foreground">Xuất sắc! 🎉</h2>
        <p className="mt-2 text-muted-foreground">Bạn đã hoàn thành tất cả bài tập dịch nghĩa từ mới</p>
      </div>
      <button
        onClick={onComplete}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
      >
        <ArrowRight className="h-4 w-4" /> Tiếp tục luyện tập
      </button>
    </div>
  );
}

const normalizeVi = (s: string) =>
  s
    .toLowerCase()
    .replace(/[.?!;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const splitMeanings = (s: string) =>
  s
    .split(/[,/]/)
    .map((x) => normalizeVi(x))
    .filter(Boolean);

export default function ChineseToVietnameseExercise({ exercises, onComplete }: Props) {
  const shuffledExercises = useMemo(() => shuffleArray(exercises), [exercises]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
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
    const answer = normalizeVi(input);
    if (!answer) return;

    const candidates = splitMeanings(current.vietnamese);
    const ok = candidates.some((c) => c === answer || c.includes(answer) || answer.includes(c));

    if (ok) {
      setStatus("correct");
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setInput("");
        setStatus("idle");
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
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" />
            Câu {currentIndex + 1} / {shuffledExercises.length}
          </span>
          <span>{Math.round(progress)}% hoàn thành</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">Dịch sang tiếng Việt</p>
        <p className="text-center font-chinese font-semibold text-3xl text-foreground sm:text-4xl">{current.chinese}</p>
        <p className="mt-2 text-center text-sm text-muted-foreground">{current.pinyin}</p>
      </div>

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
          placeholder="Nhập nghĩa tiếng Việt..."
          className={cn(
            "w-full rounded-2xl border-2 bg-card px-6 py-4 text-center text-xl outline-none transition-all duration-200",
            status === "idle" && "border-border/60 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10",
            status === "correct" && "border-sky-400 bg-sky-50/50 shadow-sm shadow-sky-500/10",
            status === "wrong" && "border-amber-400 bg-amber-50/50 shadow-sm shadow-amber-500/10"
          )}
          disabled={status === "correct"}
        />
        {status === "wrong" && (
          <button onClick={handleRetry} className="absolute right-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg transition hover:bg-amber-600">
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      {status === "correct" && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border-2 border-sky-200/60 bg-sky-50/80 p-4 shadow-sm pulse-glow">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-white"><Check className="h-4 w-4" /></div>
          <p className="font-bold text-sky-700">Chính xác!</p>
        </div>
      )}

      {status === "wrong" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-amber-200/60 bg-amber-50/80 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white"><X className="h-4 w-4" /></div>
            <p className="font-bold">Sai rồi!</p>
          </div>
          <div className="text-center">
            <p className="mb-1 text-xs text-muted-foreground">Đáp án gợi ý</p>
            <p className="text-lg font-bold text-foreground">{current.vietnamese}</p>
          </div>
        </div>
      )}
    </div>
  );
}
