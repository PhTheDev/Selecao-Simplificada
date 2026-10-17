'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ChangeEvent, FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import AuthField from './AuthField';

// ✅ use seu util atualizado
import { setCandidateSession } from '@/utils/candidateAuth';
import { safeInternalRedirect } from '@/utils/safeNavigation';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginResponse {
  candidate: {
    id: number;
    name: string;
    email: string;
    email_verified: boolean;
    profile_image_url?: string;
  };
  tokens: {
    access: string;
    refresh: string;
  };
}

interface ErrorResponse {
  detail?: string;
  non_field_errors?: string[] | string;
  email?: string[] | string;
  password?: string[] | string;
  error?: string[] | string;
  code?: string; // (se seu backend mandar)
  [key: string]: string[] | string | undefined;
}

/**
 * Extrai mensagem de erro do DRF/Backend com prioridade,
 * e retorna também flags úteis para UI.
 */
function parseLoginError(errorData: ErrorResponse) {
  const pick = (v?: string[] | string) =>
    Array.isArray(v) ? v.join(', ') : typeof v === 'string' ? v : '';

  // 1) tenta pegar campos comuns do DRF
  const raw =
    pick(errorData.non_field_errors) ||
    pick(errorData.detail) ||
    pick(errorData.error) ||
    pick(errorData.email) ||
    pick(errorData.password) ||
    '';

  const lower = (raw || '').toLowerCase();

  const isEmailNotVerified =
    lower.includes('verifique seu email') ||
    lower.includes('email não verificado') ||
    lower.includes('confirmação') ||
    lower.includes('email de confirmação') ||
    lower.includes('por favor, verifique');

  const isInvalidCredentials =
    lower.includes('invalid') ||
    lower.includes('invalid credentials') ||
    lower.includes('credenciais') ||
    lower.includes('senha incorreta') ||
    lower.includes('email ou senha') ||
    lower.includes('não foi possível autenticar') ||
    lower.includes('usuário ou senha') ||
    lower.includes('user') ||
    lower.includes('password');

  // fallback padrão (mais amigável)
  const message = isEmailNotVerified
    ? 'Email não verificado. Por favor, verifique seu email antes de fazer login.'
    : isInvalidCredentials
      ? 'E-mail ou senha incorretos. Verifique e tente novamente.'
      : raw
        ? raw
        : 'Não foi possível entrar. Tente novamente.';

  return {
    message,
    isEmailNotVerified,
    isInvalidCredentials,
    fieldEmail: !!errorData.email,
    fieldPassword: !!errorData.password,
  };
}

export function FormEventLoginCandidate() {
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [showResendOption, setShowResendOption] = useState(false);

  // ✅ feedback granular
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [resendMessage, setResendMessage] = useState<string>('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);
    setError('');
    setFieldErrors({});
    setShowResendOption(false);
    setResendMessage('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/candidates/login/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        const data = (await response.json()) as LoginResponse;

        setCandidateSession({
          accessToken: data.tokens.access,
          refreshToken: data.tokens.refresh,
          user: {
            id: data.candidate.id,
            name: data.candidate.name,
            email: data.candidate.email,
            profile_image_url: data.candidate.profile_image_url ?? null,
          },
          accessMaxAgeSeconds: 3600,
          refreshMaxAgeSeconds: 604800,
          userMaxAgeSeconds: 3600,
        });

        // (opcional) se você realmente precisa desse cookie separado
        document.cookie = `candidate-id=${encodeURIComponent(String(data.candidate.id))}; path=/; max-age=3600; samesite=lax${
          process.env.NODE_ENV === 'production' ? '; secure' : ''
        }`;

        toast.success(`Bem-vindo, ${data.candidate.name}!`);

        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = safeInternalRedirect(urlParams.get('redirect'), '/candidato');

        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 500);

        return;
      }

      // ❌ erro
      let errorData: ErrorResponse = {};
      try {
        errorData = (await response.json()) as ErrorResponse;
      } catch {
        // se vier texto puro
        const txt = await response.text();
        errorData = { detail: txt || 'Erro ao autenticar' };
      }

      const parsed = parseLoginError(errorData);

      // ✅ mensagens de campo (se o backend mandar)
      const emailErr = Array.isArray(errorData.email) ? errorData.email.join(', ') : errorData.email;
      const passErr = Array.isArray(errorData.password) ? errorData.password.join(', ') : errorData.password;

      setFieldErrors({
        email: emailErr || (parsed.isInvalidCredentials ? 'Confira seu e-mail.' : undefined),
        password: passErr || (parsed.isInvalidCredentials ? 'Confira sua senha.' : undefined),
      });

      setError(parsed.message);

      if (parsed.isEmailNotVerified) {
        setShowResendOption(true);
        toast.error('Email não verificado. Verifique seu email.');
      } else if (parsed.isInvalidCredentials) {
        toast.error('E-mail ou senha incorretos.');
      } else {
        toast.error(parsed.message);
      }
    } catch {
      const msg = 'Erro ao conectar com o servidor. Verifique sua conexão.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      toast.error('Digite seu email para reenviar a confirmação.');
      setFieldErrors((prev) => ({ ...prev, email: 'Informe seu e-mail para reenviar.' }));
      return;
    }

    setIsResending(true);
    setResendMessage('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/candidates/resend_verification/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email }),
        }
      );

      if (response.ok) {
        await response.json();
        setResendMessage('Email de verificação reenviado com sucesso! Verifique sua caixa de entrada.');
        toast.success('Email de verificação reenviado com sucesso!');

        setTimeout(() => {
          setShowResendOption(false);
          setResendMessage('');
        }, 5000);

        return;
      }

      let errorData: ErrorResponse = {};
      try {
        errorData = (await response.json()) as ErrorResponse;
      } catch {
        const txt = await response.text();
        errorData = { detail: txt || 'Erro ao reenviar confirmação' };
      }

      const msg =
        (Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors.join(', ') : errorData.non_field_errors) ||
        (Array.isArray(errorData.error) ? errorData.error.join(', ') : errorData.error) ||
        (Array.isArray(errorData.detail) ? errorData.detail.join(', ') : errorData.detail) ||
        'Erro ao reenviar email de verificação.';

      setResendMessage(msg);
      toast.error(msg);
    } catch {
      const msg = 'Erro ao conectar com o servidor.';
      setResendMessage(msg);
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // limpa erros ao digitar
    if (error) setError('');
    if (showResendOption) setShowResendOption(false);
    if (resendMessage) setResendMessage('');

    if (name === 'email' && fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    }
    if (name === 'password' && fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="auth-card bg-card rounded-3xl p-8 border shadow-xl shadow-primary/5"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Acessar Conta</h2>
          <p className="text-muted-foreground text-sm">Entre com suas credenciais</p>
        </div>

        {error && (
          <div
            className={`mb-6 p-4 rounded-2xl text-sm ${
              showResendOption
                ? 'bg-warning/20 border border-warning/50 text-warning'
                : 'bg-destructive/20 border border-destructive/50 text-destructive'
            }`}
          >
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>

              <div>
                <p>{error}</p>

                {showResendOption && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className="bg-gradient-to-r from-warning to-warning hover:from-warning hover:to-warning text-foreground font-medium py-2 px-4 rounded-lg transition-all duration-300 text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResending ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          Reenviar email de confirmação
                        </>
                      )}
                    </button>

                    <p className="text-xs text-warning/70 mt-2">Verifique também sua pasta de spam/lixo eletrônico</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {resendMessage && !showResendOption && (
          <div className="mb-6 p-4 bg-success/20 border border-success/50 rounded-2xl text-success text-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {resendMessage}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <AuthField id="email" label="E-mail" type="email" value={formData.email} onChange={handleChange} placeholder="seu@email.com" error={fieldErrors.email} disabled={isLoading} />
          <AuthField id="password" label="Senha" type="password" value={formData.password} onChange={handleChange} placeholder="Sua senha" error={fieldErrors.password} disabled={isLoading} />

          <div className="flex justify-end">
            <Link
              href="/auth/recuperar-senha"
              className="text-primary hover:text-primary text-sm font-medium transition-colors duration-300"
            >
              Esqueceu sua senha?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
              </>
            ) : (
              <>
                Entrar <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Não tem uma conta?{' '}
            <Link
              href="/auth/register"
              className="text-primary hover:text-primary font-medium transition-colors duration-300 hover:underline"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
