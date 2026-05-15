import React from "react";
import { Clock } from "lucide-react";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const hours = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
const minutes = ["00", "15", "30", "45"];

const parseTime = (value: string) => {
  if (!value) return { hour: "06", minute: "00", period: "AM" as "AM" | "PM" };
  const [rawHour = "06", minute = "00"] = value.split(":");
  const hour24 = Number(rawHour);
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return { hour: String(hour12).padStart(2, "0"), minute, period };
};

const toValue = (hour: string, minute: string, period: "AM" | "PM") => {
  const hourNumber = Number(hour);
  const hour24 = period === "PM" ? (hourNumber % 12) + 12 : hourNumber === 12 ? 0 : hourNumber;
  return `${String(hour24).padStart(2, "0")}:${minute}`;
};

export const formatDisplayTime = (value: string) => {
  const parsed = parseTime(value);
  return `${parsed.hour}:${parsed.minute} ${parsed.period}`;
};

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
  const parsed = parseTime(value);

  const update = (next: Partial<typeof parsed>) => {
    const hour = next.hour ?? parsed.hour;
    const minute = next.minute ?? parsed.minute;
    const period = (next.period ?? parsed.period) as "AM" | "PM";
    onChange(toValue(hour, minute, period));
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
          <Clock className="h-4 w-4 text-emerald-500" />
          Select Time
        </span>
        <span className="rounded-2xl bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
          {formatDisplayTime(value)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase text-slate-400">Hour</p>
          <div className="grid grid-cols-3 gap-1.5">
            {hours.map(hour => (
              <button
                key={hour}
                type="button"
                onClick={() => update({ hour })}
                className={`rounded-xl py-2 text-xs font-black ${parsed.hour === hour ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300"}`}
              >
                {hour}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase text-slate-400">Minute</p>
          <div className="grid grid-cols-2 gap-1.5">
            {minutes.map(minute => (
              <button
                key={minute}
                type="button"
                onClick={() => update({ minute })}
                className={`rounded-xl py-2 text-xs font-black ${parsed.minute === minute ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300"}`}
              >
                {minute}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase text-slate-400">AM/PM</p>
          <div className="grid gap-1.5">
            {(["AM", "PM"] as const).map(period => (
              <button
                key={period}
                type="button"
                onClick={() => update({ period })}
                className={`rounded-xl py-3 text-xs font-black ${parsed.period === period ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300"}`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
