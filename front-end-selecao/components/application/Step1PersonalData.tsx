'use client';

import { UNIVERSITIES } from '@/config/ConselhoConfig';
import { SEMESTER_OPTIONS, TURNO_OPTIONS, UF_OPTIONS } from '@/constants/applicationForm';
import { ApplicationFormData } from '@/utils/applicationValidation';
import { motion } from 'framer-motion';
import { CheckCircle, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CepInput } from './CepInput';
import { InputField, SelectField } from './FormFields';
import { cardVariants, stepVariants } from './animations';

interface University {
    name: string;
    acronym?: string;
    city: string;
    state: string;
    type: 'public' | 'private';
}

interface Step1PersonalDataProps {
    formData: ApplicationFormData;
    formErrors: Record<string, string>;
    candidateEmail?: string;
    addressFetched: boolean;
    cepLoading: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onCepSearch: () => void;
    onUniversitySelect?: (universityName: string) => void;
}

type UniversityInputProps = {
  value: string;
  error?: string;
  filteredUniversities: University[];
  showUniversitySuggestions: boolean;
  isLoadingUniversities: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSelect: (university: University) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  suggestionsRef: React.RefObject<HTMLDivElement | null>;
};

const UniversityInput = ({
  value,
  error,
  filteredUniversities,
  showUniversitySuggestions,
  isLoadingUniversities,
  onChange,
  onFocus,
  onBlur,
  onSelect,
  inputRef,
  suggestionsRef,
}: UniversityInputProps) => {
  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name="college"
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Digite o nome da sua faculdade ou universidade"
          autoComplete="off"
          required
          className={[
            "w-full",
            "px-4 py-2.5", // padding base
            "pr-10",       // espaço para o ícone à direita
            "border rounded-lg bg-white",
            error ? "border-red-300" : "border-gray-300",
            "focus:ring-2 focus:ring-[#005f73] focus:border-transparent",
            "transition-colors",
          ].join(" ")}
        />

        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {showUniversitySuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoadingUniversities ? (
            <div className="p-3 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#005f73] mx-auto" />
              <p className="text-xs mt-1">Buscando universidades...</p>
            </div>
          ) : filteredUniversities.length > 0 ? (
            filteredUniversities.map((university, index) => (
              <button
                key={`${university.name}-${index}`}
                type="button"
                // ✅ onMouseDown seleciona antes do blur do input acontecer
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(university);
                }}
                className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors cursor-pointer"
              >
                <div className="font-medium text-sm text-gray-800">{university.name}</div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-600">
                    {university.city} - {university.state}
                  </span>
                  <span
                    className={[
                      "text-xs px-2 py-1 rounded-full",
                      university.type === "public"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800",
                    ].join(" ")}
                  >
                    {university.type === "public" ? "Pública" : "Privada"}
                  </span>
                </div>
                {university.acronym && (
                  <div className="text-xs text-gray-500 mt-1">{university.acronym}</div>
                )}
              </button>
            ))
          ) : value.length >= 2 ? (
            <div className="p-3 text-center text-gray-500">
              <p className="text-sm">Nenhuma universidade encontrada</p>
              <p className="text-xs mt-1">Digite o nome completo da instituição</p>
              <p className="text-xs mt-2 text-[#005f73]">Sugestão: Busque por "UFG", "PUC Goiás", "UNIP", etc.</p>
            </div>
          ) : null}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-1">Comece a digitar para ver sugestões de universidades</p>
    </div>
  );
};



export const Step1PersonalData = ({
    formData,
    formErrors,
    candidateEmail,
    addressFetched,
    cepLoading, 
    onInputChange,
    onCepSearch,
    onUniversitySelect,
}: Step1PersonalDataProps) => {
    const [showUniversitySuggestions, setShowUniversitySuggestions] = useState(false);
    const [filteredUniversities, setFilteredUniversities] = useState<University[]>([]);
    const [isLoadingUniversities, setIsLoadingUniversities] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const universityInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Filter universities based on search term
    useEffect(() => {
        if (formData.college.length < 2) {
            setFilteredUniversities([]);
            setShowUniversitySuggestions(false);
            return;
        }

        // Só busca se o input estiver focado
        if (!isInputFocused) return;

        setIsLoadingUniversities(true);

        const timeoutId = setTimeout(() => {
            const searchTerm = formData.college.toLowerCase();

            const filtered = UNIVERSITIES.filter(
                (university) =>
                    university.name.toLowerCase().includes(searchTerm) ||
                    university.acronym?.toLowerCase().includes(searchTerm) ||
                    university.city.toLowerCase().includes(searchTerm)
            ).slice(0, 10);

            const sorted = filtered.sort((a, b) => {
                if (a.type === 'public' && b.type === 'private') return -1;
                if (a.type === 'private' && b.type === 'public') return 1;
                return a.name.localeCompare(b.name);
            });

            setFilteredUniversities(sorted);
            setIsLoadingUniversities(false);

            if (isInputFocused && sorted.length > 0) setShowUniversitySuggestions(true);
            else setShowUniversitySuggestions(false);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [formData.college, isInputFocused]);

    // Handle click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                universityInputRef.current &&
                !universityInputRef.current.contains(event.target as Node) &&
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node)
            ) {
                setShowUniversitySuggestions(false);
                setIsInputFocused(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Tecla Escape para fechar o dropdown
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && showUniversitySuggestions) {
                setShowUniversitySuggestions(false);
                universityInputRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [showUniversitySuggestions]);

    const handleInputFocus = () => {
        setIsInputFocused(true);
        if (formData.college.length >= 2 && filteredUniversities.length > 0) {
            setShowUniversitySuggestions(true);
        }
    };

    const handleInputBlur = () => {
        // Delay para permitir clique nas sugestões (o onMouseDown já ajuda, mas mantemos)
        setTimeout(() => {
            setIsInputFocused(false);
        }, 200);
    };

    const handleCollegeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onInputChange(e);

        if (!isInputFocused) {
            setShowUniversitySuggestions(false);
            return;
        }

        if (e.target.value.length < 2) {
            setShowUniversitySuggestions(false);
        }
    };

    const handleUniversitySelect = (university: University) => {
  const event = {
    target: { name: 'college', value: university.name },
  } as React.ChangeEvent<HTMLInputElement>;

  onInputChange(event);

  setShowUniversitySuggestions(false);
  setIsInputFocused(false);

  // ✅ não reativa isInputFocused e não abre dropdown de novo
  requestAnimationFrame(() => {
    universityInputRef.current?.focus({ preventScroll: true });
  });

  onUniversitySelect?.(university.name);
};


    return (
        <motion.div
            className="space-y-6"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            key="step-1"
        >
            <motion.div
                className="bg-[#e6f7f9] border border-[#0a9396] rounded-xl p-5 mb-6"
                variants={cardVariants}
            >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#005f73]" />
                    Dados Pessoais
                </h3>
                <p className="text-sm text-gray-600">Complete suas informações pessoais para prosseguir com a candidatura.</p>
            </motion.div>

            {/* Informações Básicas */}
            <motion.div className="space-y-6" variants={cardVariants}>
                <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Informações Básicas</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                        label="Nome Completo"
                        name="name"
                        value={formData.name}
                        onChange={onInputChange}
                        placeholder="Seu nome completo"
                        error={formErrors.name}
                        required
                    />

                    <motion.div className="space-y-1" variants={cardVariants}>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 flex items-center">
                            <span className="flex-1">{candidateEmail}</span>
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded ml-2">Fixo</span>
                        </div>
                        <p className="text-xs text-gray-500">O email não pode ser alterado</p>
                    </motion.div>

                    <InputField
                        label="CPF"
                        name="cpf"
                        value={formData.cpf}
                        onChange={onInputChange}
                        placeholder="000.000.000-00"
                        error={formErrors.cpf}
                        required
                    />

                    <InputField
                        label="Telefone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={onInputChange}
                        placeholder="(62) 99999-9999"
                        error={formErrors.phone}
                        required
                    />
                </div>
            </motion.div>

            {/* Informações Acadêmicas */}
            <motion.div className="space-y-6" variants={cardVariants}>
                <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Informações Acadêmicas</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Instituição de Ensino *</label>

                        <UniversityInput
                            value={formData.college}
                            error={formErrors.college}
                            filteredUniversities={filteredUniversities}
                            showUniversitySuggestions={showUniversitySuggestions}
                            isLoadingUniversities={isLoadingUniversities}
                            onChange={handleCollegeChange}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            onSelect={handleUniversitySelect}
                            inputRef={universityInputRef}
                            suggestionsRef={suggestionsRef}
                        />
                    </div>

                    <SelectField
                        label="Turno"
                        name="period"
                        value={formData.period}
                        onChange={onInputChange}
                        options={TURNO_OPTIONS}
                        error={formErrors.period}
                        required
                    />

                    <SelectField
                        label="Período Acadêmico"
                        name="semester"
                        value={formData.semester}
                        onChange={onInputChange}
                        options={SEMESTER_OPTIONS}
                        error={formErrors.semester}
                        required
                    />
                </div>
            </motion.div>

            {/* Endereço */}
            <motion.div className="space-y-6" variants={cardVariants}>
                <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Endereço</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <CepInput
                        value={formData.cep}
                        onChange={onInputChange}
                        onSearch={onCepSearch}
                        error={formErrors.cep}
                        loading={cepLoading}
                        addressFetched={addressFetched}
                    />

                    <div className="md:col-span-2">
                        <InputField
                            label="Endereço"
                            name="address"
                            value={formData.address}
                            onChange={onInputChange}
                            placeholder="Rua, número, bairro"
                            error={formErrors.address}
                            required
                        />
                    </div>

                    <InputField
                        label="Complemento"
                        name="complement"
                        value={formData.complement}
                        onChange={onInputChange}
                        placeholder="Complemento"
                        error={formErrors.complement}
                        required
                    />

                    <InputField
                        label="Bairro"
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={onInputChange}
                        placeholder="Bairro"
                        error={formErrors.neighborhood}
                        required
                    />

                    <InputField
                        label="Cidade"
                        name="city"
                        value={formData.city}
                        onChange={onInputChange}
                        placeholder="Cidade"
                        error={formErrors.city}
                        required
                    />

                    <SelectField
                        label="UF"
                        name="uf"
                        value={formData.uf}
                        onChange={onInputChange}
                        options={UF_OPTIONS}
                        error={formErrors.uf}
                        required
                    />
                </div>
            </motion.div>
        </motion.div>
    );
};
