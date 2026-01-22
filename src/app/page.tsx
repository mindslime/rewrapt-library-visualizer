"use client";

import LoginButton from "@/components/LoginButton";
import Dashboard from "@/components/Dashboard";
import AnimatedTitle from "@/components/AnimatedTitle";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const [isDetailView, setIsDetailView] = useState(false);
  const [currentViewMode, setCurrentViewMode] = useState<'CLUSTER' | 'TIMELINE'>('CLUSTER');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [contentVisible, setContentVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const headerTitleRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const btnSimpleRef = useRef<HTMLDivElement>(null);
  const btnFlipRef = useRef<HTMLDivElement>(null);

  // Delayed fade-in for paragraph and button (after title animation stabilizes)
  useEffect(() => {
    const timer = setTimeout(() => setContentVisible(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Thresholds
    const FADE_START = 20;
    const FADE_END = 300;

    // Flags to minimize DOM writes
    let isHeaderScrolled = false;

    const handleScroll = () => {
      const scrollY = window.scrollY;

      requestAnimationFrame(() => {
        // 1. Hero Animation (Shrink & Fade)
        if (heroRef.current) {
          const progress = Math.min(1, Math.max(0, scrollY / FADE_END));
          const scale = 1 - progress;
          const opacity = 1 - progress;

          // Apply styles directly
          heroRef.current.style.opacity = opacity.toString();
          heroRef.current.style.transform = `scale(${scale})`;
          heroRef.current.style.filter = `blur(${progress * 10}px)`;

          // Visibility optimization
          if (scale <= 0.01) {
            heroRef.current.style.visibility = 'hidden';
            heroRef.current.style.pointerEvents = 'none';
          } else {
            heroRef.current.style.visibility = 'visible';
            heroRef.current.style.pointerEvents = 'auto';
          }
        }

        // 2. Header Title Animation (Fade In & Slide Up)
        // If logged in, we want it ALWAYS visible (no Hero to crash with).
        // If not logged in, we fade it in as we scroll past the Hero.
        if (headerTitleRef.current) {
          if (session) {
            headerTitleRef.current.style.opacity = '1';
            headerTitleRef.current.style.transform = 'translateY(0)';
            headerTitleRef.current.style.pointerEvents = 'auto';
          } else {
            const headerProgress = Math.min(1, Math.max(0, (scrollY - FADE_START) / (FADE_END - FADE_START)));
            const headerY = Math.max(0, 20 - (headerProgress * 20));

            headerTitleRef.current.style.opacity = headerProgress.toString();
            headerTitleRef.current.style.transform = `translateY(${headerY}px)`;
            headerTitleRef.current.style.pointerEvents = headerProgress > 0.5 ? 'auto' : 'none';
          }
        }

        // 3. Button Cross-fade Animation (Simple -> Flip)
        if (btnSimpleRef.current && btnFlipRef.current) {
          const headerProgress = Math.min(1, Math.max(0, (scrollY - FADE_START) / (FADE_END - FADE_START)));

          // Simple Button: Fades OUT as we scroll
          btnSimpleRef.current.style.opacity = (1 - headerProgress).toString();
          btnSimpleRef.current.style.pointerEvents = headerProgress < 0.5 ? 'auto' : 'none';
          btnSimpleRef.current.style.transform = `scale(${1 - (headerProgress * 0.2)})`; // Subtle shrink

          // Flip Button: Fades IN as we scroll
          btnFlipRef.current.style.opacity = headerProgress.toString();
          btnFlipRef.current.style.pointerEvents = headerProgress >= 0.5 ? 'auto' : 'none';
          btnFlipRef.current.style.transform = `scale(${0.8 + (headerProgress * 0.2)})`; // Subtle grow
        }

        // 3. Header Background Logic
        if (headerRef.current) {
          const shouldBeScrolled = scrollY > 50;
          if (shouldBeScrolled !== isHeaderScrolled) {
            isHeaderScrolled = shouldBeScrolled;
            if (shouldBeScrolled) {
              headerRef.current.classList.add("bg-black/80", "backdrop-blur-md", "border-b", "border-white/10");
              headerRef.current.classList.remove("bg-transparent", "border-transparent", "sm:pointer-events-none");
            } else {
              headerRef.current.classList.remove("bg-black/80", "backdrop-blur-md", "border-b", "border-white/10");
              headerRef.current.classList.add("bg-transparent", "border-transparent", "sm:pointer-events-none");
            }
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Init
    return () => window.removeEventListener("scroll", handleScroll);
  }, [session]);

  return (
    <div className="flex flex-col min-h-screen bg-black font-[family-name:var(--font-geist-sans)] overflow-x-hidden">

      {/* Responsive Header / Navbar - Only show when logged in */}
      {session && (
        <header
          ref={headerRef}
          className={`w-full flex items-center justify-between p-4 px-6 fixed transition-colors duration-500 bg-transparent border-transparent sm:pointer-events-none z-50 ${isDetailView ? 'bottom-0 pointer-events-none' : 'top-0 left-0 right-0'}`}
        >
          {/* Mobile Title (Always visible on mobile) */}
          {/* Mobile Title */}
          <div className={`sm:hidden font-bold text-xl tracking-tight pointer-events-auto ${isDetailView ? 'fixed bottom-4 right-4 z-[102] opacity-30 !pointer-events-none' : ''}`}>
            {session ? (
              <AnimatedTitle
                text="ReWrapt"
                variant="navbar"
                className="text-xl text-white"
              />
            ) : (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                Spotify ReWrapt
              </span>
            )}
          </div>

          {/* Desktop Title (Visible on Scroll) - Positioned Left or Watermarked */}
          <div
            ref={headerTitleRef}
            className={`hidden sm:block font-bold text-2xl tracking-tight pointer-events-auto transition-all duration-500 ease-in-out will-change-transform will-change-opacity ${isDetailView
              ? (currentViewMode === 'TIMELINE'
                ? 'fixed top-24 right-6 z-[102] !opacity-50 !pointer-events-none !transform-none'
                : 'fixed bottom-6 right-6 z-[102] !opacity-30 !pointer-events-none !transform-none')
              : ''
              }`}
            style={{
              // If Watermark (isDetailView), these inline styles are overridden by !important classes above or we strictly control them here
              // But we can just use the class priority if we are careful.
              // Actually, inline styles win over classes. We need to condition the inline styles.
              opacity: isDetailView ? undefined : (session ? 1 : 0),
              transform: isDetailView ? undefined : (session ? 'translateY(0)' : 'translateY(20px)'),
              pointerEvents: isDetailView ? undefined : (session ? 'auto' : 'none')
            }}
          >
            {session ? (
              <AnimatedTitle
                text="ReWrapt"
                variant="navbar"
                className="text-2xl text-white"
              />
            ) : (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                Spotify ReWrapt
              </span>
            )}
          </div>

          {/* Sign Out Button (Always Top Right) - Enable pointer events on desktop too since header is pointer-events-none */}
          {/* Sign Out Button (Always Top Right) - Enable pointer events on desktop too since header is pointer-events-none */}
          <div className={`ml-auto pointer-events-auto transition-opacity duration-300 relative w-10 h-10 flex items-center justify-center ${isDetailView ? 'opacity-0 pointer-events-none' : ''}`}>

            {/* 1. Simple Button (Initial) */}
            <div ref={btnSimpleRef} className="absolute inset-0 flex items-center justify-center">
              <LoginButton action="logout" variant="simple" />
            </div>

            {/* 2. Flip Button (Scrolled) */}
            <div ref={btnFlipRef} className="absolute inset-0 flex items-center justify-center" style={{ opacity: 0, pointerEvents: 'none' }}>
              <LoginButton action="logout" variant="flip" profileImage={profileImage} />
            </div>

          </div>
        </header>
      )}

      <main className={`flex-1 flex flex-col items-center p-4 gap-6 sm:p-20 text-center mt-12 sm:mt-0 transition-all duration-500 ease-in-out ${!session ? 'justify-center' : 'justify-start'}`}>

        {/* Hero Section (Title + Text) - Only show when NOT logged in */}
        {!session && (
          <div
            ref={heroRef}
            className="sticky top-20 z-0 flex flex-col items-center gap-8 will-change-transform will-change-opacity"
          >
            {/* Fixed-height container to prevent layout shift during animation */}
            <div className="relative h-24 sm:h-32 w-full flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <AnimatedTitle
                  text="Spotify ReWrapt"
                  className="text-5xl tracking-tighter sm:text-7xl text-white"
                />
              </div>
            </div>

            <p
              className="text-xl text-zinc-400 max-w-md"
              style={{
                opacity: contentVisible ? 1 : 0,
                transition: 'opacity 1s ease-in-out'
              }}
            >
              Visualize your music library. Explore genres, eras, and your taste evolution.
            </p>
          </div>
        )}

        {/* Content Overlay - Higher Z-Index to scroll OVER the sticky hero */}
        <div className="w-full flex flex-col items-center gap-6 relative z-10">
          {!session && (
            <div
              className="w-full flex justify-center"
              style={{
                opacity: contentVisible ? 1 : 0,
                transition: 'opacity 1s ease-in-out'
              }}
            >
              <LoginButton action="login" />
            </div>
          )}
          <DashboardWrapper
            onDetailViewChange={setIsDetailView}
            onViewModeChange={setCurrentViewMode}
            onProfileImageLoaded={setProfileImage}
          />
        </div>
      </main >
    </div >
  );
}

function DashboardWrapper({
  onDetailViewChange,
  onViewModeChange,
  onProfileImageLoaded
}: {
  onDetailViewChange: (isOpen: boolean) => void,
  onViewModeChange: (mode: 'CLUSTER' | 'TIMELINE') => void,
  onProfileImageLoaded: (url: string | null) => void
}) {
  return (
    <div className="w-full flex justify-center">
      <Dashboard
        onDetailViewChange={onDetailViewChange}
        onViewModeChange={onViewModeChange}
        onProfileImageLoaded={onProfileImageLoaded}
      />
    </div>
  )
}
