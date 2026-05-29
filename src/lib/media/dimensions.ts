export function scaleDimensions(
  width: number,
  height: number,
  maxSide: number
): { width: number; height: number } {
  const longestEdge = Math.max(width, height);
  if (longestEdge <= maxSide) {
    return { width, height };
  }

  const ratio = maxSide / longestEdge;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}
