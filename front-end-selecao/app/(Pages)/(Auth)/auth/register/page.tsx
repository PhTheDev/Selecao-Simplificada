'use client';
import BrandMark from "@/components/BrandMark";

import { linkPoliticaPrivacidade } from "@/config/ConselhoConfig";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useState } from 'react';
import { toast } from 'sonner';

interface RegisterFormData {
    name: string;
    email: string;
    password: string;
    password_confirm: string;
}

interface RegisterResponse {
    message: string;
    email: string;
    candidate_id: number;
    email_verified: boolean;
}

interface ErrorResponse {
    detail?: string;
    email?: string[];
    password?: string[];
    password_confirm?: string[];
    name?: string[];
    [key: string]: string[] | string | undefined;
}

export default function Register() {
    const [formData, setFormData] = useState<RegisterFormData>({
        name: '',
        email: '',
        password: '',
        password_confirm: ''
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [registeredEmail, setRegisteredEmail] = useState<string>('');
    const [error, setError] = useState<string>('');
    const router = useRouter();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setIsSuccess(false);

        // Validação básica no cliente
        if (formData.password !== formData.password_confirm) {
            setError('As senhas não coincidem');
            toast.error('As senhas não coincidem');
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres');
            toast.error('A senha deve ter no mínimo 6 caracteres');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/candidates/register/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: formData.name,
                        email: formData.email,
                        password: formData.password,
                        password_confirm: formData.password_confirm
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                const registerData = data as RegisterResponse;

                console.log('✅ Registro realizado com sucesso:', registerData.email);
                toast.success(registerData.message || 'Cadastro realizado com sucesso!');

                // Marca como sucesso e mostra instruções
                setIsSuccess(true);
                setRegisteredEmail(registerData.email);

                // Limpa o formulário
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    password_confirm: ''
                });

            } else {
                const errorData = data as ErrorResponse;

                // Tratamento de erros específicos da API
                if (errorData.email) {
                    const errorMsg = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
                    setError(errorMsg);
                    toast.error(errorMsg);
                } else if (errorData.password) {
                    const errorMsg = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password;
                    setError(errorMsg);
                    toast.error(errorMsg);
                } else if (errorData.password_confirm) {
                    const errorMsg = Array.isArray(errorData.password_confirm) ? errorData.password_confirm[0] : errorData.password_confirm;
                    setError(errorMsg);
                    toast.error(errorMsg);
                } else if (errorData.name) {
                    const errorMsg = Array.isArray(errorData.name) ? errorData.name[0] : errorData.name;
                    setError(errorMsg);
                    toast.error(errorMsg);
                } else if (errorData.detail) {
                    setError(errorData.detail);
                    toast.error(errorData.detail);
                } else {
                    setError('Erro ao criar conta. Tente novamente.');
                    toast.error('Erro ao criar conta. Tente novamente.');
                }
            }
        } catch (err) {
            console.error('Erro no registro:', err);
            setError('Erro ao conectar com o servidor. Verifique sua conexão.');
            toast.error('Erro ao conectar com o servidor. Verifique sua conexão.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerification = async (): Promise<void> => {
        if (!registeredEmail) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/candidates/resend_verification/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: registeredEmail
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                toast.success('Email de verificação reenviado com sucesso!');
            } else {
                const errorMsg = data.error || data.message || 'Erro ao reenviar email de verificação';
                setError(errorMsg);
                toast.error(errorMsg);
            }
        } catch (err) {
            console.error('Erro ao reenviar verificação:', err);
            setError('Erro ao conectar com o servidor.');
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Limpa o erro quando o usuário começar a digitar
        if (error) {
            setError('');
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen">
            {/* Seção da Imagem */}
            <div className="relative hidden flex-1 flex-col justify-between bg-primary-soft p-12 lg:flex lg:min-h-screen">
        <BrandMark />
        <p className="max-w-sm font-serif text-5xl leading-[1.05] text-foreground">
          Um edital, <span className="italic">uma chance.</span>
        </p>
        <p className="text-sm text-muted-foreground">Inscrição, acompanhamento e resultado em um só lugar.</p>
      </div>

            {/* Seção do Formulário */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-background">

                <div className="relative z-10 w-full max-w-md">
                    {isSuccess ? (
                        // Tela de sucesso após registro
                        <div className="auth-card bg-card rounded-3xl p-8 border">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-bold text-foreground mb-2">
                                    Cadastro realizado!
                                </h2>
                                <p className="text-muted-foreground mb-4">
                                    Enviamos um email de verificação para:
                                </p>
                                <p className="text-xl font-semibold text-foreground mb-6">{registeredEmail}</p>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
                                    <h3 className="text-foreground font-semibold mb-2 flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Instruções importantes
                                    </h3>
                                    <ul className="text-muted-foreground text-sm space-y-2">
                                        <li className="flex items-start">
                                            <span className="mr-2">•</span>
                                            Verifique sua caixa de entrada e spam
                                        </li>
                                        <li className="flex items-start">
                                            <span className="mr-2">•</span>
                                            Clique no link de confirmação no email
                                        </li>
                                        <li className="flex items-start">
                                            <span className="mr-2">•</span>
                                            O link expira em 24 horas
                                        </li>
                                        <li className="flex items-start">
                                            <span className="mr-2">•</span>
                                            Após confirmar, você poderá fazer login
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={handleResendVerification}
                                        disabled={isLoading}
                                        className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Reenviando...
                                            </>
                                        ) : (
                                            'Reenviar email de verificação'
                                        )}
                                    </button>

                                    <Link
                                        href="/auth/login-candidato"
                                        className="block w-full bg-transparent border border-input hover:bg-background text-foreground font-bold py-3 px-6 rounded-2xl transition-all duration-300 text-center"
                                    >
                                        Ir para login
                                    </Link>

                                    <button
                                        onClick={() => {
                                            setIsSuccess(false);
                                            setRegisteredEmail('');
                                        }}
                                        className="block w-full text-muted-foreground hover:text-foreground text-sm font-medium transition-colors duration-300 text-center"
                                    >
                                        Cadastrar outra conta
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Formulário de registro
                        <div className="auth-card bg-card rounded-3xl p-8 border">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-foreground mb-2">
                                    Criar Conta
                                </h2>
                                <p className="text-muted-foreground text-sm">
                                    Preencha seus dados para se cadastrar
                                </p>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-destructive/20 border border-destructive/50 rounded-2xl text-destructive text-sm">
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {error}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-foreground text-sm font-medium mb-2">
                                        Nome Completo
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-background border border-input rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300 disabled:opacity-50"
                                        placeholder="Seu nome completo"
                                        required
                                        disabled={isLoading}
                                        minLength={2}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-foreground text-sm font-medium mb-2">
                                        E-mail
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-background border border-input rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300 disabled:opacity-50"
                                        placeholder="seu@email.com"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-foreground text-sm font-medium mb-2">
                                        Senha
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-background border border-input rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300 disabled:opacity-50"
                                        placeholder="Mínimo 6 caracteres"
                                        minLength={6}
                                        required
                                        disabled={isLoading}
                                    />
                                    <p className="text-muted-foreground text-xs mt-1">
                                        A senha deve ter pelo menos 6 caracteres
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="password_confirm" className="block text-foreground text-sm font-medium mb-2">
                                        Confirmar Senha
                                    </label>
                                    <input
                                        type="password"
                                        id="password_confirm"
                                        name="password_confirm"
                                        value={formData.password_confirm}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-background border border-input rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300 disabled:opacity-50"
                                        placeholder="Digite novamente sua senha"
                                        required
                                        disabled={isLoading}
                                    />
                                    <p className="text-muted-foreground text-xs mt-1">
                                        A senha deve coincidir com a anterior
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-none disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Criando conta...
                                        </>
                                    ) : (
                                        'Criar Conta'
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-muted-foreground text-sm">
                                    Já tem uma conta?{' '}
                                    <Link
                                        href="/auth/login-candidato"
                                        className="text-primary hover:text-primary font-medium transition-colors duration-300 hover:underline"
                                    >
                                        Fazer login
                                    </Link>
                                </p>
                            </div>

                            {/* Termos e condições */}
                            <div className="mt-4 text-center">
                                <p className="text-muted-foreground text-xs">
                                    Ao se cadastrar, você concorda com nossas{' '}
                                    <Link href={linkPoliticaPrivacidade} className="text-primary hover:underline">
                                        Política de Privacidade
                                    </Link>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}