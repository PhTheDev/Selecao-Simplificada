'use client';

import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { ChangeEvent, KeyboardEvent, useState } from 'react';

type Props = {
  id: string;
  label: string;
  type: 'email' | 'password';
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  error?: string;
  disabled?: boolean;
};

/** Campo de login: ícone à esquerda, mostrar/ocultar senha, aviso de Caps Lock e autocomplete correto. */
export default function AuthField({ id, label, type, value, onChange, placeholder, error, disabled }: Props) {
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const isPassword = type === 'password';
  const Icon = isPassword ? Lock : Mail;
  const checkCaps = (e: KeyboardEvent<HTMLInputElement>) => isPassword && setCaps(e.getModifierState('CapsLock'));

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      <div className="group relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" strokeWidth={1.5} />
        <input
          id={id}
          name={id}
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={onChange}
          onKeyUp={checkCaps}
          onKeyDown={checkCaps}
          onBlur={() => setCaps(false)}
          placeholder={placeholder}
          autoComplete={isPassword ? 'current-password' : 'email'}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          required
          disabled={disabled}
          className={`w-full rounded-2xl border bg-background py-3.5 pl-11 ${isPassword ? 'pr-12' : 'pr-4'} text-foreground outline-none transition-all placeholder:text-muted-foreground hover:border-primary/40 focus:ring-2 disabled:opacity-50 ${
            error ? 'border-destructive/70 focus:ring-destructive' : 'border-input focus:border-primary focus:ring-primary/30'
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            disabled={disabled}
            aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            {show ? <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.5} /> : <Eye className="h-[18px] w-[18px]" strokeWidth={1.5} />}
          </button>
        )}
      </div>
      {caps && <p className="mt-2 text-xs text-warning">Caps Lock está ativado.</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
