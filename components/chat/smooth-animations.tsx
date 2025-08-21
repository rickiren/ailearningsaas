'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Smooth Fade In Animation Wrapper
export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 300,
  className 
}: { 
  children: React.ReactNode, 
  delay?: number, 
  duration?: number,
  className?: string 
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={cn(
        "transition-all ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

// Slide In From Bottom Animation
export function SlideInFromBottom({ 
  children, 
  delay = 0,
  className 
}: { 
  children: React.ReactNode, 
  delay?: number,
  className?: string 
}) {
  return (
    <div 
      className={cn(
        "animate-in slide-in-from-bottom-4 fade-in duration-500 ease-out",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// Stagger Animation for Lists
export function StaggeredFadeIn({ 
  children, 
  staggerDelay = 100,
  className 
}: { 
  children: React.ReactNode[], 
  staggerDelay?: number,
  className?: string 
}) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn 
          key={index} 
          delay={index * staggerDelay}
          className="will-change-transform"
        >
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

// Smooth Height Animation
export function SmoothHeight({ 
  children, 
  className 
}: { 
  children: React.ReactNode, 
  className?: string 
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (ref.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          setHeight(entry.contentRect.height);
        }
      });

      resizeObserver.observe(ref.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  return (
    <div 
      className={cn("transition-all duration-300 ease-out overflow-hidden", className)}
      style={{ height }}
    >
      <div ref={ref}>
        {children}
      </div>
    </div>
  );
}

// Scale In Animation
export function ScaleIn({ 
  children, 
  delay = 0,
  className 
}: { 
  children: React.ReactNode, 
  delay?: number,
  className?: string 
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={cn(
        "transition-all duration-300 ease-out",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95",
        className
      )}
    >
      {children}
    </div>
  );
}

// Smooth Reveal Animation
export function SmoothReveal({ 
  children, 
  isRevealed,
  className 
}: { 
  children: React.ReactNode, 
  isRevealed: boolean,
  className?: string 
}) {
  return (
    <div className={cn(
      "transition-all duration-500 ease-out overflow-hidden",
      isRevealed ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
      className
    )}>
      <div className="py-2">
        {children}
      </div>
    </div>
  );
}

// Typing Effect Animation
export function TypingEffect({ 
  text, 
  speed = 50,
  onComplete,
  className 
}: { 
  text: string, 
  speed?: number,
  onComplete?: () => void,
  className?: string 
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {currentIndex < text.length && (
        <span className="inline-block w-0.5 h-5 bg-current ml-0.5 animate-pulse" />
      )}
    </span>
  );
}

// Smooth Progress Bar
export function SmoothProgressBar({ 
  progress, 
  className,
  color = "blue"
}: { 
  progress: number, 
  className?: string,
  color?: "blue" | "green" | "purple" | "indigo"
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    indigo: "from-indigo-500 to-indigo-600"
  };

  return (
    <div className={cn("w-full bg-slate-200 rounded-full h-2 overflow-hidden", className)}>
      <div 
        className={cn(
          "h-full bg-gradient-to-r transition-all duration-1000 ease-out rounded-full",
          colorClasses[color]
        )}
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  );
}

// Bounce In Animation
export function BounceIn({ 
  children, 
  delay = 0,
  className 
}: { 
  children: React.ReactNode, 
  delay?: number,
  className?: string 
}) {
  return (
    <div 
      className={cn(
        "animate-in zoom-in-50 duration-500 ease-out",
        className
      )}
      style={{ 
        animationDelay: `${delay}ms`,
        animationTimingFunction: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }}
    >
      {children}
    </div>
  );
}

// Smooth Drawer Animation
export function SmoothDrawer({ 
  children, 
  isOpen,
  position = 'bottom',
  className 
}: { 
  children: React.ReactNode, 
  isOpen: boolean,
  position?: 'top' | 'bottom' | 'left' | 'right',
  className?: string 
}) {
  const positionClasses = {
    top: isOpen ? 'translate-y-0' : '-translate-y-full',
    bottom: isOpen ? 'translate-y-0' : 'translate-y-full',
    left: isOpen ? 'translate-x-0' : '-translate-x-full',
    right: isOpen ? 'translate-x-0' : 'translate-x-full'
  };

  return (
    <div className={cn(
      "transition-transform duration-300 ease-out",
      positionClasses[position],
      className
    )}>
      {children}
    </div>
  );
}

// Pulse Animation
export function Pulse({ 
  children, 
  intensity = 'normal',
  className 
}: { 
  children: React.ReactNode, 
  intensity?: 'subtle' | 'normal' | 'strong',
  className?: string 
}) {
  const intensityClasses = {
    subtle: 'animate-pulse opacity-75',
    normal: 'animate-pulse',
    strong: 'animate-ping'
  };

  return (
    <div className={cn(intensityClasses[intensity], className)}>
      {children}
    </div>
  );
}

// Smooth Card Hover Effect
export function HoverCard({ 
  children, 
  className 
}: { 
  children: React.ReactNode, 
  className?: string 
}) {
  return (
    <div className={cn(
      "transition-all duration-200 ease-out",
      "hover:scale-[1.02] hover:shadow-lg hover:-translate-y-0.5",
      "active:scale-[0.98] active:shadow-sm",
      className
    )}>
      {children}
    </div>
  );
}

// Smooth Background Gradient Animation
export function AnimatedGradient({ 
  children, 
  colors = ['from-blue-50', 'to-indigo-50'],
  className 
}: { 
  children: React.ReactNode, 
  colors?: string[],
  className?: string 
}) {
  return (
    <div className={cn(
      "bg-gradient-to-r transition-all duration-1000 ease-out",
      colors.join(' '),
      "bg-[length:200%_200%] animate-[gradient_4s_ease_infinite]",
      className
    )}>
      {children}
    </div>
  );
}

// CSS for gradient animation (you'll need to add this to your global CSS)
export const gradientKeyframes = `
@keyframes gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
`;