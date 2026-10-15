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
                <label className="block text-sm font-medium text-gray-700">
                    CEP <span className="text-[#005f73] text-xs">(Busca automática)</span>
                </label>
                {addressFetched && (
                    <motion.span
                        className="text-xs text-[#0a9396] flex items-center gap-1"
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
                            ? 'border-red-300 focus:ring-red-500 bg-red-50'
                            : addressFetched
                              ? 'border-[#0a9396] focus:ring-[#0a9396] bg-[#e6f7f9]'
                              : 'border-gray-300 focus:ring-[#0a9396] hover:border-gray-400'
                    }`}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    {loading ? (
                        <Loader2 className="w-4 h-4 text-[#005f73] animate-spin" />
                    ) : (
                        <MapPin className="w-4 h-4 text-gray-400" />
                    )}
                </div>
                <motion.button
                    type="button"
                    onClick={onSearch}
                    disabled={isDisabled}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#005f73] to-[#0a9396] text-white text-sm rounded-md hover:from-[#006d84] hover:to-[#0ba5a8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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
                    className="text-sm text-red-600 flex items-center gap-1 mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <AlertCircle className="w-4 h-4" /> {error}
                </motion.p>
            )}
            <p className="text-xs text-gray-500 mt-1">
                Digite o CEP para preencher automaticamente o endereço
            </p>
        </motion.div>
    );
};

