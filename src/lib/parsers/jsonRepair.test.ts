import { describe, it, expect } from "vitest";
import {
  extractJsonSubstring,
  repairTruncatedJson,
  parseGeminiJson,
} from "./jsonRepair";

describe("extractJsonSubstring", () => {
  it("从纯 JSON 文本中提取完整对象", () => {
    const input = '{"key":"value"}';
    expect(extractJsonSubstring(input)).toBe('{"key":"value"}');
  });

  it("从带有前缀的文本中提取 JSON", () => {
    const input = 'Here is the result: {"key":"value"} and more';
    expect(extractJsonSubstring(input)).toBe('{"key":"value"}');
  });

  it("处理嵌套对象", () => {
    const input = '{"outer":{"inner":"deep"}}';
    expect(extractJsonSubstring(input)).toBe('{"outer":{"inner":"deep"}}');
  });

  it("处理包含字符串中大括号的情况", () => {
    const input = '{"text":"a {b} c"}';
    expect(extractJsonSubstring(input)).toBe('{"text":"a {b} c"}');
  });

  it("处理包含转义引号的字符串", () => {
    const input = '{"text":"he said \\"hello\\""}';
    expect(extractJsonSubstring(input)).toBe('{"text":"he said \\"hello\\""}');
  });

  it("文本中没有大括号时返回 null", () => {
    expect(extractJsonSubstring("no json here")).toBeNull();
  });

  it("大括号不匹配时返回 null", () => {
    expect(extractJsonSubstring('{"key":"value"')).toBeNull();
  });

  it("处理空对象", () => {
    expect(extractJsonSubstring("{}")).toBe("{}");
  });

  it("处理包含数组的 JSON", () => {
    const input = '{"items":[1,2,3]}';
    expect(extractJsonSubstring(input)).toBe('{"items":[1,2,3]}');
  });

  it("处理多层嵌套和数组混合", () => {
    const input = 'prefix {"a":{"b":[1,{"c":2}]}} suffix';
    expect(extractJsonSubstring(input)).toBe('{"a":{"b":[1,{"c":2}]}}');
  });
});

describe("repairTruncatedJson", () => {
  it("补全缺失的闭合大括号", () => {
    const input = '{"key":"value"';
    const result = repairTruncatedJson(input);
    expect(result).toBe('{"key":"value"}');
  });

  it("补全多层缺失的闭合括号", () => {
    const input = '{"outer":{"inner":"deep"';
    const result = repairTruncatedJson(input);
    expect(result).toBe('{"outer":{"inner":"deep"}}');
  });

  it("补全缺失的数组闭合括号", () => {
    const input = '{"items":[1,2,3';
    const result = repairTruncatedJson(input);
    expect(result).toBe('{"items":[1,2,3]}');
  });

  it("补全未闭合的字符串", () => {
    const input = '{"key":"unclosed';
    const result = repairTruncatedJson(input);
    expect(result).toBe('{"key":"unclosed"}');
  });

  it("完整的 JSON 不做修改", () => {
    const input = '{"key":"value"}';
    const result = repairTruncatedJson(input);
    expect(result).toBe('{"key":"value"}');
  });

  it("没有大括号时返回 null", () => {
    expect(repairTruncatedJson("no json")).toBeNull();
  });

  it("严重损坏的 JSON 返回 null", () => {
    expect(repairTruncatedJson("{broken beyond repair !!!")).toBeNull();
  });
});

describe("parseGeminiJson", () => {
  it("解析标准 JSON 文本", () => {
    const input = '{"name":"test","value":42}';
    const result = parseGeminiJson<{ name: string; value: number }>(input);
    expect(result).toEqual({ name: "test", value: 42 });
  });

  it("解析带有前缀文本的 JSON", () => {
    const input = 'Here is the JSON:\n{"name":"test"}\nEnd.';
    const result = parseGeminiJson<{ name: string }>(input);
    expect(result).toEqual({ name: "test" });
  });

  it("对截断的 JSON 尝试修复并解析", () => {
    const input = '{"name":"test","items":[1,2';
    const result = parseGeminiJson<{ name: string; items: number[] }>(input);
    expect(result.name).toBe("test");
    expect(result.items).toEqual([1, 2]);
  });

  it("无法解析时抛出包含 E1 的错误", () => {
    expect(() => parseGeminiJson("completely invalid text")).toThrow(/E1/);
  });

  it("提取到无效 JSON 子串时抛出包含 E2 的错误", () => {
    const input = '{invalid json content here: undefined}';
    expect(() => parseGeminiJson(input)).toThrow();
  });

  it("处理带空白字符的输入", () => {
    const input = '  \n  {"key":"value"}  \n  ';
    const result = parseGeminiJson<{ key: string }>(input);
    expect(result).toEqual({ key: "value" });
  });

  it("解析包含中文的 JSON", () => {
    const input = '{"描述":"这是一段中文","数值":123}';
    const result = parseGeminiJson<{ 描述: string; 数值: number }>(input);
    expect(result).toEqual({ 描述: "这是一段中文", 数值: 123 });
  });
});
