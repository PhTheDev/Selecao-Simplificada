'use client'
import BrandMark from "@/components/BrandMark";

import { cleanPhone, formatPhone } from "@/utils/inputFormatters"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

type RecoverMethod = "email" | "sms"
type SmsStep = "phone" | "code"

const SMS_COOLDOWN_SECONDS = 60
const SMS_EXPIRY_SECONDS = 300
const API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL
const SMS_REQUEST_SUCCESS_MESSAGE =
  "Se este número estiver cadastrado, enviaremos um código por SMS."
const SMS_COOLDOWN_MESSAGE =
  "Aguarde alguns segundos antes de solicitar um novo código."
const SMS_EXPIRED_MESSAGE = "O código de validação expirou."
const SMS_INVALID_CODE_MESSAGE = "Código inválido."

const formatExpiry = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export default function RecoverPasswordPage() {
  const router = useRouter()
  const [method, setMethod] = useState<RecoverMethod>("email")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const [smsStep, setSmsStep] = useState<SmsStep>("phone")
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [expiry, setExpiry] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((prev) => prev - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  useEffect(() => {
    if (expiry <= 0 || smsStep !== "code") return
    const timer = window.setTimeout(() => setExpiry((prev) => prev - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [expiry, smsStep])

  const handleMethodChange = (next: RecoverMethod) => {
    setMethod(next)
    setSmsStep("phone")
    setCode("")
    setVerificationId(null)
    setExpiry(0)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await fetch(`${API_BASE}/api/selection/candidates/password_reset_request/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      toast.success(
        "Se existir uma conta com este email, enviaremos instruções para redefinir a senha."
      )
      setEmail("")
    } catch {
      toast.error("Erro ao solicitar recuperação. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleSmsRequest = async (e?: React.FormEvent) => {
    e?.preventDefault()

    const digits = cleanPhone(phone)
    if (digits.length < 10 || digits.length > 11) {
      toast.error("Informe um telefone válido com DDD.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        `${API_BASE}/api/selection/candidates/password_reset_sms_request/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: digits }),
        }
      )
      const data = await res.json().catch(() => ({}))

      if (res.status === 429 || data?.code === "RESEND_COOLDOWN") {
        toast.error(SMS_COOLDOWN_MESSAGE)
        return
      }

      if (!res.ok) {
        toast.error("Erro ao solicitar recuperação. Tente novamente.")
        return
      }

      const expiresIn = Number(data?.expires_in) || SMS_EXPIRY_SECONDS
      if (data?.verification_id) {
        setVerificationId(String(data.verification_id))
      }

      toast.success(SMS_REQUEST_SUCCESS_MESSAGE)
      setSmsStep("code")
      setCooldown(SMS_COOLDOWN_SECONDS)
      setExpiry(expiresIn)
      setCode("")
    } catch {
      toast.error("Erro ao solicitar recuperação. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleSmsVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    if (expiry <= 0) {
      toast.error("O código de validação expirou. Solicite um novo código.")
      return
    }

    if (!verificationId) {
      toast.error("Solicite um novo código para continuar.")
      setSmsStep("phone")
      return
    }

    const otp = code.replace(/\D/g, "")
    if (otp.length !== 6) {
      toast.error("Informe o código de 6 dígitos.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        `${API_BASE}/api/selection/candidates/password_reset_sms_verify/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verification_id: verificationId, code: otp }),
        }
      )
      const data = await res.json()

      if (!res.ok) {
        if (data?.code === "CODE_EXPIRED") {
          toast.error(SMS_EXPIRED_MESSAGE)
          setExpiry(0)
          return
        }
        if (data?.code === "BLOCKED") {
          toast.error("Muitas tentativas inválidas. Solicite um novo código.")
          setSmsStep("phone")
          setVerificationId(null)
          setCode("")
          return
        }
        toast.error(SMS_INVALID_CODE_MESSAGE)
        return
      }

      if (!data?.reset_token) {
        toast.error("Código inválido.")
        return
      }

      toast.success("Código validado. Defina sua nova senha.")
      router.push(`/auth/redefinir-senha?token=${data.reset_token}`)
    } catch {
      toast.error("Erro ao validar o código. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const description =
    method === "email"
      ? "Informe seu e-mail e enviaremos um link para redefinição."
      : smsStep === "phone"
        ? "Informe o telefone cadastrado e enviaremos um código por SMS."
        : "Digite o código de 6 dígitos enviado por SMS."

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <div className="relative hidden flex-1 flex-col justify-between bg-primary-soft p-12 lg:flex lg:min-h-screen">
        <BrandMark />
        <p className="max-w-sm font-serif text-5xl leading-[1.05] text-foreground">
          Um edital, <span className="italic">uma chance.</span>
        </p>
        <p className="text-sm text-muted-foreground">Inscrição, acompanhamento e resultado em um só lugar.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-background">

        <div className="relative z-10 w-full max-w-md">
          <div className="auth-card bg-card rounded-3xl p-8 border">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-foreground mb-2">Recuperar senha</h2>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>

            <div
              className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1 border"
              role="tablist"
              aria-label="Método de recuperação"
            >
              <button
                type="button"
                role="tab"
                aria-selected={method === "email"}
                aria-label="Recuperar por e-mail"
                tabIndex={0}
                onClick={() => handleMethodChange("email")}
                className={cn(
                  "relative rounded-xl py-2.5 text-sm font-semibold transition-colors duration-300",
                  method === "email" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {method === "email" && (
                  <motion.span
                    layoutId="recover-tab"
                    className="absolute inset-0 rounded-xl border bg-card shadow-sm"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">E-mail</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={method === "sms"}
                aria-label="Recuperar por SMS"
                tabIndex={0}
                onClick={() => handleMethodChange("sms")}
                className={cn(
                  "relative rounded-xl py-2.5 text-sm font-semibold transition-colors duration-300",
                  method === "sms" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {method === "sms" && (
                  <motion.span
                    layoutId="recover-tab"
                    className="absolute inset-0 rounded-xl border bg-card shadow-sm"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">SMS</span>
              </button>
            </div>

            {method === "email" ? (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-foreground text-sm font-medium mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300 disabled:opacity-50"
                    placeholder="seu@email.com"
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  aria-label="Enviar link de recuperação por e-mail"
                  className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Enviando..." : "Enviar link"}
                </button>
              </form>
            ) : smsStep === "phone" ? (
              <form onSubmit={handleSmsRequest} className="space-y-6">
                <div>
                  <label htmlFor="phone" className="block text-foreground text-sm font-medium mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    className="w-full px-4 py-3 bg-background border border-input rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300 disabled:opacity-50"
                    placeholder="(62) 99999-9999"
                    required
                    disabled={loading}
                    aria-label="Telefone com DDD"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  aria-label="Enviar código de recuperação por SMS"
                  className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Enviando..." : "Enviar código"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSmsVerify} className="space-y-6">
                <div>
                  <label htmlFor="otp" className="block text-foreground text-sm font-medium mb-2">
                    Código SMS
                  </label>
                  <input
                    type="text"
                    id="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full px-4 py-3 bg-background border border-input rounded-2xl text-foreground placeholder-muted-foreground tracking-[0.35em] text-center text-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300 disabled:opacity-50"
                    placeholder="000000"
                    required
                    disabled={loading || expiry <= 0}
                    aria-label="Código de verificação de 6 dígitos"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Enviado para {phone || "seu telefone"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {expiry > 0
                      ? `Código válido por ${formatExpiry(expiry)}`
                      : "Código expirado. Solicite um novo código."}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6 || expiry <= 0}
                  aria-label="Validar código SMS"
                  className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Validando..." : "Validar código"}
                </button>

                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setSmsStep("phone")
                      setCode("")
                      setVerificationId(null)
                      setExpiry(0)
                    }}
                    className="text-primary hover:text-primary text-sm font-medium transition-colors duration-300 hover:underline"
                    aria-label="Alterar número de telefone"
                    tabIndex={0}
                  >
                    Alterar telefone
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSmsRequest()}
                    disabled={loading || cooldown > 0}
                    className="text-primary hover:text-primary text-sm font-medium transition-colors duration-300 hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                    aria-label="Reenviar código SMS"
                    tabIndex={0}
                  >
                    {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar código"}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/auth/login-candidato"
                className="text-primary hover:text-primary font-medium transition-colors duration-300 hover:underline"
              >
                Voltar para o login
              </Link>
            </div>

            <p className="mt-6 text-xs text-muted-foreground text-center">
              &copy; {new Date().getFullYear()} Seleção Simplificada. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
