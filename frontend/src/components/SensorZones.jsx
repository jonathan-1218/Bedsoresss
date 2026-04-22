import React, { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

// sensors: array of 6 raw values [S0,S1,S2,S3,S4,S5]
// motorsEnabled: bool
// immobileHistory: array of { t, sec } for the area chart
export default function SensorZones({ sensors = [0,0,0,0,0,0], motorsEnabled, immobileHistory = [] }) {
  // Zone pairs matching ESP32 logic: Left=[S0+S3], Center=[S1+S4], Right=[S2+S5]
  const zones = useMemo(() => {
    const s = sensors;
    const maxRaw = 1023;
    return [
      {
        label: "Left",
        key: "S0+S3",
        value: Math.min(((s[0] + s[3]) / (2 * maxRaw)) * 100, 100),
        motorActive: motorsEnabled && (s[0] + s[3]) > 400,
      },
      {
        label: "Center",
        key: "S1+S4",
        value: Math.min(((s[1] + s[4]) / (2 * maxRaw)) * 100, 100),
        motorActive: motorsEnabled && (s[1] + s[4]) > 400,
      },
      {
        label: "Right",
        key: "S2+S5",
        value: Math.min(((s[2] + s[5]) / (2 * maxRaw)) * 100, 100),
        motorActive: motorsEnabled && (s[2] + s[5]) > 400,
      },
    ];
  }, [sensors, motorsEnabled]);

  return (
    <div className="rounded-2xl bg-[#141a14] border border-[#1e2a1e] p-6 space-y-6">

      {/* SENSOR ZONES */}
      <div>
        <p className="text-xs font-mono tracking-widest text-[#6b7f6b] mb-4 uppercase">
          Sensor Zones
        </p>

        <div className="space-y-4">
          {zones.map((zone) => {
            const isHot = zone.value > 40;
            const dotColor = isHot ? "bg-orange-400" : "bg-[#3a4a3a]";
            const barColor = isHot ? "bg-orange-400" : "bg-[#2a3a2a]";
            const barFill = isHot ? "bg-orange-400" : "bg-[#3a5a3a]";

            return (
              <div key={zone.label} className="flex items-center gap-4">
                {/* Dot */}
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${dotColor}`} />

                {/* Label */}
                <span className="font-mono text-sm text-white w-36 flex-shrink-0">
                  {zone.label}{" "}
                  <span className="text-[#6b7f6b]">({zone.key})</span>
                </span>

                {/* Bar track */}
                <div className="flex-1 h-2 rounded-full bg-[#1e2a1e] relative overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barFill}`}
                    style={{ width: `${zone.value}%` }}
                  />
                  {/* Slider thumb indicator */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all duration-700 ${
                      isHot
                        ? "bg-orange-400 border-orange-300"
                        : "bg-[#3a5a3a] border-[#4a6a4a]"
                    }`}
                    style={{ left: `calc(${zone.value}% - 6px)` }}
                  />
                </div>

                {/* Motor status */}
                <span className={`font-mono text-xs text-right w-16 leading-tight flex-shrink-0 ${
                  zone.motorActive ? "text-orange-400" : "text-[#4a5a4a]"
                }`}>
                  motor{"\n"}{zone.motorActive ? "ON" : "off"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* DIVIDER */}
      <div className="border-t border-[#1e2a1e]" />

      {/* IMMOBILITY HISTORY */}
      <div>
        <p className="text-xs font-mono tracking-widest text-[#6b7f6b] mb-3 uppercase">
          Immobility History
        </p>

        <div className="h-32">
          {immobileHistory.length < 2 ? (
            <div className="h-full flex items-end">
              {/* Flat line placeholder matching screenshot */}
              <div className="w-full h-px bg-[#1e5a8a]/40" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={immobileHistory} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="immobileGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #1e3a5a", borderRadius: "8px", fontSize: 11 }}
                  formatter={(v) => [`${v}s`, "Immobile"]}
                  labelFormatter={() => ""}
                />
                <Area
                  type="monotone"
                  dataKey="sec"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#immobileGrad)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
