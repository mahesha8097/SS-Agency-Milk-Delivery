'use client';

import { Minus, Plus } from 'lucide-react';

interface PacketCounterProps {
  label: string;
  subLabel?: string;
  price: number;
  count: number;
  onChange: (newCount: number) => void;
}

export default function PacketCounter({
  label,
  subLabel,
  price,
  count,
  onChange,
}: PacketCounterProps) {
  const handleDecrement = () => {
    if (count > 0) onChange(count - 1);
  };

  const handleIncrement = () => {
    onChange(count + 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 0) {
      onChange(0);
    } else {
      onChange(val);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center justify-between">
      <div>
        <div className="font-semibold text-slate-800 text-sm md:text-base">{label}</div>
        <div className="text-xs text-slate-500">
          ₹{price} / pkt {subLabel ? `• ${subLabel}` : ''}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={count <= 0}
          className="w-11 h-11 rounded-lg bg-slate-100 active:bg-slate-200 disabled:opacity-40 disabled:active:bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xl touch-manipulation border border-slate-300 select-none"
        >
          <Minus className="w-5 h-5" />
        </button>

        <input
          type="number"
          min="0"
          value={count}
          onChange={handleInputChange}
          className="w-14 h-11 text-center font-bold text-lg text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nandini-blue"
        />

        <button
          type="button"
          onClick={handleIncrement}
          className="w-11 h-11 rounded-lg bg-nandini-blue active:bg-nandini-dark text-white font-bold flex items-center justify-center text-xl touch-manipulation shadow-sm select-none"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
