'use client';

import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

interface CarouselImage {
    src: string;
    alt: string;
}

interface HeroCarouselProps {
    images: CarouselImage[];
    onSlideChange: (index: number) => void;
    onImageClick?: (index: number) => void;
}

const ChevronIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

export function HeroCarousel({ images, onSlideChange, onImageClick }: HeroCarouselProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel(
        { loop: true, duration: 25 },
        [Autoplay({ delay: 5000, stopOnInteraction: false })]
    );
    const [isHovered, setIsHovered] = useState(false);

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    const scrollTo = useCallback((index: number) => {
        if (emblaApi) emblaApi.scrollTo(index);
    }, [emblaApi]);

    useEffect(() => {
        if (emblaApi) {
            const onSelect = () => {
                onSlideChange(emblaApi.selectedScrollSnap());
            };

            emblaApi.on('select', onSelect);
            return () => {
                emblaApi.off('select', onSelect);
            };
        }
    }, [emblaApi, onSlideChange]);

    if (!images || images.length === 0) {
        return (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-600 rounded-3xl flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="text-white/60 block">Nenhuma imagem disponível</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative w-full group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="overflow-hidden rounded-3xl shadow-2xl" ref={emblaRef}>
                <div className="flex">
                    {images.map((img, index) => (
                        <button
                            type="button"
                            key={index}
                            onClick={() => onImageClick?.(index)}
                            aria-label={`Abrir ${img.alt}`}
                            className={`relative flex-[0_0_100%] min-w-0 aspect-video block ${onImageClick ? 'cursor-pointer' : 'cursor-default'} focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40`}
                        >
                            <Image
                                src={img.src}
                                alt={img.alt}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                priority={index === 0}
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                            {/* Overlay sutil */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Botões de navegação com efeito de hover */}
            <div className={`pointer-events-none absolute inset-0 flex items-center justify-between p-4 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'
                }`}>
                <button
                    onClick={scrollPrev}
                    className="pointer-events-auto bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-4 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-110 border border-white/20"
                    aria-label="Slide anterior"
                >
                    <ChevronIcon className="w-6 h-6" />
                </button>
                <button
                    onClick={scrollNext}
                    className="pointer-events-auto bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-4 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-110 border border-white/20"
                    aria-label="Próximo slide"
                >
                    <ChevronIcon className="w-6 h-6 transform rotate-180" />
                </button>
            </div>

            {/* Indicadores de Slide modernizados */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3">
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => scrollTo(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-500 backdrop-blur-sm border ${index === (emblaApi?.selectedScrollSnap() || 0)
                            ? 'bg-white scale-125 border-white shadow-lg'
                            : 'bg-white/30 border-white/20 hover:bg-white/50'
                            }`}
                        aria-label={`Ir para slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}