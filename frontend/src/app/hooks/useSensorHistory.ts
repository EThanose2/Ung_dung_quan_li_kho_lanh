import { useEffect, useMemo, useState } from "react";
import { getSensorHistory } from "../api/dashboardApi";

type Range = "day" | "week" | "month";

type SensorRecord = {
  reading_value: number;
  recorded_at: string;
};

/* ================= RANGE CONFIG (MOVE HERE) ================= */

const RANGE_CONFIG = {
  day: {
    buckets: 7,
    labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", ""],
    getBucket: (date: Date) => Math.min(6, Math.floor(date.getHours() / 4)),
  },
  week: {
    buckets: 7,
    labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
    getBucket: (date: Date) => (date.getDay() + 6) % 7,
  },
  month: {
    buckets: 4,
    labels: ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"],
    getBucket: (date: Date) =>
      Math.min(3, Math.floor((date.getDate() - 1) / 7)),
  },
};

const avg = (arr: number[]) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

export function useSensorHistory(areaIds: string[], range: Range) {
  const [tempRaw, setTempRaw] = useState<SensorRecord[]>([]);
  const [humiRaw, setHumiRaw] = useState<SensorRecord[]>([]);

  /* ================= FETCH ================= */
  useEffect(() => {
    if (!areaIds.length) return;

    async function fetchData() {
      try {
        const tempResponses = await Promise.all(
          areaIds.map((id) =>
            getSensorHistory({ type: "TEMP", area_id: id, limit: 200 }),
          ),
        );

        const humiResponses = await Promise.all(
          areaIds.map((id) =>
            getSensorHistory({ type: "HUMI", area_id: id, limit: 200 }),
          ),
        );

        setTempRaw(tempResponses.flat());
        setHumiRaw(humiResponses.flat());
      } catch (err) {
        console.error("sensor history error:", err);
      }
    }

    fetchData();
  }, [areaIds, range]);

  /* ================= BUILD DATA ================= */
  const chartData = useMemo(() => {
    const config = RANGE_CONFIG[range];

    const tempBuckets: number[][] = Array.from(
      { length: config.buckets },
      () => [],
    );
    const humiBuckets: number[][] = Array.from(
      { length: config.buckets },
      () => [],
    );

    tempRaw.forEach((item) => {
      const idx = config.getBucket(new Date(item.recorded_at));
      tempBuckets[idx].push(item.reading_value);
    });

    humiRaw.forEach((item) => {
      const idx = config.getBucket(new Date(item.recorded_at));
      humiBuckets[idx].push(item.reading_value);
    });

    return config.labels.map((label, i) => ({
      time: label,
      temperature: avg(tempBuckets[i] || []),
      humidity: avg(humiBuckets[i] || []),
    }));
  }, [tempRaw, humiRaw, range]);

  return {
    chartData,
    labels: RANGE_CONFIG[range].labels,
  };
}
