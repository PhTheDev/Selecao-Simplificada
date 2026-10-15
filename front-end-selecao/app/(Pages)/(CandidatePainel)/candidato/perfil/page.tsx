"use client";

import { University } from "@/api/types/university";
import Footer from "@/components/Footer";
import { Title } from "@/components/ui/Title";
import { UNIVERSITIES } from "@/config/ConselhoConfig";
import { SEMESTER_OPTIONS } from "@/constants/applicationForm";
import { motion } from "framer-motion";
import {
  Building2,
  Camera,
  GraduationCap,
  Hash,
  Home,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Save,
  Search,
  User,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * =========================================================
 * Tipos
 * =========================================================
 */
interface CandidateData {
  id: number;
  name: string;
  email: string;
  cpf: string | null;
  gender: string | null;
  phone: string | null;
  college: string | null;
  period: string | null;
  semester: string | null;
  cep: string | null;
  address: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  uf: string | null;
  profile_image: string | null;
  profile_image_url: string | null;
  is_active: boolean;
  created_at: string;
}

type ProfileForm = {
  name: string;
  cpf: string;
  gender: string;
  phone: string;
  college: string;
  period: string;
  semester: string;
  cep: string;
  address: string;
  complement: string;
  neighborhood: string;
  city: string;
  uf: string;
};

/**
 * =========================================================
 * Config
 * =========================================================
 */
const PERIOD_OPTIONS = [
  { value: "M", label: "Matutino" },
  { value: "T", label: "Vespertino" },
  { value: "N", label: "Noturno" },
  { value: "I", label: "Integral" },
];

const UF_OPTIONS = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

/**
 * =========================================================
 * Cookie utils
 * =========================================================
 */
const CookieManager = {
  getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
  },

  setCookie(name: string, value: string, maxAgeSeconds = 3600) {
    const secure = process.env.NODE_ENV === "production" ? "; secure" : "";
    document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; samesite=lax${secure}`;
  },

  getAuthUser(): { id: number; name: string; email: string; profile_image_url: string | null } | null {
    const authUser = this.getCookie("auth_user");
    if (!authUser) return null;
    try {
      const decoded = decodeURIComponent(authUser);
      const cleanJson = decoded.replace(/^"|"$/g, "").replace(/\\"/g, '"');
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error("Erro ao parsear auth_user:", error);
      return null;
    }
  },
};

/**
 * =========================================================
 * fetch helper (JSON ou FormData)
 * =========================================================
 */
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const accessToken = CookieManager.getCookie("access-token");
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!isFormData) headers["Content-Type"] = "application/json";
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  return fetch(url, { ...options, headers });
};

/**
 * =========================================================
 * Formatters / helpers
 * =========================================================
 */
const onlyDigits = (value: string) => (value || "").replace(/\D/g, "");

const formatCPF = (value: string) => {
  const cleaned = onlyDigits(value);
  if (cleaned.length <= 11) {
    return cleaned
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return cleaned.substring(0, 14);
};

const formatPhone = (value: string) => {
  const cleaned = onlyDigits(value);
  if (cleaned.length <= 11) {
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
    }
    return cleaned.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
  }
  return cleaned.substring(0, 15);
};

const formatCEP = (value: string) => {
  const cleaned = onlyDigits(value);
  if (cleaned.length <= 8) return cleaned.replace(/(\d{5})(\d)/, "$1-$2");
  return cleaned.substring(0, 9);
};

const toNullable = (v: string) => {
  const s = (v ?? "").trim();
  return s.length ? s : null;
};

const cleanPayload = (data: ProfileForm) => ({
  name: data.name, // normalmente obrigatório
  cpf: toNullable(onlyDigits(data.cpf || "")),
  gender: toNullable(data.gender),     // backend: "M"|"F"|"O"|"I" (I = não informado)
  phone: toNullable(onlyDigits(data.phone || "")),
  college: toNullable(data.college),
  period: toNullable(data.period),
  semester: toNullable(data.semester), // ex: "1".."10"
  cep: toNullable(onlyDigits(data.cep || "")),
  address: toNullable(data.address),
  complement: toNullable(data.complement),
  neighborhood: toNullable(data.neighborhood),
  city: toNullable(data.city),
  uf: toNullable(data.uf),
});

/**
 * =========================================================
 * UI Helpers: input with icon
 * =========================================================
 */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700 mb-2">{children}</label>;
}

function InputWithIcon(props: {
  icon: React.ReactNode;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  rightNode?: React.ReactNode;
}) {
  const { icon, inputProps, rightNode } = props;

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>

      <input
        {...inputProps}
        className={[
          "w-full",
          "pl-10 pr-10",                 // espaço para ícone esquerdo e nó direito
          "py-2.5 sm:py-3",
          "border border-gray-300 rounded-lg",
          "bg-white",
          "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "transition-all",
          "text-sm sm:text-base",
          "shadow-sm",
          "placeholder:text-gray-400",
          inputProps.className || "",
        ].join(" ")}
      />

      {rightNode ? (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightNode}</div>
      ) : null}
    </div>
  );
}


function SelectWithIcon(props: {
  icon: React.ReactNode;
  selectProps: React.SelectHTMLAttributes<HTMLSelectElement>;
  children: React.ReactNode;
}) {
  const { icon, selectProps, children } = props;

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>

      <select
        {...selectProps}
        className={[
          "w-full",
          "pl-10 pr-4",
          "py-2.5 sm:py-3",
          "border border-gray-300 rounded-lg",
          "bg-white",
          "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "transition-all",
          "text-sm sm:text-base",
          "shadow-sm",
          selectProps.className || "",
        ].join(" ")}
      >
        {children}
      </select>
    </div>
  );
}


/**
 * =========================================================
 * Hook: University Search (local list with debounce)
 * =========================================================
 */
const useUniversitySearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(() => {
      const filtered = UNIVERSITIES.filter((u) => {
        const term = searchTerm.toLowerCase();
        return (
          u.name.toLowerCase().includes(term) ||
          (u.acronym?.toLowerCase().includes(term) ?? false) ||
          u.city.toLowerCase().includes(term)
        );
      }).slice(0, 10);

      setSuggestions(filtered);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return { searchTerm, setSearchTerm, suggestions, isLoading };
};

/**
 * =========================================================
 * Page
 * =========================================================
 */
export default function PerfilPage() {
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [cepLoading, setCepLoading] = useState(false);
  const lastCepSearched = useRef<string>("");

  const [formData, setFormData] = useState<ProfileForm>({
    name: "",
    cpf: "",
    gender: "",
    phone: "",
    college: "",
    period: "",
    semester: "",
    cep: "",
    address: "",
    complement: "",
    neighborhood: "",
    city: "",
    uf: "",
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [showUniversitySuggestions, setShowUniversitySuggestions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const universityInputRef = useRef<HTMLInputElement>(null);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);

  const { searchTerm, setSearchTerm, suggestions, isLoading: universityLoading } = useUniversitySearch();

  const apiBase = process.env.NEXT_PUBLIC_DJANGO_API_URL;

  const isFormLoading = isLoading || isUpdating || isUploading;

  /**
   * ---------------------------------------------------------
   * Fetch profile
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const fetchCandidateData = async () => {
      try {
        setIsLoading(true);

        const response = await fetchWithAuth(`${apiBase}/api/selection/candidates/me/`);

        if (!response.ok) {
          console.error("Erro ao buscar dados do candidato:", response.status);
          toast.error("Erro ao carregar dados do perfil");
          return;
        }

        const candidateData: CandidateData = await response.json();
        setCandidate(candidateData);

        setFormData({
          name: candidateData.name || "",
          cpf: candidateData.cpf ? formatCPF(candidateData.cpf) : "",
          gender: candidateData.gender || "",
          phone: candidateData.phone ? formatPhone(candidateData.phone) : "",
          college: candidateData.college || "",
          period: candidateData.period || "",
          semester: candidateData.semester || "",
          cep: candidateData.cep ? formatCEP(candidateData.cep) : "",
          address: candidateData.address || "",
          complement: candidateData.complement || "",
          neighborhood: candidateData.neighborhood || "",
          city: candidateData.city || "",
          uf: candidateData.uf || "",
        });

        setSearchTerm(candidateData.college || "");

        const userData = {
          id: candidateData.id,
          name: candidateData.name,
          email: candidateData.email,
          profile_image_url: candidateData.profile_image_url,
        };
        CookieManager.setCookie("auth_user", encodeURIComponent(JSON.stringify(userData)));

        const url = candidateData.profile_image_url || candidateData.profile_image || null;
        if (url) setProfileImage(url);
      } catch (error) {
        console.error("Erro na requisição do candidato:", error);
        toast.error("Erro ao carregar dados do perfil");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidateData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * ---------------------------------------------------------
   * Close suggestions on outside click
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      const clickedInput = universityInputRef.current?.contains(target);
      const clickedBox = suggestionBoxRef.current?.contains(target);

      if (!clickedInput && !clickedBox) {
        setShowUniversitySuggestions(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  /**
   * ---------------------------------------------------------
   * ViaCEP
   * - preenche: address (logradouro), neighborhood (bairro), city, uf, cep
   * - NÃO mexe em complement (é do usuário)
   * ---------------------------------------------------------
   */
  const handleCepSearch = async (cep: string) => {
    const cleanedCep = onlyDigits(cep || "");
    if (cleanedCep.length !== 8) return;

    try {
      setCepLoading(true);
      toast.info("Buscando CEP...");

      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (data?.erro) {
        toast.error("CEP não encontrado.");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        cep: formatCEP(data.cep || cleanedCep),
        address: data.logradouro || prev.address || "",
        neighborhood: data.bairro || prev.neighborhood || "", // ✅ agora preenche bairro
        city: data.localidade || prev.city || "",
        uf: data.uf || prev.uf || "",
        // complement: prev.complement (não altera)
      }));

      toast.success("CEP encontrado! Revise e complete o complemento (número/apto).");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast.error("Erro ao buscar CEP. Tente novamente.");
    } finally {
      setCepLoading(false);
    }
  };

  /**
   * ---------------------------------------------------------
   * Handlers: University
   * ---------------------------------------------------------
   */
  const handleUniversitySelect = (university: University) => {
    setFormData((prev) => ({ ...prev, college: university.name }));
    setSearchTerm(university.name);
    setShowUniversitySuggestions(false);
  };

  const handleCollegeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, college: value }));
    setSearchTerm(value);
    setShowUniversitySuggestions(value.length > 0);
  };

  /**
   * ---------------------------------------------------------
   * Generic change
   * ---------------------------------------------------------
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "college") {
      handleCollegeChange(e as React.ChangeEvent<HTMLInputElement>);
      return;
    }

    let formattedValue = value;
    if (name === "cpf") formattedValue = formatCPF(value);
    if (name === "phone") formattedValue = formatPhone(value);
    if (name === "cep") formattedValue = formatCEP(value);

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));

    if (name === "cep") {
      const cleaned = onlyDigits(formattedValue);
      if (cleaned.length === 8 && cleaned !== lastCepSearched.current) {
        lastCepSearched.current = cleaned;
        handleCepSearch(formattedValue);
      }
    }
  };

  /**
   * ---------------------------------------------------------
   * Profile image
   * ---------------------------------------------------------
   */
  const triggerFileInput = () => fileInputRef.current?.click();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida (JPG, PNG, GIF).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    setProfileImageFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const tempUrl = ev.target?.result as string;
      setProfileImage(tempUrl);
    };
    reader.readAsDataURL(file);

    toast.success("Imagem selecionada! Clique em 'Salvar Alterações' para enviar.");
  };

  /**
   * ---------------------------------------------------------
   * Submit
   * ---------------------------------------------------------
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!candidate?.id) {
      toast.error("Não foi possível identificar o candidato.");
      return;
    }

    try {
      setIsUpdating(true);

      const payload = cleanPayload(formData);
      let response: Response;

      if (profileImageFile) {
        setIsUploading(true);

        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => fd.append(k, v ?? ""));
        fd.append("profile_image", profileImageFile);

        response = await fetchWithAuth(`${apiBase}/api/selection/candidates/${candidate.id}/`, {
          method: "PATCH",
          body: fd,
        });
      } else {
        response = await fetchWithAuth(`${apiBase}/api/selection/candidates/${candidate.id}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        let errorMessage = "Erro ao atualizar perfil";
        try {
          const err = await response.json();
          errorMessage = err?.detail || JSON.stringify(err);
        } catch {
          const text = await response.text();
          if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      const updatedCandidate: CandidateData = await response.json();
      setCandidate(updatedCandidate);
      setProfileImageFile(null);

      const url = updatedCandidate.profile_image_url || updatedCandidate.profile_image || null;
      setProfileImage(url ? `${url}?v=${Date.now()}` : null);

      const userData = {
        id: updatedCandidate.id,
        name: updatedCandidate.name,
        email: updatedCandidate.email,
        profile_image_url: updatedCandidate.profile_image_url,
      };
      CookieManager.setCookie("auth_user", encodeURIComponent(JSON.stringify(userData)));

      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar perfil. Tente novamente.");
    } finally {
      setIsUpdating(false);
      setIsUploading(false);
    }
  };

  /**
   * ---------------------------------------------------------
   * Derived values
   * ---------------------------------------------------------
   */
  const profileInitial = useMemo(() => candidate?.name?.charAt(0)?.toUpperCase() || "U", [candidate?.name]);

  /**
   * ---------------------------------------------------------
   * Loading skeleton
   * ---------------------------------------------------------
   */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-100">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  /**
   * =========================================================
   * UI
   * =========================================================
   */
  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Title title="Meu Perfil" icon={User} />
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Coluna principal */}
            <div className="xl:col-span-2 space-y-4 sm:space-y-6">
              {/* Dados pessoais */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
              >
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Dados Pessoais</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="sm:col-span-2">
                    <FieldLabel>Nome Completo *</FieldLabel>
                    <InputWithIcon
                      icon={<User className="w-4 h-4" />}
                      inputProps={{
                        type: "text",
                        name: "name",
                        value: formData.name,
                        onChange: handleChange,
                        required: true,
                        placeholder: "Digite seu nome completo",
                      }}
                    />
                  </div>

                  <div>
                    <FieldLabel>CPF</FieldLabel>
                    <InputWithIcon
                      icon={<Hash className="w-4 h-4" />}
                      inputProps={{
                        type: "text",
                        name: "cpf",
                        value: formData.cpf,
                        onChange: handleChange,
                        placeholder: "000.000.000-00",
                        maxLength: 14,
                      }}
                    />
                  </div>

                  <div>
                    <FieldLabel>Gênero</FieldLabel>
                    <SelectWithIcon
                      icon={<User className="w-4 h-4" />}
                      selectProps={{
                        name: "gender",
                        value: formData.gender,
                        onChange: handleChange,
                      }}
                    >
                      <option value="">Selecione...</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                      <option value="O">Outro</option>
                    </SelectWithIcon>
                  </div>

                  <div className="sm:col-span-2">
                    <FieldLabel>Telefone</FieldLabel>
                    <InputWithIcon
                      icon={<Phone className="w-4 h-4" />}
                      inputProps={{
                        type: "tel",
                        name: "phone",
                        value: formData.phone,
                        onChange: handleChange,
                        placeholder: "(00) 00000-0000",
                        maxLength: 15,
                      }}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <FieldLabel>E-mail</FieldLabel>
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 shadow-sm">
                      <Mail className="w-4 h-4" />
                      <span className="break-all text-sm sm:text-base">{candidate?.email}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">O e-mail não pode ser alterado.</p>
                  </div>
                </div>
              </motion.div>

              {/* Dados acadêmicos */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
              >
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Dados Acadêmicos</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="sm:col-span-2 relative">
                    <FieldLabel>Instituição de Ensino</FieldLabel>

                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Building2 className="w-4 h-4" />
                      </div>

                      <input
                        ref={universityInputRef}
                        type="text"
                        name="college"
                        value={formData.college}
                        onChange={handleCollegeChange}
                        onFocus={() => setShowUniversitySuggestions(true)}
                        placeholder="Digite o nome da sua faculdade ou universidade"
                        className={[
                            "w-full",
                            "pl-11 pr-10",              // espaço pros ícones
                            "py-2.5 sm:py-3",
                            "border border-gray-300 rounded-lg",
                            "bg-white",
                            "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                            "transition-all text-sm sm:text-base shadow-sm",
                        ].join(" ")}
                        />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {universityLoading ? (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Search className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-1">
                      Caso não encontre a sua instituição na listagem, preencha manualmente.
                    </p>

                    {showUniversitySuggestions && (
                      <div
                        ref={suggestionBoxRef}
                        className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto"
                      >
                        {suggestions.length > 0 ? (
                          suggestions.map((university, index) => (
                            <button
                              key={`${university.name}-${index}`}
                              type="button"
                              onClick={() => handleUniversitySelect(university)}
                              className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              <div className="font-medium text-sm text-gray-900">{university.name}</div>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-600">
                                  {university.city} - {university.state}
                                </span>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    university.type === "public"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {university.type === "public" ? "Pública" : "Privada"}
                                </span>
                              </div>
                              {university.acronym && (
                                <div className="text-xs text-gray-500 mt-1">{university.acronym}</div>
                              )}
                            </button>
                          ))
                        ) : searchTerm.trim().length > 0 ? (
                          <div className="p-3 text-center text-gray-500">
                            <p className="text-sm">Nenhuma universidade encontrada</p>
                            <p className="text-xs mt-1">Digite o nome completo da instituição</p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  

                  <div>
                    <FieldLabel>Turno</FieldLabel>
                    <SelectWithIcon
                      icon={<Landmark className="w-4 h-4" />}
                      selectProps={{
                        name: "period",
                        value: formData.period,
                        onChange: handleChange,
                      }}
                    >
                      <option value="">Selecione...</option>
                      {PERIOD_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </SelectWithIcon>
                  </div>

                  <div>
                    <FieldLabel>Período Acadêmico</FieldLabel>
                    <SelectWithIcon
                      icon={<GraduationCap className="w-4 h-4" />}
                      selectProps={{
                        name: "semester",
                        value: formData.semester,
                        onChange: handleChange,
                      }}
                    >
                      <option value="">Selecione...</option>
                      {SEMESTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectWithIcon>
                  </div>
                </div>
              </motion.div>

              {/* Endereço */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
              >
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Endereço</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="sm:col-span-2">
                    <FieldLabel>CEP</FieldLabel>
                    <InputWithIcon
                      icon={<MapPin className="w-4 h-4" />}
                      inputProps={{
                        type: "text",
                        name: "cep",
                        value: formData.cep,
                        onChange: handleChange,
                        placeholder: "00000-000",
                        maxLength: 9,
                      }}
                      rightNode={
                        cepLoading ? (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="text-xs text-gray-400">ViaCEP</span>
                        )
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ao completar 8 dígitos, o sistema busca automaticamente no ViaCEP.
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <FieldLabel>Endereço (Logradouro)</FieldLabel>
                    <InputWithIcon
                      icon={<Home className="w-4 h-4" />}
                      inputProps={{
                        type: "text",
                        name: "address",
                        value: formData.address,
                        onChange: handleChange,
                        placeholder: "Rua / Avenida",
                      }}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <FieldLabel>Complemento</FieldLabel>
                    <InputWithIcon
                      icon={<Hash className="w-4 h-4" />}
                      inputProps={{
                        type: "text",
                        name: "complement",
                        value: formData.complement,
                        onChange: handleChange,
                        placeholder: "Número, apto, bloco, etc.",
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Preencha com número/apto/bloco.</p>
                  </div>

                  <div className="sm:col-span-2">
                    <FieldLabel>Bairro</FieldLabel>
                    <InputWithIcon
                      icon={<MapPin className="w-4 h-4" />}
                      inputProps={{
                        type: "text",
                        name: "neighborhood",
                        value: formData.neighborhood,
                        onChange: handleChange,
                        placeholder: "Bairro",
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Preenchido automaticamente pelo ViaCEP (quando disponível).</p>
                  </div>

                  <div>
                    <FieldLabel>Cidade</FieldLabel>
                    <InputWithIcon
                      icon={<MapPin className="w-4 h-4" />}
                      inputProps={{
                        type: "text",
                        name: "city",
                        value: formData.city,
                        onChange: handleChange,
                        placeholder: "Cidade",
                      }}
                    />
                  </div>

                  <div>
                    <FieldLabel>UF</FieldLabel>
                    <SelectWithIcon
                      icon={<MapPin className="w-4 h-4" />}
                      selectProps={{
                        name: "uf",
                        value: formData.uf,
                        onChange: handleChange,
                      }}
                    >
                      <option value="">Selecione...</option>
                      {UF_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </SelectWithIcon>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              {/* Foto perfil */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
              >
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-md">
                      {profileImage ? (
                        <img src={profileImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : candidate?.profile_image ? (
                        <img src={candidate.profile_image} alt="Perfil" className="w-full h-full object-cover" />
                      ) : (
                        profileInitial
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={triggerFileInput}
                      disabled={isUploading}
                      className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    >
                      <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>

                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  </div>

                  <h3 className="font-semibold text-gray-800 text-base sm:text-lg mb-1 break-words">
                    {candidate?.name || "Usuário"}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 break-all">{candidate?.email}</p>

                  <div className="space-y-2 sm:space-y-3 text-left">
                    <div
                      className={`flex items-center gap-2 text-xs sm:text-sm ${
                        candidate?.is_active ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${candidate?.is_active ? "bg-green-500" : "bg-red-500"}`} />
                      <span>{candidate?.is_active ? "Conta ativa" : "Conta inativa"}</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 text-center">
                      Formatos: JPG, PNG, GIF
                      <br />
                      Máx.: 5MB
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Botão salvar */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
              >
                <button
                  type="submit"
                  disabled={isFormLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base shadow-sm"
                >
                  {isFormLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isUploading ? "Enviando imagem..." : "Salvando..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 mt-3 text-center">* Campos obrigatórios</p>
              </motion.div>

              {/* Informações */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-blue-50 rounded-xl border border-blue-200 p-4 sm:p-6"
              >
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2 text-sm sm:text-base">
                  <User className="w-4 h-4" />
                  Informações da Conta
                </h4>
                <p className="text-xs sm:text-sm text-blue-700">
                  Sua conta está vinculada ao sistema de autenticação. Para alterar informações básicas como e-mail, entre
                  em contato com o suporte.
                </p>
              </motion.div>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
