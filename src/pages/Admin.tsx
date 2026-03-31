import { useState, useCallback, useRef } from "react";
import { api, type HskLevel, type TranslationExercise, type SentenceExercise, type SentenceTranslationExercise } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Plus, Trash2, LogIn, Edit2, Check, X, Upload, Download, Loader2, FileSpreadsheet, GripVertical } from "lucide-react";
import * as XLSX from "xlsx";

const generateId = () => `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export default function Admin() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [levels, setLevels] = useState<HskLevel[]>([]);
  const [activeLevel, setActiveLevel] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"translation" | "sentence" | "sentenceTranslation">("translation");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");

  // Drag-and-drop refs (must be before early return)
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const loadLevels = useCallback(async () => {
    try {
      const data = await api.getLevels();
      setLevels(data);
      if (data.length > 0 && !activeLevel) setActiveLevel(data[0].id);
    } catch (err) {
      console.error("Failed to load levels:", err);
    }
  }, [activeLevel]);

  const handleLogin = async () => {
    if (!password.trim()) return;
    setIsLoading(true);
    setAuthError("");
    try {
      const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:3001" : "");
      const res = await fetch(`${API_BASE}/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Mật khẩu không đúng");
        return;
      }
      setIsAuthed(true);
      await loadLevels();
    } catch {
      setAuthError("Không thể kết nối server");
    } finally {
      setIsLoading(false);
    }
  };

  const current = levels.find((l) => l.id === activeLevel);

  if (!isAuthed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
          <h2 className="mb-6 text-center text-xl font-bold text-foreground">Hán Ngữ Chill - Admin</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
            placeholder="Mật khẩu"
            className="mb-4 w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
          />
          {authError && <p className="mb-3 text-sm text-destructive">{authError}</p>}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  // ─── CRUD via API ──────────────────────────────────────────

  const addLevel = async () => {
    try {
      const newLevel = await api.createLevel(`Cấp độ ${levels.length + 1}`);
      setLevels((prev) => [...prev, newLevel]);
      setActiveLevel(newLevel.id);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteLevel = async (id: string) => {
    if (levels.length <= 1) return;
    try {
      await api.deleteLevel(id);
      setLevels((prev) => prev.filter((l) => l.id !== id));
      if (activeLevel === id) setActiveLevel(levels.find((l) => l.id !== id)?.id || "");
    } catch (err) {
      console.error(err);
    }
  };

  const saveEditName = async () => {
    if (!editingName || !tempName.trim()) return;
    try {
      await api.updateLevel(editingName, tempName.trim());
      setLevels((prev) => prev.map((l) => l.id === editingName ? { ...l, name: tempName.trim() } : l));
      setEditingName(null);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Exercise CRUD ────────────────────────────────────────

  const addTranslation = async () => {
    if (!current) return;
    try {
      const ex = await api.createExercise("translation", activeLevel, {
        vietnamese: "", chinese: "", pinyin: "", word_type: "",
      }) as TranslationExercise;
      setLevels((prev) => prev.map((l) => l.id === activeLevel
        ? { ...l, translationExercises: [...l.translationExercises, ex] } : l));
    } catch (err) {
      console.error(err);
    }
  };

  const updateTranslation = async (exId: string, field: string, value: string) => {
    const exercise = current?.translationExercises.find((e) => e.id === exId);
    if (!exercise) return;
    const updated = { ...exercise, [field]: value };
    setLevels((prev) => prev.map((l) => l.id === activeLevel
      ? { ...l, translationExercises: l.translationExercises.map((e) => e.id === exId ? updated : e) } : l));
    try {
      await api.updateExercise("translation", exId, {
        vietnamese: updated.vietnamese, chinese: updated.chinese, pinyin: updated.pinyin, word_type: updated.wordType,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTranslation = async (exId: string) => {
    try {
      await api.deleteExercise("translation", exId);
      setLevels((prev) => prev.map((l) => l.id === activeLevel
        ? { ...l, translationExercises: l.translationExercises.filter((e) => e.id !== exId) } : l));
    } catch (err) {
      console.error(err);
    }
  };

  const addSentence = async () => {
    if (!current) return;
    try {
      const ex = await api.createExercise("sentence", activeLevel, {
        correct_sentence: "", pinyin: "", vietnamese_meaning: "",
      }) as SentenceExercise;
      setLevels((prev) => prev.map((l) => l.id === activeLevel
        ? { ...l, sentenceExercises: [...l.sentenceExercises, ex] } : l));
    } catch (err) {
      console.error(err);
    }
  };

  const updateSentence = async (exId: string, field: string, value: string) => {
    const exercise = current?.sentenceExercises.find((e) => e.id === exId);
    if (!exercise) return;
    const updated = { ...exercise, [field]: value };
    setLevels((prev) => prev.map((l) => l.id === activeLevel
      ? { ...l, sentenceExercises: l.sentenceExercises.map((e) => e.id === exId ? updated : e) } : l));
    const fieldMap: Record<string, string> = {
      correctSentence: "correct_sentence", pinyin: "pinyin", vietnameseMeaning: "vietnamese_meaning",
    };
    try {
      await api.updateExercise("sentence", exId, {
        correct_sentence: updated.correctSentence, pinyin: updated.pinyin, vietnamese_meaning: updated.vietnameseMeaning,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSentence = async (exId: string) => {
    try {
      await api.deleteExercise("sentence", exId);
      setLevels((prev) => prev.map((l) => l.id === activeLevel
        ? { ...l, sentenceExercises: l.sentenceExercises.filter((e) => e.id !== exId) } : l));
    } catch (err) {
      console.error(err);
    }
  };

  const addSentenceTranslation = async () => {
    if (!current) return;
    try {
      const ex = await api.createExercise("sentenceTranslation", activeLevel, {
        vietnamese_sentence: "", chinese_sentence: "", pinyin: "",
      }) as SentenceTranslationExercise;
      setLevels((prev) => prev.map((l) => l.id === activeLevel
        ? { ...l, sentenceTranslationExercises: [...l.sentenceTranslationExercises, ex] } : l));
    } catch (err) {
      console.error(err);
    }
  };

  const updateSentenceTranslation = async (exId: string, field: string, value: string) => {
    const exercise = current?.sentenceTranslationExercises.find((e) => e.id === exId);
    if (!exercise) return;
    const updated = { ...exercise, [field]: value };
    setLevels((prev) => prev.map((l) => l.id === activeLevel
      ? { ...l, sentenceTranslationExercises: l.sentenceTranslationExercises.map((e) => e.id === exId ? updated : e) } : l));
    try {
      await api.updateExercise("sentenceTranslation", exId, {
        vietnamese_sentence: updated.vietnameseSentence, chinese_sentence: updated.chineseSentence, pinyin: updated.pinyin,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSentenceTranslation = async (exId: string) => {
    try {
      await api.deleteExercise("sentenceTranslation", exId);
      setLevels((prev) => prev.map((l) => l.id === activeLevel
        ? { ...l, sentenceTranslationExercises: l.sentenceTranslationExercises.filter((e) => e.id !== exId) } : l));
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Import/Export ────────────────────────────────────────

  const exportData = () => {
    const blob = new Blob([JSON.stringify(levels, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hsk_data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (!Array.isArray(data)) return;
          const normalized = data.map((l: HskLevel) => ({
            ...l,
            sentenceTranslationExercises: l.sentenceTranslationExercises || [],
          }));
          const updated = await api.putLevels(normalized);
          setLevels(updated);
          setActiveLevel(updated[0]?.id || "");
        } catch (err) {
          console.error("Import failed:", err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  type ExerciseType = "translation" | "sentenceTranslation" | "sentence";

  const EXCEL_COLUMN_MAP: Record<ExerciseType, { cols: { key: string; keywords: string[] }[]; apiType: string; stateKey: string }> = {
    translation: {
      cols: [
        { key: "vietnamese", keywords: ["việt", "vietnamese", "tiếng việt"] },
        { key: "chinese", keywords: ["hán", "chữ hán", "chinese", "hán tự", "tiếng trung"] },
        { key: "pinyin", keywords: ["pinyin", "phiên âm"] },
        { key: "word_type", keywords: ["từ loại", "word type", "loại"] },
      ],
      apiType: "translation",
      stateKey: "translationExercises",
    },
    sentenceTranslation: {
      cols: [
        { key: "vietnamese_sentence", keywords: ["việt", "vietnamese", "tiếng việt", "câu việt"] },
        { key: "chinese_sentence", keywords: ["hán", "chữ hán", "chinese", "hán tự", "tiếng trung", "câu trung"] },
        { key: "pinyin", keywords: ["pinyin", "phiên âm"] },
      ],
      apiType: "sentenceTranslation",
      stateKey: "sentenceTranslationExercises",
    },
    sentence: {
      cols: [
        { key: "correct_sentence", keywords: ["câu đúng", "correct", "hán", "chữ hán", "tiếng trung", "chinese"] },
        { key: "pinyin", keywords: ["pinyin", "phiên âm"] },
        { key: "vietnamese_meaning", keywords: ["việt", "vietnamese", "nghĩa", "tiếng việt"] },
      ],
      apiType: "sentence",
      stateKey: "sentenceExercises",
    },
  };

  const importExcel = (exerciseType: ExerciseType) => {
    if (!activeLevel) return;
    const config = EXCEL_COLUMN_MAP[exerciseType];

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });

        if (rows.length === 0) return;

        const headers = Object.keys(rows[0]);
        const findCol = (keywords: string[]) =>
          headers.find((h) => keywords.some((k) => h.toLowerCase().includes(k))) || "";

        const colMap: Record<string, string> = {};
        for (const col of config.cols) {
          colMap[col.key] = findCol(col.keywords);
        }

        const hasAnyCol = Object.values(colMap).some(Boolean);
        if (!hasAnyCol) {
          alert("Không tìm thấy cột phù hợp trong file Excel");
          return;
        }

        const newExercises: unknown[] = [];
        for (const row of rows) {
          const data: Record<string, string> = {};
          let hasValue = false;
          for (const [apiKey, headerName] of Object.entries(colMap)) {
            const val = headerName ? String(row[headerName] || "").trim() : "";
            data[apiKey] = val;
            if (val) hasValue = true;
          }
          if (!hasValue) continue;

          try {
            const ex = await api.createExercise(config.apiType as "translation" | "sentenceTranslation" | "sentence", activeLevel, data);
            newExercises.push(ex);
          } catch (err) {
            console.error("Failed to create exercise:", err);
          }
        }

        if (newExercises.length > 0) {
          await loadLevels();
          alert(`Đã import ${newExercises.length} bài tập từ Excel`);
        }
      } catch (err) {
        console.error("Excel import failed:", err);
        alert("Lỗi đọc file Excel");
      }
    };
    input.click();
  };

  const startEditName = (levelId: string, currentName: string) => {
    setEditingName(levelId);
    setTempName(currentName);
  };

  // ─── Drag‑and‑drop reorder ─────────────────────────────────

  const handleDragStart = (index: number) => {
    dragItem.current = index;
    setDragIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverItem.current = index;
  };

  const handleDrop = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) {
      setDragIdx(null);
      return;
    }

    const reordered = [...levels];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, removed);
    setLevels(reordered);
    setDragIdx(null);
    dragItem.current = null;
    dragOverItem.current = null;

    try {
      await api.reorderLevels(reordered.map((l) => l.id));
    } catch (err) {
      console.error("Reorder failed:", err);
      await loadLevels();
    }
  };

  const tabs = [
    { key: "translation" as const, label: "Dịch từ", count: current?.translationExercises.length || 0 },
    { key: "sentenceTranslation" as const, label: "Dịch câu", count: current?.sentenceTranslationExercises.length || 0 },
    { key: "sentence" as const, label: "Sắp xếp câu", count: current?.sentenceExercises.length || 0 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Hán Ngữ Chill - Quản trị</h1>
          <div className="flex gap-2">
            <button onClick={importData} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition">
              <Upload className="h-4 w-4" /> Import JSON
            </button>
            <button onClick={exportData} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition">
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl gap-6 p-6">
        {/* Sidebar */}
        <div className="w-52 shrink-0">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cấp độ</h3>
          <div className="flex flex-col gap-1">
            {levels.map((level, index) => (
              <div
                key={level.id}
                draggable={editingName !== level.id}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop}
                onDragEnd={() => setDragIdx(null)}
                className={cn(
                  "group flex items-center gap-1 rounded-lg transition-all",
                  dragIdx === index && "opacity-40 scale-95",
                  dragIdx !== null && dragIdx !== index && "border-t-2 border-transparent hover:border-primary/40",
                )}
              >
                {editingName === level.id ? (
                  <div className="flex flex-1 items-center gap-1">
                    <input
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEditName(); if (e.key === "Escape") setEditingName(null); }}
                      className="flex-1 rounded border border-primary bg-background px-2 py-1.5 text-sm text-foreground outline-none"
                      autoFocus
                    />
                    <button onClick={saveEditName} className="p-1 text-primary hover:text-primary/80"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setEditingName(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <>
                    <div className="cursor-grab p-1 text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing">
                      <GripVertical className="h-3.5 w-3.5" />
                    </div>
                    <button
                      onClick={() => setActiveLevel(level.id)}
                      className={cn(
                        "flex-1 rounded-lg px-3 py-2 text-left text-sm font-medium transition",
                        activeLevel === level.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
                      )}
                    >
                      {level.name}
                    </button>
                    <button onClick={() => startEditName(level.id, level.name)} className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {levels.length > 1 && (
                      <button onClick={() => deleteLevel(level.id)} className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
            <button
              onClick={addLevel}
              className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm cấp độ
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {current && (
            <>
              <div className="mb-6 flex items-center gap-3">
                <h2 className="text-2xl font-bold text-foreground">{current.name}</h2>
                <button onClick={() => startEditName(current.id, current.name)} className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted">
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex-1 rounded-md px-3 py-2 text-sm font-medium transition",
                      activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                    )}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {activeTab === "translation" && (
                <ExerciseList
                  items={current.translationExercises}
                  fields={[
                    { key: "vietnamese", placeholder: "Tiếng Việt" },
                    { key: "chinese", placeholder: "Tiếng Trung", className: "font-chinese" },
                    { key: "pinyin", placeholder: "Phiên âm" },
                    { key: "wordType", placeholder: "Từ loại (vd: Danh từ)" },
                  ]}
                  onUpdate={updateTranslation}
                  onDelete={deleteTranslation}
                  onAdd={addTranslation}
                  addLabel="Thêm bài tập dịch từ"
                  onImportExcel={() => importExcel("translation")}
                />
              )}

              {activeTab === "sentenceTranslation" && (
                <ExerciseList
                  items={current.sentenceTranslationExercises}
                  fields={[
                    { key: "vietnameseSentence", placeholder: "Câu tiếng Việt" },
                    { key: "chineseSentence", placeholder: "Câu tiếng Trung", className: "font-chinese" },
                    { key: "pinyin", placeholder: "Phiên âm" },
                  ]}
                  onUpdate={updateSentenceTranslation}
                  onDelete={deleteSentenceTranslation}
                  onAdd={addSentenceTranslation}
                  addLabel="Thêm bài tập dịch câu"
                  onImportExcel={() => importExcel("sentenceTranslation")}
                />
              )}

              {activeTab === "sentence" && (
                <ExerciseList
                  items={current.sentenceExercises}
                  fields={[
                    { key: "correctSentence", placeholder: "Câu đúng (tiếng Trung)", className: "font-chinese" },
                    { key: "pinyin", placeholder: "Phiên âm" },
                    { key: "vietnameseMeaning", placeholder: "Nghĩa tiếng Việt" },
                  ]}
                  onUpdate={updateSentence}
                  onDelete={deleteSentence}
                  onAdd={addSentence}
                  addLabel="Thêm bài tập sắp xếp câu"
                  onImportExcel={() => importExcel("sentence")}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reusable exercise list ─────────────────────────────────

function ExerciseList<T extends { id: string }>({
  items,
  fields,
  onUpdate,
  onDelete,
  onAdd,
  addLabel,
  onImportExcel,
}: {
  items: T[];
  fields: { key: string; placeholder: string; className?: string }[];
  onUpdate: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  addLabel: string;
  onImportExcel?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {onImportExcel && (
        <div className="flex justify-end">
          <button
            onClick={onImportExcel}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
          >
            <FileSpreadsheet className="h-4 w-4" /> Import Excel
          </button>
        </div>
      )}
      {items.map((item, i) => (
        <div key={item.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
          <span className="mt-2 text-xs font-semibold text-muted-foreground">{i + 1}</span>
          <div className={cn("grid flex-1 gap-3", fields.length > 3 ? "grid-cols-4" : "grid-cols-3")}>
            {fields.map((field) => (
              <input
                key={field.key}
                value={(item as Record<string, string>)[field.key] || ""}
                onChange={(e) => onUpdate(item.id, field.key, e.target.value)}
                placeholder={field.placeholder}
                className={cn(
                  "rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary",
                  field.className,
                )}
              />
            ))}
          </div>
          <button onClick={() => onDelete(item.id)} className="mt-2 p-1 text-muted-foreground hover:text-destructive transition">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
      >
        <Plus className="h-4 w-4" /> {addLabel}
      </button>
    </div>
  );
}
