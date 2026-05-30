export {};

declare global {
  interface ChromeRuntimeExt {
    getURL(path: string): string;
  }

  interface ChromeExt {
    runtime: ChromeRuntimeExt;
  }

  var chrome: ChromeExt;
}
