export function extractJsonSubstring(rawText: string): string | null {
  const start = rawText.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < rawText.length; index += 1) {
    const char = rawText[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) return rawText.slice(start, index + 1);
    }
  }

  return null;
}

export function repairTruncatedJson(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{" || ch === "[") {
      stack.push(ch === "{" ? "}" : "]");
    } else if (ch === "}" || ch === "]") {
      if (stack.length > 0 && stack[stack.length - 1] === ch) {
        stack.pop();
      }
    }
  }

  let repaired = text;

  if (inString) {
    repaired += '"';
  }

  while (stack.length > 0) {
    repaired += stack.pop();
  }

  try {
    const extracted = extractJsonSubstring(repaired);
    if (extracted) {
      JSON.parse(extracted);
      return extracted;
    }
  } catch {
    // repair failed
  }

  return null;
}

export function parseGeminiJson<T>(rawText: string): T {
  const trimmed = rawText.trim();

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const jsonSubstring = extractJsonSubstring(trimmed);
    if (!jsonSubstring) {
      const repaired = repairTruncatedJson(trimmed);
      if (repaired) {
        try {
          return JSON.parse(repaired) as T;
        } catch {
          // fall through to error
        }
      }
      const preview = rawText.slice(0, 300);
      const tail = rawText.slice(-200);
      throw new Error(
        `模型返回JSON被截断或不完整。(E1) 长度:${rawText.length} 开头:${preview}... 结尾:...${tail}`
      );
    }
    try {
      return JSON.parse(jsonSubstring) as T;
    } catch {
      throw new Error(
        `模型返回了无效JSON。(E2) 截取内容: ${jsonSubstring.slice(0, 200)}`
      );
    }
  }
}
