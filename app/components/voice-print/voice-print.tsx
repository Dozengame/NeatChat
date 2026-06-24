import { useEffect, useRef, useCallback } from "react";
import styles from "./voice-print.module.scss";

interface VoicePrintProps {
  frequencies?: Uint8Array;
  isActive?: boolean;
}

const WAVE_COLOR_FALLBACKS = {
  start: "rgba(49, 94, 248, 0.72)",
  middle: "rgba(96, 132, 255, 0.62)",
  end: "rgba(49, 94, 248, 0.72)",
};

function readCanvasColor(
  computedStyle: CSSStyleDeclaration,
  property: string,
  resolvedColor: string,
  fallback: string,
) {
  return (
    resolvedColor || computedStyle.getPropertyValue(property).trim() || fallback
  );
}

function addGradientStop(
  gradient: CanvasGradient,
  offset: number,
  color: string,
  fallback: string,
) {
  try {
    gradient.addColorStop(offset, color);
  } catch {
    gradient.addColorStop(offset, fallback);
  }
}

export function VoicePrint({ frequencies, isActive }: VoicePrintProps) {
  // Canvas引用，用于获取绘图上下文
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 存储历史频率数据，用于平滑处理
  const historyRef = useRef<number[][]>([]);
  // 控制保留的历史数据帧数，影响平滑度
  const historyLengthRef = useRef(10);
  /**
   * 更新频率历史数据
   * 使用FIFO队列维护固定长度的历史记录
   */
  const updateHistory = useCallback((freqArray: number[]) => {
    historyRef.current.push(freqArray);
    if (historyRef.current.length > historyLengthRef.current) {
      historyRef.current.shift();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let animationFrameId: number | undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    /**
     * 处理高DPI屏幕显示
     * 根据设备像素比例调整canvas实际渲染分辨率
     */
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    /**
     * 主要绘制函数
     * 使用requestAnimationFrame实现平滑动画
     * 包含以下步骤：
     * 1. 清空画布
     * 2. 更新历史数据
     * 3. 计算波形点
     * 4. 绘制上下对称的声纹
     */
    const draw = () => {
      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!frequencies || !isActive) {
        historyRef.current = [];
        return;
      }

      const freqArray = Array.from(frequencies);
      updateHistory(freqArray);

      // 绘制声纹
      const points: [number, number][] = [];
      const centerY = canvas.height / 2;
      const width = canvas.width;
      const sliceWidth = width / (frequencies.length - 1);

      // 绘制主波形
      ctx.beginPath();
      ctx.moveTo(0, centerY);

      /**
       * 声纹绘制算法：
       * 1. 使用历史数据平均值实现平滑过渡
       * 2. 通过正弦函数添加自然波动
       * 3. 使用贝塞尔曲线连接点，使曲线更平滑
       * 4. 绘制对称部分形成完整声纹
       */
      for (let i = 0; i < frequencies.length; i++) {
        const x = i * sliceWidth;
        let avgFrequency = frequencies[i];

        /**
         * 波形平滑处理：
         * 1. 收集历史数据中对应位置的频率值
         * 2. 计算当前值与历史值的加权平均
         * 3. 根据平均值计算实际显示高度
         */
        if (historyRef.current.length > 0) {
          const historicalValues = historyRef.current.map((h) => h[i] || 0);
          avgFrequency =
            (avgFrequency + historicalValues.reduce((a, b) => a + b, 0)) /
            (historyRef.current.length + 1);
        }

        /**
         * 波形变换：
         * 1. 归一化频率值到0-1范围
         * 2. 添加时间相关的正弦变换
         * 3. 使用贝塞尔曲线平滑连接点
         */
        const normalized = avgFrequency / 255.0;
        const height = normalized * (canvas.height / 2);
        const y = centerY + height * Math.sin(i * 0.2 + Date.now() * 0.002);

        points.push([x, y]);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          // 使用贝塞尔曲线使波形更平滑
          const prevPoint = points[i - 1];
          const midX = (prevPoint[0] + x) / 2;
          ctx.quadraticCurveTo(
            prevPoint[0],
            prevPoint[1],
            midX,
            (prevPoint[1] + y) / 2,
          );
        }
      }

      // 绘制对称的下半部分
      for (let i = points.length - 1; i >= 0; i--) {
        const [x, y] = points[i];
        const symmetricY = centerY - (y - centerY);
        if (i === points.length - 1) {
          ctx.lineTo(x, symmetricY);
        } else {
          const nextPoint = points[i + 1];
          const midX = (nextPoint[0] + x) / 2;
          ctx.quadraticCurveTo(
            nextPoint[0],
            centerY - (nextPoint[1] - centerY),
            midX,
            centerY - ((nextPoint[1] + y) / 2 - centerY),
          );
        }
      }

      ctx.closePath();

      const computedStyle = getComputedStyle(canvas);
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      addGradientStop(
        gradient,
        0,
        readCanvasColor(
          computedStyle,
          "--voice-print-wave-start",
          computedStyle.borderTopColor,
          WAVE_COLOR_FALLBACKS.start,
        ),
        WAVE_COLOR_FALLBACKS.start,
      );
      addGradientStop(
        gradient,
        0.5,
        readCanvasColor(
          computedStyle,
          "--voice-print-wave-middle",
          computedStyle.borderRightColor,
          WAVE_COLOR_FALLBACKS.middle,
        ),
        WAVE_COLOR_FALLBACKS.middle,
      );
      addGradientStop(
        gradient,
        1,
        readCanvasColor(
          computedStyle,
          "--voice-print-wave-end",
          computedStyle.borderBottomColor,
          WAVE_COLOR_FALLBACKS.end,
        ),
        WAVE_COLOR_FALLBACKS.end,
      );

      ctx.fillStyle = gradient;
      ctx.fill();

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    // 启动动画循环
    draw();

    // 清理函数：在组件卸载时取消动画
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [frequencies, isActive, updateHistory]);

  return (
    <div
      className={styles["voice-print"]}
      data-active={isActive ? "true" : "false"}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
}
