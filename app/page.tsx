'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Vortex } from '@/components/ui/vortex';
import { CometCard } from '@/components/ui/comet-card';
import { BackgroundGradient } from '@/components/ui/background-gradient';

export default function Home() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show back to top button when scrolled down 300px
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, #fff 1px, transparent 1px),
            linear-gradient(to bottom, #fff 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"></div>

      {/* Floating Shapes */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-white rounded-full blur-[120px] opacity-[0.02]"></div>
      <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-white rounded-full blur-[150px] opacity-[0.015]"></div>

      {/* Header */}
      <header className="border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-white/10 bg-white/5 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 bg-white rounded-sm"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                DataUnion
              </h1>
              <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase font-medium">
                Data Economy
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => scrollToSection('features')}
              className="px-6 py-2.5 rounded-md bg-transparent text-white text-sm font-semibold hover:bg-white/5 transition-all border border-white/10"
            >
              FEATURES
            </button>
            <button
              onClick={() => scrollToSection('working')}
              className="px-6 py-2.5 rounded-md bg-transparent text-white text-sm font-semibold hover:bg-white/5 transition-all border border-white/10"
            >
              WORKING
            </button>
            <Link
              href="/walkthrough"
              className="px-6 py-2.5 rounded-md bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all border border-white/10"
            >
              DEMO
            </Link>
          </div>
        </div>
      </header>

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16 pointer-events-none'
          }`}
        aria-label="Back to top"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>

      {/* Hero Section with Vortex */}
      <section className="relative min-h-screen max-w-full mx-auto overflow-hidden flex items-center">
        <Vortex
          backgroundColor="black"
          rangeY={800}
          particleCount={1000}
          baseHue={0}
          variant="sine-wave"
          className="flex items-center justify-center px-2 md:px-10 w-full h-full"
        >
          <div className="text-center relative z-10 max-w-7xl mx-auto px-8 py-32">
            <h2 className="text-6xl md:text-8xl font-bold mb-8 leading-[0.95] tracking-tight">
              <span className="text-white">
                Own Your Data.
              </span>
              <br />
              <span className="text-white/30">
                Share Your Power.
              </span>
            </h2>

            <p className="text-xl text-white/50 max-w-3xl mx-auto mb-16 leading-relaxed font-light">
              A transparent platform where you control your data,
              companies access consented datasets, and every transaction is traceable.
            </p>

            {/* Entry Point CTAs */}
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Contributor */}
              <CometCard>
                <Link href="/contributor/login" className="group block">
                  <div className="relative bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-10 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300">
                    <div className="w-16 h-16 mx-auto mb-6 border border-white/20 bg-white/5 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:border-white/30 transition-all duration-300">
                      <svg className="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">CONTRIBUTOR</h3>
                    <p className="text-sm text-white/40 mb-8 leading-relaxed font-light">
                      Share your data and earn fair rewards in the new economy
                    </p>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 group-hover:text-white group-hover:translate-x-2 transition-all">
                      GET STARTED <span className="text-base">→</span>
                    </div>
                  </div>
                </Link>
              </CometCard>

              {/* Company */}
              <CometCard>
                <Link href="/company/login" className="group block">
                  <div className="relative bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-10 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300">
                    <div className="w-16 h-16 mx-auto mb-6 border border-white/20 bg-white/5 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:border-white/30 transition-all duration-300">
                      <svg className="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">AI COMPANY</h3>
                    <p className="text-sm text-white/40 mb-8 leading-relaxed font-light">
                      License quality, consented datasets for ethical AI
                    </p>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 group-hover:text-white group-hover:translate-x-2 transition-all">
                      BROWSE DATA <span className="text-base">→</span>
                    </div>
                  </div>
                </Link>
              </CometCard>

              {/* Demo */}
              <CometCard>
                <Link href="/walkthrough" className="group block">
                  <BackgroundGradient containerClassName="rounded-[22px]" className="rounded-[22px] bg-black">
                    <div className="relative bg-white/[0.02] backdrop-blur-xl rounded-2xl p-10 hover:bg-white/[0.04] transition-all duration-300">
                      <div className="w-16 h-16 mx-auto mb-6 border border-white/20 bg-white/5 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:border-white/30 transition-all duration-300">
                        <svg className="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">WALKTHROUGH</h3>
                      <p className="text-sm text-white/40 mb-8 leading-relaxed font-light">
                        See the complete system in action with live demo
                      </p>
                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 group-hover:text-white group-hover:translate-x-2 transition-all">
                        START TOUR <span className="text-base">→</span>
                      </div>
                    </div>
                  </BackgroundGradient>
                </Link>
              </CometCard>
            </div>
          </div>
        </Vortex>
      </section>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-8 pb-32 pt-20">

        {/* Key Features */}
        <section id="features" className="mb-40">
          <div className="mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              CORE FEATURES
            </h2>
            <div className="w-24 h-1 bg-white/10"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <CometCard>
              <div className="bg-white/[0.01] backdrop-blur-lg border border-white/5 rounded-2xl p-8 hover:border-white/10 hover:bg-white/[0.02] transition-all">
                <div className="w-14 h-14 border border-white/10 bg-white/5 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">EXPLICIT CONSENT</h3>
                <p className="text-sm text-white/40 leading-relaxed font-light">
                  Full control over data usage with granular permissions and revocation rights
                </p>
              </div>
            </CometCard>

            <CometCard>
              <div className="bg-white/[0.01] backdrop-blur-lg border border-white/5 rounded-2xl p-8 hover:border-white/10 hover:bg-white/[0.02] transition-all">
                <div className="w-14 h-14 border border-white/10 bg-white/5 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">FULL TRACEABILITY</h3>
                <p className="text-sm text-white/40 leading-relaxed font-light">
                  Immutable audit trails for complete transparency in every transaction
                </p>
              </div>
            </CometCard>

            <CometCard>
              <div className="bg-white/[0.01] backdrop-blur-lg border border-white/5 rounded-2xl p-8 hover:border-white/10 hover:bg-white/[0.02] transition-all">
                <div className="w-14 h-14 border border-white/10 bg-white/5 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">FAIR VALUE</h3>
                <p className="text-sm text-white/40 leading-relaxed font-light">
                  Direct compensation based on actual usage and real value created
                </p>
              </div>
            </CometCard>
          </div>
        </section>

        {/* How It Works - Horizontal Scroll */}
        <section id="working" className="mb-40">
          <div className="mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              HOW IT WORKS
            </h2>
            <div className="w-24 h-1 bg-white/10"></div>
          </div>

          <div className="relative">
            {/* Scroll Container with Custom Scrollbar */}
            <style jsx>{`
              .custom-scrollbar::-webkit-scrollbar {
                height: 8px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.3);
              }
            `}</style>
            <div className="overflow-x-auto pb-4 custom-scrollbar" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)',
            }}>
              <div className="flex gap-6 min-w-max px-4">
                {/* Step 1 */}
                <CometCard className="w-96 flex-shrink-0">
                  <div className="bg-white/[0.01] backdrop-blur-lg border border-white/5 rounded-2xl p-10 min-h-[280px] flex flex-col hover:border-white/10 hover:bg-white/[0.02] transition-all">
                    <div className="relative mb-6 w-20 h-20">
                      <div className="absolute inset-0 bg-white/5 rounded-2xl blur-md"></div>
                      <div className="relative w-full h-full border border-white/20 bg-white/5 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">1</span>
                      </div>
                    </div>
                    <h4 className="text-2xl font-bold text-white mb-3 tracking-tight">CONTRIBUTE</h4>
                    <p className="text-sm text-white/40 leading-relaxed font-light">
                      Share your data with full consent and ownership. Choose exactly how your data can be used.
                    </p>
                  </div>
                </CometCard>

                {/* Step 2 */}
                <CometCard className="w-96 flex-shrink-0">
                  <div className="bg-white/[0.01] backdrop-blur-lg border border-white/5 rounded-2xl p-10 min-h-[280px] flex flex-col hover:border-white/10 hover:bg-white/[0.02] transition-all">
                    <div className="relative mb-6 w-20 h-20">
                      <div className="absolute inset-0 bg-white/5 rounded-2xl blur-md"></div>
                      <div className="relative w-full h-full border border-white/20 bg-white/5 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">2</span>
                      </div>
                    </div>
                    <h4 className="text-2xl font-bold text-white mb-3 tracking-tight">LICENSE</h4>
                    <p className="text-sm text-white/40 leading-relaxed font-light">
                      Companies access high-quality, consented datasets. Every license is transparent and tracked.
                    </p>
                  </div>
                </CometCard>

                {/* Step 3 */}
                <CometCard className="w-96 flex-shrink-0">
                  <div className="bg-white/[0.01] backdrop-blur-lg border border-white/5 rounded-2xl p-10 min-h-[280px] flex flex-col hover:border-white/10 hover:bg-white/[0.02] transition-all">
                    <div className="relative mb-6 w-20 h-20">
                      <div className="absolute inset-0 bg-white/5 rounded-2xl blur-md"></div>
                      <div className="relative w-full h-full border border-white/20 bg-white/5 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">3</span>
                      </div>
                    </div>
                    <h4 className="text-2xl font-bold text-white mb-3 tracking-tight">TRACK</h4>
                    <p className="text-sm text-white/40 leading-relaxed font-light">
                      Every data transaction is logged with immutable audit trails. Complete transparency guaranteed.
                    </p>
                  </div>
                </CometCard>

                {/* Step 4 */}
                <CometCard className="w-96 flex-shrink-0">
                  <div className="bg-white/[0.01] backdrop-blur-lg border border-white/5 rounded-2xl p-10 min-h-[280px] flex flex-col hover:border-white/10 hover:bg-white/[0.02] transition-all">
                    <div className="relative mb-6 w-20 h-20">
                      <div className="absolute inset-0 bg-white/5 rounded-2xl blur-md"></div>
                      <div className="relative w-full h-full border border-white/20 bg-white/5 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">4</span>
                      </div>
                    </div>
                    <h4 className="text-2xl font-bold text-white mb-3 tracking-tight">EARN</h4>
                    <p className="text-sm text-white/40 leading-relaxed font-light">
                      Get fair compensation for your contributions. Revenue sharing based on actual value created.
                    </p>
                  </div>
                </CometCard>
              </div>
            </div>

            {/* Enhanced Scroll Indicator */}
            <div className="flex items-center gap-2 mt-8 text-white/40 text-sm font-light">
              <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              <span>Scroll horizontally to see all steps</span>
            </div>
          </div>
        </section>

        {/* Footer Note */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-full px-8 py-4">
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full"></div>
            <p className="text-xs text-white/40 font-medium tracking-wider uppercase">
              Prototype Demo — All Data Simulated
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
