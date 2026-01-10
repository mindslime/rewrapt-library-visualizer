"use client";

import LoginButton from "@/components/LoginButton";
import Dashboard from "@/components/Dashboard";
import AnimatedTitle from "@/components/AnimatedTitle";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [isDetailView, setIsDetailView] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const headerTitleRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const btnSimpleRef = useRef<HTMLDivElement>(null);
  const btnFlipRef = useRef<HTMLDivElement>(null);

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
        if (headerTitleRef.current) {
          const headerProgress = Math.min(1, Math.max(0, (scrollY - FADE_START) / (FADE_END - FADE_START)));
          const headerY = Math.max(0, 20 - (headerProgress * 20));

          headerTitleRef.current.style.opacity = headerProgress.toString();
          headerTitleRef.current.style.transform = `translateY(${headerY}px)`;
          headerTitleRef.current.style.pointerEvents = headerProgress > 0.5 ? 'auto' : 'none';
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
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-black font-[family-name:var(--font-geist-sans)]">

      {/* Responsive Header / Navbar */}
      <header
        ref={headerRef}
        className="w-full flex items-center justify-between p-4 px-6 fixed top-0 left-0 right-0 z-50 transition-colors duration-500 bg-transparent border-transparent sm:pointer-events-none"
      >
        {/* Mobile Title (Always visible on mobile) */}
        <div className="sm:hidden font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 pointer-events-auto">
          Spotify ReWrapt
        </div>

        {/* Desktop Title (Visible on Scroll) - Positioned Left */}
        <div
          ref={headerTitleRef}
          className="hidden sm:block font-bold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 pointer-events-auto transition-transform duration-75 ease-out will-change-transform will-change-opacity"
          style={{
            opacity: 0,
            transform: `translateY(20px)`,
            pointerEvents: 'none'
          }}
        >
          Spotify ReWrapt
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

      <main className="flex-1 flex flex-col items-center justify-center p-8 gap-8 sm:p-20 text-center mt-20 sm:mt-0">

        {/* Hero Section (Title + Text) - Sticky & Animated */}
        <div
          ref={heroRef}
          className="sticky top-20 z-0 flex flex-col items-center gap-8 will-change-transform will-change-opacity"
        // Initial styles are set by ref logic on mount/scroll
        >
          <div className="hidden sm:block">
            <AnimatedTitle
              text="Spotify ReWrapt"
              className="text-4xl tracking-tighter sm:text-7xl text-white"
            />
          </div>

          <p className="text-xl text-zinc-400 max-w-md">
            Visualize your music library like never before. Explore genres, eras, and your taste evolution.
          </p>
        </div>

        {/* Content Overlay - Higher Z-Index to scroll OVER the sticky hero */}
        <div className="w-full flex flex-col items-center gap-8 relative z-10">
          <div className="w-full flex justify-center">
            <LoginButton action="login" />
          </div>
          <DashboardWrapper onDetailViewChange={setIsDetailView} onProfileImageLoaded={setProfileImage} />
        </div>
      </main >
    </div >
  );
}

function DashboardWrapper({ onDetailViewChange, onProfileImageLoaded }: { onDetailViewChange: (isOpen: boolean) => void, onProfileImageLoaded: (url: string | null) => void }) {
  return (
    <div className="w-full flex justify-center">
      <Dashboard onDetailViewChange={onDetailViewChange} onProfileImageLoaded={onProfileImageLoaded} />
    </div>
  )
}
