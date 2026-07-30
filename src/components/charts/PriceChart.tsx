import React, { useEffect, useRef } from "react";
import { createChart, ColorType, CrosshairMode, IChartApi } from "lightweight-charts";
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

    // Initialize TradingView Lightweight Chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#070a12" },
        textColor: "#94a3b8",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#111827" },
        horzLines: { color: "#111827" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#334155", width: 1, style: 3 },
        horzLine: { color: "#334155", width: 1, style: 3 },
      },
      rightPriceScale: {
        borderColor: "#1e293b",
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: "#1e293b",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    chartRef.current = chart;

    // 1. Candlestick Series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
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

    // 2. Volume Histogram Series
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
        color: c.close >= c.open ? "#10b98133" : "#ef444433",
      }))
    );

    // 3. Technical Moving Averages (SMA50 & SMA200)
    const sma50Series = chart.addLineSeries({
      color: "#f59e0b", // Amber
      lineWidth: 2,
      title: "SMA 50",
    });
    sma50Series.setData(
      candles
        .filter((c) => c.sma50 !== null)
        .map((c) => ({ time: c.date, value: c.sma50! }))
    );

    const sma200Series = chart.addLineSeries({
      color: "#06b6d4", // Cyan
      lineWidth: 2,
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
    <div className="relative w-full h-full flex flex-col bg-[#070a12] border border-slate-800/80 rounded-lg overflow-hidden">
      {/* Legend / Overlay Header */}
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-4 bg-[#0d1322]/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded text-xs font-mono select-none">
        <span className="font-bold text-white tracking-wider">{ticker}</span>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-0.5 bg-[#f59e0b] rounded" />
          <span className="text-amber-400 text-[11px]">SMA 50</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-0.5 bg-[#06b6d4] rounded" />
          <span className="text-cyan-400 text-[11px]">SMA 200</span>
        </div>
      </div>

      <div ref={chartContainerRef} className="w-full h-full min-h-[350px]" />
    </div>
  );
};
