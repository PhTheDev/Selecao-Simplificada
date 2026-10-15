// Criado e desenvolvido por Pedro Henrique Faria dos Santos Soares 2025.

'use client';

import Footer from "@/components/Footer";
import Features from "@/components/main-page/Features";
import Header from "@/components/main-page/Header";
import Hero from "@/components/main-page/Hero";
import ProcessGrid from "@/components/main-page/ProcessGrid";
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Suavizar o scroll entre seções
    const smoothScroll = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const targetId = e.currentTarget.getAttribute('href')?.substring(1);
      const targetElement = document.getElementById(targetId || '');

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    };

    // Adicionar event listeners para links de navegação suave
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', smoothScroll as any);
    });

    return () => {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.removeEventListener('click', smoothScroll as any);
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <Header />
      <main className="relative">
        <Hero />
        <ProcessGrid />
        <Features />
      </main>
      <Footer />
    </div>
  );
}