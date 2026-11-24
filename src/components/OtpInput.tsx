import { useRef } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}

export function OtpInput({ value, onChange, disabled = false, invalid = false }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? "");

  function updateAt(index: number, nextDigit: string) {
    const chars = digits.slice();
    chars[index] = nextDigit;
    onChange(chars.join("").replace(/\D/g, "").slice(0, 6));
  }

  return (
    <div className={`otp-inputs${invalid ? " otp-inputs-invalid" : ""}`} role="group" aria-label="6-digit verification code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          className="otp-digit"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${index + 1}`}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => {
            const next = event.target.value.replace(/\D/g, "");
            if (next.length > 1) {
              const merged = `${digits.join("").slice(0, index)}${next}`.slice(0, 6);
              onChange(merged);
              refs.current[Math.min(merged.length, 5)]?.focus();
              return;
            }

            updateAt(index, next);
            if (next && index < 5) {
              refs.current[index + 1]?.focus();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index] && index > 0) {
              refs.current[index - 1]?.focus();
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            if (!pasted) {
              return;
            }
            onChange(pasted);
            refs.current[Math.min(pasted.length, 5)]?.focus();
          }}
        />
      ))}
    </div>
  );
}
