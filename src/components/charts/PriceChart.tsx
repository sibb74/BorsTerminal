import React, { useEffect, useRef } from "react";
import { createChart, ColorType, CrosshairMode, IChartApi, LineStyle } from "lightweight-charts";
import { PriceCandle } from "@/lib/api";

interface PriceChartProps {
  candles: PriceCandle[];
  ticker: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ candles, ticker }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || candles.length === 0) return;

    // Clean up previous chart instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    // Initialize TradingView Lightweight Chart in monochrome terminal theme
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#000000" },
        textColor: "#a3a3a3",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#171717" },
        horzLines: { color: "#171717" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#404040", width: 1, style: LineStyle.Dashed },
        horzLine: { color: "#404040", width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: "#262626",
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: "#262626",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    chartRef.current = chart;

    // 1. Candlestick Series (Colors used STRICTLY for Price Signal)
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    candlestickSeries.setData(
      candles.map((c) => ({
        time: c.date,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    // 2. Volume Histogram Series (Colors used STRICTLY for Volume Signal)
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    chart.priceScale("").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    volumeSeries.setData(
      candles.map((c) => ({
        time: c.date,
        value: c.volume,
        color: c.close >= c.open ? "#22c55e33" : "#ef444433",
      }))
    );

    // 3. Technical Moving Averages (High-Contrast Neutral Monochrome Lines)
    const sma50Series = chart.addLineSeries({
      color: "#e5e5e5", // Bright Neutral White
      lineWidth: 1,
      title: "SMA 50",
    });
    sma50Series.setData(
      candles
        .filter((c) => c.sma50 !== null)
        .map((c) => ({ time: c.date, value: c.sma50! }))
    );

    const sma200Series = chart.addLineSeries({
      color: "#737373", // Dim Neutral Gray
      lineStyle: LineStyle.Dashed,
      lineWidth: 1,
      title: "SMA 200",
    });
    sma200Series.setData(
      candles
        .filter((c) => c.sma200 !== null)
        .map((c) => ({ time: c.date, value: c.sma200! }))
    );

    chart.timeScale().fitContent();

    // Responsive Resize Observer
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [candles, ticker]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#000000] border border-[#262626] rounded-none overflow-hidden select-none font-mono">
      {/* Legend / Overlay Header */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center space-x-4 bg-[#000000] border border-[#262626] px-3 py-1 text-xs select-none">
        <span className="font-bold text-white tracking-widest">{ticker}</span>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-0.5 bg-[#e5e5e5]" />
          <span className="text-neutral-200 text-[10px]">SMA 50</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-0.5 bg-[#737373]" />
          <span className="text-neutral-400 text-[10px]">SMA 200</span>
        </div>
      </div>

      <div ref={chartContainerRef} className="w-full h-full min-h-[350px]" />
    </div>
  );
};
