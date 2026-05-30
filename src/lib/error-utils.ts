const LOG_PREFIX = "[Sophia]";

const EXTENSION_CONTEXT_INVALIDATED = "Extension context invalidated";

export function isExtensionContextValid(): boolean {
  try {
    return !!(chrome.runtime && chrome.runtime.id);
  } catch {
    return false;
  }
}

export function logError(context: string, error: unknown): void {
  if (error instanceof Error) {
    if (error.message.includes(EXTENSION_CONTEXT_INVALIDATED)) {
      return;
    }
    console.error(`${LOG_PREFIX} ${context}:`, error.message);
  } else {
    console.error(`${LOG_PREFIX} ${context}:`, error);
  }
}

export function logWarn(context: string, message: string): void {
  console.warn(`${LOG_PREFIX} ${context}: ${message}`);
}

export function safeExecute<T>(fn: () => T, context: string, fallback?: T): T | undefined {
  try {
    return fn();
  } catch (error) {
    logError(context, error);
    return fallback;
  }
}

export async function safeAsyncExecute<T>(fn: () => Promise<T>, context: string, fallback?: T): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    logError(context, error);
    return fallback;
  }
}

export async function safeRuntimeSendMessage<T = unknown>(message: unknown): Promise<T | undefined> {
  if (!isExtensionContextValid()) return undefined;
  try {
    return await chrome.runtime.sendMessage(message as object) as T;
  } catch (error) {
    if (error instanceof Error && error.message.includes(EXTENSION_CONTEXT_INVALIDATED)) {
      return undefined;
    }
    logError("runtime.sendMessage", error);
    return undefined;
  }
}
