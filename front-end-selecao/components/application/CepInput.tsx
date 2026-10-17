'use client';

import { AlertCircle, CheckCircle, Loader2, MapPin, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { cardVariants } from './animations';

interface CepInputProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSearch: () => void;
    error?: string;
    loading: boolean;
    addressFetched: boolean;
}

export const CepInput = ({
    value,
    onChange,
    onSearch,
    error,
    loading,
    addressFetched,
}: CepInputProps) => {
    const cleanCEP = value.replace(/\D/g, '');
    const isDisabled = loading || cleanCEP.length < 8;

    return (
        <motion.div className="md:col-span-2 space-y-1" variants={cardVariants}>
            <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-foreground/80">
                    CEP <span className="text-primary text-xs">(Busca automática)</span>
                </label>
                {addressFetched && (
                    <motion.span
                        className="text-xs text-primary-hover flex items-center gap-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <CheckCircle className="w-3 h-3" /> Endereço encontrado
                    </motion.span>
                )}
            </div>
            <div className="relative">
                <input
                    type="text"
                    name="cep"
                    value={value}
                    onChange={onChange}
                    placeholder="00000-000"
                    className={`w-full px-4 py-2.5 pl-10 pr-32 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent ${
                        error
                            ? 'border-destructive/30 focus:ring-destructive bg-destructive-soft'
                            : addressFetched
                              ? 'border-primary-hover focus:ring-primary-hover bg-primary-soft'
                              : 'border-input focus:ring-primary-hover hover:border-input'
                    }`}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    {loading ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    ) : (
                        <MapPin className="w-4 h-4 text-muted-foreground/70" />
                    )}
                </div>
                <motion.button
                    type="button"
                    onClick={onSearch}
                    disabled={isDisabled}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Buscando...
                        </>
                    ) : (
                        <>
                            <Search className="w-3 h-3" />
                            Buscar CEP
                        </>
                    )}
                </motion.button>
            </div>
            {error && (
                <motion.p
                    className="text-sm text-destructive flex items-center gap-1 mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <AlertCircle className="w-4 h-4" /> {error}
                </motion.p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
                Digite o CEP para preencher automaticamente o endereço
            </p>
        </motion.div>
    );
};

