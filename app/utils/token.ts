/**
 * 估算LLM模型的token数量。
 *
 * 注意：不要在这个首屏路径静态引入 js-tiktoken。它会把多 MB 的 BPE
 * 词表打进启动 bundle，明显拖慢弱网首次打开。
 */
export function estimateTokenLengthInLLM(input: string): number {
  return Math.ceil(estimateTokenLength(input));
}

/**
 * 基于字符特性估算token长度（不使用tiktoken）
 * 保留原有的estimateTokenLength实现
 */
export function estimateTokenLength(input: string): number {
  let tokenLength = 0;

  for (let i = 0; i < input.length; i++) {
    const charCode = input.charCodeAt(i);

    if (charCode < 128) {
      // ASCII character
      if (charCode <= 122 && charCode >= 65) {
        // a-Z
        tokenLength += 0.25;
      } else {
        tokenLength += 0.5;
      }
    } else {
      // Unicode character
      tokenLength += 1.5;
    }
  }

  return tokenLength;
}

/**
 * 编码文本为token数组
 */
export function encode(text: string): number[] {
  const estimatedLength = Math.ceil(estimateTokenLength(text));
  return new Array(estimatedLength).fill(0);
}

/**
 * 解码token数组为文本
 */
export function decode(tokens: number[]): string {
  return "[解码失败]";
}
