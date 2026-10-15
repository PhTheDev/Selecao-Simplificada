'use client';

import { emailContato, enderecoConselho, localizacaoConselho, nomeConselho, telefoneConselho } from '@/config/ConselhoConfig';
import { motion } from 'framer-motion';
import { Award, ClipboardCheck, FileText, Handshake, Mail, MapPin, Navigation, Phone, Target, Users, Zap } from 'lucide-react';
import { useState } from 'react';
import { useInView } from 'react-intersection-observer';

const features = [
    {
        icon: <Target className="w-12 h-12 text-[#005f73] group-hover:text-[#0a9396] transition-colors duration-300" />,
        title: "Processo Transparente",
        description: "Acompanhe todas as etapas do processo seletivo de forma clara e objetiva"
    },
    {
        icon: <Zap className="w-12 h-12 text-[#005f73] group-hover:text-[#0a9396] transition-colors duration-300" />,
        title: "Seleção Ágil",
        description: "Processo otimizado para uma experiência rápida, eficiente e moderna"
    },
    {
        icon: <Handshake className="w-12 h-12 text-[#005f73] group-hover:text-[#0a9396] transition-colors duration-300" />,
        title: "Oportunidade Real",
        description: "Chance de crescimento profissional em um órgão reconhecido e inovador"
    }
];

// Etapas atualizadas conforme sua descrição
const steps = [
    {
        number: "1",
        title: "Cadastro",
        desc: "Inscrição no processo seletivo",
        icon: <FileText className="w-6 h-6 text-white" />
    },
    {
        number: "2",
        title: "Etapa 1",
        desc: "Análise de documentos pessoais, acadêmicos e portfólio",
        icon: <ClipboardCheck className="w-6 h-6 text-white" />
    },
    {
        number: "3",
        title: "Etapa 2",
        desc: "Entrevista e testes técnicos para selecionados",
        icon: <Users className="w-6 h-6 text-white" />
    },
    {
        number: "4",
        title: "Resultado",
        desc: "Aprovação dos melhores candidatos",
        icon: <Award className="w-6 h-6 text-white" />
    }
];

const contacts = [
    {
        icon: <MapPin className="w-6 h-6 text-white" />,
        title: "Endereço",
        text: enderecoConselho
    },
    {
        icon: <Phone className="w-6 h-6 text-white" />,
        title: "Telefone",
        text: telefoneConselho
    },
    {
        icon: <Mail className="w-6 h-6 text-white" />,
        title: "Email",
        text: emailContato
    }
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
    const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            className="group relative"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-[#005f73]/5 to-[#0a9396]/5 rounded-2xl transform group-hover:scale-105 transition-all duration-500"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500">
                <div className="relative inline-block mb-6">
                    <div className="transform group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                </div>
                <h3 className="text-2xl font-black mb-4 bg-gradient-to-br from-[#005f73] to-[#0a9396] bg-clip-text text-transparent">
                    {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">{feature.description}</p>
            </div>
        </motion.div>
    );
};

const ProcessStep = ({ step, index }: { step: any; index: number }) => {
    const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6, delay: index * 0.15 }}
            className="text-center group relative z-10"
        >
            <div className="relative inline-block mb-6">
                <div className="relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl flex flex-col items-center justify-center mx-auto mb-3 group-hover:from-white/40 group-hover:to-white/20 transition-all duration-500 backdrop-blur-sm border border-white/20">
                        <span className="font-black text-white text-2xl">{step.number}</span>
                        <div className="mt-1 transform group-hover:scale-110 transition-transform">
                            {step.icon}
                        </div>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-[#005f73] to-[#0a9396] rotate-45"></div>
                </div>
            </div>
            <p className="font-black text-white text-lg mb-2 tracking-wide">{step.title}</p>
            <p className="text-white/80 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
        </motion.div>
    );
};

// Componente do Mapa Aprimorado
const EnhancedGoogleMap = () => {
    const [mapLoaded, setMapLoaded] = useState(false);

    // URL otimizada do Google Maps Embed
    const optimizedMapUrl = localizacaoConselho
        ? `${localizacaoConselho}&zoom=18&maptype=satellite&language=pt-BR&theme=dark`
        : "";

    const openInGoogleMaps = () => {
        const query = encodeURIComponent(enderecoConselho);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    };

    const openDirections = () => {
        const query = encodeURIComponent(enderecoConselho);
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
    };

    return (
        <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl">
            {/* Header do Mapa */}
            <div className="p-6 bg-gradient-to-r from-[#005f73] to-[#0a9396] text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black">Localização Oficial</h3>
                            <p className="text-white/90 text-sm">Sede do {nomeConselho}</p>
                        </div>
                    </div>
                    <button
                        onClick={openInGoogleMaps}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-[#005f73] font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 hover:scale-105"
                    >
                        <Navigation className="w-4 h-4" />
                        Abrir no Maps
                    </button>
                </div>
            </div>

            {/* Container do Mapa */}
            <div className="relative h-[500px]">
                {/* Estado de Carregamento */}
                {optimizedMapUrl && !mapLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-blue-50 flex items-center justify-center z-10">
                        <div className="text-center">
                            <div className="relative inline-block mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#005f73] to-[#0a9396] rounded-2xl flex items-center justify-center animate-pulse">
                                    <MapPin className="w-8 h-8 text-white" />
                                </div>
                                <div className="absolute -inset-4 border-4 border-[#005f73]/20 rounded-full animate-ping"></div>
                            </div>
                            <p className="text-gray-700 font-medium">Carregando mapa...</p>
                            <p className="text-gray-500 text-sm mt-2">Preparando a visualização da localização</p>
                        </div>
                    </div>
                )}

                {/* Mapa Google Embed */}
                {optimizedMapUrl ? (
                <iframe
                    src={optimizedMapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Localização"
                    className={`transition-opacity duration-500 ${mapLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setMapLoaded(true)}
                />
                ) : (
                <div className="flex h-full items-center justify-center bg-slate-100 p-8 text-center">
                    <p className="text-lg font-medium text-gray-700">{enderecoConselho}</p>
                </div>
                )}

                {/* Botões de Ação Flutuantes */}
                <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-20">
                    <button
                        onClick={openDirections}
                        className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-[#005f73] to-[#0a9396] text-white font-semibold rounded-xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 group"
                    >
                        <Navigation className="w-5 h-5 group-hover:animate-bounce" />
                        <span>Como chegar</span>
                    </button>
                </div>

                {/* Overlay de Informações */}
                <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-2xl max-w-xs z-20">
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <div className="w-3 h-3 bg-gradient-to-br from-[#005f73] to-[#0a9396] rounded-full"></div>
                        {nomeConselho}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                        {enderecoConselho}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{telefoneConselho}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{emailContato}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Features() {
    return (
        <>
            {/* Benefícios */}
            <section id="beneficios" className="relative overflow-hidden">
                <div className="pt-32 pb-20 bg-gradient-to-br from-[#f8fafc] via-white to-[#f0f9ff]">
                    <div className="container mx-auto px-4">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-center mb-16"
                        >
                            <span className="text-[#0a9396] font-bold text-sm uppercase tracking-wider mb-4 inline-block px-4 py-2 bg-[#0a9396]/10 rounded-full">
                                Vantagens Exclusivas
                            </span>
                            <h2 className="text-5xl font-black text-gray-900 mb-6 leading-tight">
                                Por que ser estagiário do <span className="bg-gradient-to-br from-[#005f73] to-[#0a9396] bg-clip-text text-transparent">{nomeConselho}</span>?
                            </h2>
                            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                                Descubra os benefícios exclusivos de fazer parte do nosso time de estagiários
                                e transforme seu potencial em uma carreira de sucesso
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-3 gap-8 mb-8">
                            {features.map((feature, index) => (
                                <FeatureCard key={index} feature={feature} index={index} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Etapas do Processo Seletivo */}
            <section className="relative py-20 bg-gradient-to-br from-[#005f73] via-[#0a776e] to-[#0a9396] overflow-hidden">
                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-center mb-16"
                    >
                        <h3 className="text-4xl font-black text-white mb-4 tracking-tight">
                            Jornada do <span className="text-[#e9d8a6]">Candidato</span>
                        </h3>
                        <p className="text-white/80 text-lg max-w-2xl mx-auto">
                            Conheça as etapas do nosso processo seletivo e prepare-se para fazer parte do nosso time
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-4 gap-8 relative">
                        {/* Linha conectora */}
                        <div className="hidden md:block absolute top-20 left-4 right-4 z-0">
                            <div className="flex justify-between items-center px-8">
                                {steps.slice(0, -1).map((_, index) => (
                                    <div key={index} className="flex-1 flex items-center">
                                        <motion.div
                                            initial={{ scaleX: 0 }}
                                            whileInView={{ scaleX: 1 }}
                                            transition={{
                                                duration: 0.8,
                                                delay: index * 0.2 + 0.5,
                                                ease: "easeOut"
                                            }}
                                            className="h-0.5 bg-white/60 flex-1 origin-left"
                                        />
                                        <div className="w-4 h-4 bg-white/30 rounded-full flex items-center justify-center mx-2">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                whileInView={{ scale: 1 }}
                                                transition={{
                                                    duration: 0.4,
                                                    delay: index * 0.2 + 1.0
                                                }}
                                                className="w-2 h-2 bg-white/80 rounded-full"
                                            />
                                        </div>
                                    </div>
                                ))}
                                {/* Último segmento sem o círculo no final */}
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    whileInView={{ scaleX: 1 }}
                                    transition={{
                                        duration: 0.8,
                                        delay: (steps.length - 1) * 0.2 + 0.5,
                                        ease: "easeOut"
                                    }}
                                    className="h-0.5 bg-white/60 flex-1 origin-left"
                                />
                            </div>
                        </div>

                        {steps.map((step, index) => (
                            <ProcessStep key={index} step={step} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Mapa + Contato */}
            <section id="contato" className="bg-white py-20">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-5xl font-black text-gray-900 mb-6 leading-tight">
                            Onde encontrar o <span className="bg-gradient-to-br from-[#005f73] to-[#0a9396] bg-clip-text text-transparent">{nomeConselho}</span>
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Venha nos visitar e conhecer nossa estrutura preparada para receber novos talentos
                        </p>
                    </motion.div>

                    {/* Mapa Aprimorado */}
                    <EnhancedGoogleMap />

                    {/* Cartões de Contato */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                        {contacts.map((contact, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                                className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
                            >
                                <div className="w-16 h-16 bg-gradient-to-br from-[#005f73] to-[#0a9396] rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    {contact.icon}
                                </div>
                                <h4 className="font-bold text-gray-900 text-lg mb-4 text-center">{contact.title}</h4>
                                <p className="text-gray-700 text-center leading-relaxed">{contact.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}