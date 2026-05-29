import { scaleDimensions } from "./dimensions";

export { scaleDimensions };

export async function createImageElement(
  sourceUrl: string
): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = sourceUrl;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("无法加载图片。"));
  });
  return image;
}

export async function createVideoElement(
  sourceUrl: string
): Promise<HTMLVideoElement> {
  const video = document.createElement("video");
  video.src = sourceUrl;
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    const onLoaded = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error("无法加载所选视频文件。")); };
    const cleanup = () => {
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("loadeddata", onLoaded, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.load();
  });
  return video;
}

export async function resizeImageDataUrl(
  dataUrl: string,
  maxSide: number = 1536,
  quality: number = 0.7
): Promise<string> {
  const img = await createImageElement(dataUrl);
  const { width, height } = scaleDimensions(
    img.naturalWidth,
    img.naturalHeight,
    maxSide
  );

  if (width === img.naturalWidth && height === img.naturalHeight) {
    return dataUrl;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return dataUrl;
  }

  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("无法读取所选图片文件。"));
    };

    reader.onerror = () => reject(new Error("无法读取所选图片文件。"));
    reader.readAsDataURL(file);
  });
}

function base64FromBytes(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const slice = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...slice);
  }

  return btoa(binary);
}

export async function fetchImageAsDataUrl(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error("无法加载此图片进行分析。");
  }

  const blob = await response.blob();
  const mimeType = blob.type || "image/jpeg";
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = base64FromBytes(new Uint8Array(arrayBuffer));

  return `data:${mimeType};base64,${base64}`;
}
