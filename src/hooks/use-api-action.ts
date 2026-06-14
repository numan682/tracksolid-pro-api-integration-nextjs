"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { callApi } from "@/lib/api";

export function useApiAction<T = unknown>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [data, setData] = useState<T>();

  const run = useCallback(async (method: string, params: Record<string, unknown> = {}, successMessage?: string) => {
    setLoading(true);
    setError(undefined);
    try {
      const result = await callApi<T>(method, params);
      setData(result);
      if (successMessage) toast.success(successMessage);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed";
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(undefined);
    setError(undefined);
  }, []);

  return { loading, error, data, run, reset, setData };
}
