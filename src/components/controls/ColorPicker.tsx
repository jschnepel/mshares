import { useState, useEffect } from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [text, setText] = useState(value);

  useEffect(() => { setText(value); }, [value]);

  const handleText = (v: string) => {
    setText(v);
    if (HEX_RE.test(v)) onChange(v);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={e => { onChange(e.target.value); setText(e.target.value); }}
        className="w-6 h-6 rounded border border-navy-medium cursor-pointer bg-transparent p-0"
        title={label}
      />
      <div className="flex-1 min-w-0">
        <label className="text-[9px] text-gray-muted block leading-tight">{label}</label>
        <input
          type="text"
          value={text}
          onChange={e => handleText(e.target.value)}
          className="w-full bg-navy-light/60 border border-navy-medium rounded px-1.5 py-0.5 text-[10px] text-cream font-mono"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
