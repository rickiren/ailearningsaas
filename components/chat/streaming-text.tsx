'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface StreamingTextProps {
  text: string;
  isComplete?: boolean;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  showCursor?: boolean;
}

export function StreamingText({ 
  text, 
  isComplete = false, 
  speed = 30,
  className,
  onComplete,
  showCursor = true
}: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const lastIndexRef = useRef(0);

  // Smooth character-by-character animation using requestAnimationFrame
  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      return;
    }

    // If text is getting shorter (like editing), update immediately
    if (text.length < displayedText.length) {
      setDisplayedText(text);
      lastIndexRef.current = text.length;
      return;
    }

    // If content is complete and we're showing the full text, no need to animate
    if (isComplete && displayedText === text) {
      setIsTyping(false);
      onComplete?.();
      return;
    }

    // Start typing animation
    setIsTyping(true);
    startTimeRef.current = performance.now();
    lastIndexRef.current = displayedText.length;

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const charactersShouldShow = Math.min(
        lastIndexRef.current + Math.floor(elapsed / speed),
        text.length
      );

      if (charactersShouldShow > displayedText.length) {
        setDisplayedText(text.slice(0, charactersShouldShow));
      }

      if (charactersShouldShow < text.length) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsTyping(false);
        if (isComplete) {
          onComplete?.();
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [text, speed, isComplete, onComplete]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <span className={cn("relative", className)}>
      <span className="whitespace-pre-wrap break-words">
        {displayedText}
      </span>
      {(isTyping || (!isComplete && showCursor)) && (
        <span className="inline-block w-0.5 h-5 bg-current ml-0.5 animate-pulse opacity-70" />
      )}
    </span>
  );
}

// Word-by-word streaming for better readability
export function WordStreamingText({ 
  text, 
  isComplete = false, 
  wordsPerSecond = 8,
  className,
  onComplete,
  showCursor = true
}: Omit<StreamingTextProps, 'speed'> & { wordsPerSecond?: number }) {
  const [displayedWords, setDisplayedWords] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const words = useMemo(() => text.split(/(\s+)/).filter(Boolean), [text]);

  useEffect(() => {
    if (!text || words.length === 0) {
      setDisplayedWords([]);
      return;
    }

    // If text is getting shorter, update immediately
    if (words.length < displayedWords.length) {
      setDisplayedWords(words);
      return;
    }

    // If we're already showing all words and it's complete, stop
    if (isComplete && displayedWords.length === words.length) {
      setIsTyping(false);
      onComplete?.();
      return;
    }

    setIsTyping(true);
    
    const showNextWord = () => {
      setDisplayedWords(current => {
        const nextIndex = current.length;
        if (nextIndex < words.length) {
          const newWords = [...current, words[nextIndex]];
          
          // Schedule next word
          if (nextIndex + 1 < words.length) {
            timeoutRef.current = setTimeout(showNextWord, 1000 / wordsPerSecond);
          } else if (isComplete) {
            setIsTyping(false);
            onComplete?.();
          }
          
          return newWords;
        }
        return current;
      });
    };

    // Start with current displayed words and add remaining
    if (displayedWords.length < words.length) {
      timeoutRef.current = setTimeout(showNextWord, 1000 / wordsPerSecond);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, words, isComplete, wordsPerSecond, onComplete]);

  return (
    <span className={cn("relative", className)}>
      <span className="whitespace-pre-wrap break-words">
        {displayedWords.join('')}
      </span>
      {(isTyping || (!isComplete && showCursor)) && (
        <span className="inline-block w-0.5 h-5 bg-current ml-0.5 animate-pulse opacity-70" />
      )}
    </span>
  );
}

// Advanced streaming with markdown awareness
export function MarkdownStreamingText({ 
  text, 
  isComplete = false, 
  speed = 30,
  className,
  onComplete
}: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      return;
    }

    // If text is getting shorter, update immediately
    if (text.length < displayedText.length) {
      setDisplayedText(text);
      return;
    }

    // If complete and showing full text, stop
    if (isComplete && displayedText === text) {
      setIsTyping(false);
      onComplete?.();
      return;
    }

    setIsTyping(true);

    // Smart streaming that respects markdown structure
    const streamSmartly = () => {
      setDisplayedText(current => {
        if (current.length >= text.length) {
          if (isComplete) {
            setIsTyping(false);
            onComplete?.();
          }
          return current;
        }

        // Find next good stopping point (end of word, sentence, or markdown element)
        let nextIndex = current.length + 1;
        const remaining = text.slice(current.length);
        
        // Speed up for whitespace and punctuation
        if (/^\s/.test(remaining)) {
          nextIndex = current.length + 1;
        }
        // Slow down for important punctuation
        else if (/^[.!?]/.test(remaining)) {
          nextIndex = current.length + 1;
        }
        // Normal speed for regular characters
        else {
          nextIndex = current.length + 1;
        }

        return text.slice(0, nextIndex);
      });
    };

    intervalRef.current = setInterval(streamSmartly, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, speed, isComplete, onComplete]);

  return (
    <span className={cn("relative", className)}>
      <span className="whitespace-pre-wrap break-words">
        {displayedText}
      </span>
      {(isTyping || (!isComplete && displayedText.length < text.length)) && (
        <span className="inline-block w-0.5 h-5 bg-current ml-0.5 animate-pulse opacity-70" />
      )}
    </span>
  );
}

// Hook for managing streaming state
export function useStreamingText(initialText = '') {
  const [text, setText] = useState(initialText);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appendText = (chunk: string) => {
    setText(current => current + chunk);
    setError(null);
  };

  const completeStream = () => {
    setIsComplete(true);
  };

  const resetStream = () => {
    setText('');
    setIsComplete(false);
    setError(null);
  };

  const setStreamError = (errorMessage: string) => {
    setError(errorMessage);
    setIsComplete(true);
  };

  return {
    text,
    isComplete,
    error,
    appendText,
    completeStream,
    resetStream,
    setStreamError,
    setText
  };
}