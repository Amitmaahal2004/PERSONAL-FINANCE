'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import HeroSlide, { SLIDES_DATA } from './HeroSlide';
import HeroVisual from './HeroVisual';
import DemoModal from './DemoModal';

const AUTOPLAY_INTERVAL = 6000; // 6 seconds

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const totalSlides = SLIDES_DATA.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Robust Autoplay: advances every 6s unless demo modal is open or actively hovering controls
  useEffect(() => {
    if (isPaused || isDemoOpen) return;

    const timer = setInterval(() => {
      nextSlide();
    }, AUTOPLAY_INTERVAL);

    return () => clearInterval(timer);
  }, [isPaused, isDemoOpen, nextSlide]);

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    }
  };

  // Touch & Swipe navigation for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;

    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <>
      <section
        className="hero-carousel-section"
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="MyFinance Interactive Feature Showcase"
      >
        <div className="hero-carousel-container">
          {/* Side Floating Navigation Arrows on Desktop */}
          <button
            type="button"
            onClick={prevSlide}
            className="hero-carousel-side-nav prev"
            aria-label="Previous slide"
            title="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="hero-carousel-side-nav next"
            aria-label="Next slide"
            title="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Viewport for Horizontal Sliding Track */}
          <div className="hero-carousel-viewport">
            <div
              className="hero-carousel-track"
              style={{
                transform: `translateX(-${currentSlide * 100}%)`,
              }}
            >
              {SLIDES_DATA.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={`hero-carousel-slide ${idx === currentSlide ? 'active' : ''}`}
                  aria-hidden={idx !== currentSlide}
                >
                  <div className="hero-carousel-grid">
                    {/* Left Column: Slide Content */}
                    <div className="hero-carousel-left-col">
                      <HeroSlide
                        slide={slide}
                        isActive={idx === currentSlide}
                        onWatchDemo={() => setIsDemoOpen(true)}
                      />
                    </div>

                    {/* Right Column: Slide Visual Mockup */}
                    <div className="hero-carousel-right-col">
                      <HeroVisual slideIndex={idx} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Interactive Controls (Arrows & Pagination Indicators) */}
          <div
            className="hero-carousel-controls"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Previous Arrow Button */}
            <button
              type="button"
              onClick={prevSlide}
              className="hero-carousel-arrow prev"
              aria-label="Previous slide"
              title="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Pagination Indicators / Tabs with Clickable Jump */}
            <div className="hero-carousel-dots" role="tablist">
              {SLIDES_DATA.map((slide, idx) => {
                const isActive = idx === currentSlide;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Slide ${idx + 1}: ${slide.badge}`}
                    onClick={() => goToSlide(idx)}
                    className={`hero-carousel-dot-btn ${isActive ? 'active' : ''}`}
                  >
                    <span className="dot-pill">
                      {isActive && (
                        <span
                          className="dot-progress-fill"
                          key={`fill-${currentSlide}-${isPaused ? 'p' : 'r'}`}
                          style={{
                            animationDuration: `${AUTOPLAY_INTERVAL}ms`,
                            animationPlayState: isPaused ? 'paused' : 'running',
                          }}
                        />
                      )}
                    </span>
                    <span className="dot-label">0{idx + 1}</span>
                  </button>
                );
              })}
            </div>

            {/* Next Arrow Button */}
            <button
              type="button"
              onClick={nextSlide}
              className="hero-carousel-arrow next"
              aria-label="Next slide"
              title="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Lightweight Interactive Product Walkthrough Modal */}
      <DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </>
  );
}
