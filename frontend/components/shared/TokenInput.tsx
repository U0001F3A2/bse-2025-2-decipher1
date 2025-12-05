"use client";

interface TokenInputProps {
  value: string;
  onChange: (value: string) => void;
  symbol: string;
  balance?: string;
  onMax?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TokenInput({
  value,
  onChange,
  symbol,
  balance,
  onMax,
  disabled,
  placeholder = "0.0",
}: TokenInputProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-4">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            // Allow only valid decimal numbers
            if (val === "" || /^\d*\.?\d*$/.test(val)) {
              onChange(val);
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full bg-transparent text-2xl font-medium outline-none placeholder:text-foreground-muted/50 disabled:cursor-not-allowed"
        />
        <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
          <span className="font-medium">{symbol}</span>
        </div>
      </div>
      {balance && (
        <div className="mt-3 flex items-center justify-between text-sm text-foreground-muted">
          <span>Balance: {balance}</span>
          {onMax && (
            <button
              onClick={onMax}
              className="text-accent-purple hover:text-accent-cyan"
            >
              MAX
            </button>
          )}
        </div>
      )}
    </div>
  );
}
