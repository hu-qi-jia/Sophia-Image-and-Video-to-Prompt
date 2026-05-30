import { useState, useCallback } from "react";
import { logError } from "./error-utils";
import { COPY_FEEDBACK_DURATION_MS } from "./constants";

export function useClipboard() {
  const [copyLabel, setCopyLabel] = useState("复制");
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string, onSuccess?: () => void): Promise<boolean> => {
    if (!text.trim()) return false;
    try {
      await navigator.clipboard.writeText(text);
      setCopyLabel("已复制");
      setIsCopied(true);
      onSuccess?.();
      window.setTimeout(() => {
        setCopyLabel("复制");
        setIsCopied(false);
      }, COPY_FEEDBACK_DURATION_MS);
      return true;
    } catch (error) {
      logError("copyToClipboard", error);
      setCopyLabel("复制");
      setIsCopied(false);
      return false;
    }
  }, []);

  return {
    copyLabel,
    isCopied,
    copyToClipboard,
  };
}
