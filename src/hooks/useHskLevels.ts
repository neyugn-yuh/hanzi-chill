import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type HskLevel } from "@/lib/api";

export function useHskLevels() {
  const queryClient = useQueryClient();

  const levelsQuery = useQuery({
    queryKey: ["levels"],
    queryFn: api.getLevels,
    staleTime: Infinity,      // data is the source of truth on server
    gcTime: Infinity,
    retry: 2,
  });

  // ─── Level mutations ───────────────────────────────

  const createLevel = useMutation({
    mutationFn: (name: string) => api.createLevel(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["levels"] }),
  });

  const updateLevel = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.updateLevel(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["levels"] }),
  });

  const deleteLevel = useMutation({
    mutationFn: (id: string) => api.deleteLevel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["levels"] }),
  });

  const importLevels = useMutation({
    mutationFn: (levels: HskLevel[]) => api.putLevels(levels),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["levels"] }),
  });

  // ─── Exercise mutations ───────────────────────────

  const createExercise = useMutation({
    mutationFn: ({
      type,
      levelId,
      data,
    }: {
      type: "translation" | "sentenceTranslation" | "sentence";
      levelId: string;
      data: Record<string, string>;
    }) => api.createExercise(type, levelId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["levels"] }),
  });

  const updateExercise = useMutation({
    mutationFn: ({
      type,
      id,
      data,
    }: {
      type: "translation" | "sentenceTranslation" | "sentence";
      id: string;
      data: Record<string, string>;
    }) => api.updateExercise(type, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["levels"] }),
  });

  const deleteExercise = useMutation({
    mutationFn: ({
      type,
      id,
    }: {
      type: "translation" | "sentenceTranslation" | "sentence";
      id: string;
    }) => api.deleteExercise(type, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["levels"] }),
  });

  return {
    levels: levelsQuery.data ?? [],
    isLoading: levelsQuery.isLoading,
    isError: levelsQuery.isError,
    error: levelsQuery.error,
    refetch: levelsQuery.refetch,

    createLevel,
    updateLevel,
    deleteLevel,
    importLevels,

    createExercise,
    updateExercise,
    deleteExercise,
  };
}
