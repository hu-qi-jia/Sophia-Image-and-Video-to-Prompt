import { describe, it, expect } from "vitest";
import { scaleDimensions } from "./dimensions";

describe("scaleDimensions", () => {
  it("尺寸未超过最大值时不缩放", () => {
    expect(scaleDimensions(100, 80, 512)).toEqual({ width: 100, height: 80 });
  });

  it("尺寸等于最大值时不缩放", () => {
    expect(scaleDimensions(512, 256, 512)).toEqual({ width: 512, height: 256 });
  });

  it("按宽度缩放（横向图片）", () => {
    const result = scaleDimensions(1024, 512, 512);
    expect(result).toEqual({ width: 512, height: 256 });
  });

  it("按高度缩放（纵向图片）", () => {
    const result = scaleDimensions(512, 1024, 512);
    expect(result).toEqual({ width: 256, height: 512 });
  });

  it("正方形图片缩放", () => {
    const result = scaleDimensions(1024, 1024, 512);
    expect(result).toEqual({ width: 512, height: 512 });
  });

  it("缩放结果宽度至少为 1", () => {
    const result = scaleDimensions(1, 10000, 512);
    expect(result.width).toBeGreaterThanOrEqual(1);
    expect(result.height).toBeGreaterThanOrEqual(1);
  });

  it("缩放结果高度至少为 1", () => {
    const result = scaleDimensions(10000, 1, 512);
    expect(result.width).toBeGreaterThanOrEqual(1);
    expect(result.height).toBeGreaterThanOrEqual(1);
  });

  it("非常小的图片不缩放", () => {
    expect(scaleDimensions(10, 10, 512)).toEqual({ width: 10, height: 10 });
  });

  it("保持宽高比（浮点精度）", () => {
    const result = scaleDimensions(1920, 1080, 1280);
    const ratio = result.width / result.height;
    const originalRatio = 1920 / 1080;
    expect(Math.abs(ratio - originalRatio)).toBeLessThan(0.01);
  });
});
