'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SOSSliderProps {
  onActivate: () => void;
}

export function SOSSlider({ onActivate }: SOSSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // Use refs to hold the latest values for our event handlers to avoid stale closures.
  const onActivateRef = useRef(onActivate);
  const sliderPositionRef = useRef(sliderPosition);
  const isDraggingRef = useRef(isDragging);

  // Keep refs updated with the latest values from props and state.
  useEffect(() => {
    onActivateRef.current = onActivate;
  }, [onActivate]);

  useEffect(() => {
    sliderPositionRef.current = sliderPosition;
  }, [sliderPosition]);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);


  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevents text selection during drag
    setIsDragging(true);
  };

  useEffect(() => {
    const handleInteractionMove = (e: MouseEvent | TouchEvent) => {
      // We only want to move if dragging. Check ref instead of state to avoid stale closure.
      if (!isDraggingRef.current || !sliderRef.current || !thumbRef.current) return;

      const sliderRect = sliderRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const newPosition = clientX - sliderRect.left - thumbRef.current.offsetWidth / 2;

      const sliderWidth = sliderRef.current.offsetWidth;
      const thumbWidth = thumbRef.current.offsetWidth;
      const maxPosition = sliderWidth - thumbWidth;

      setSliderPosition(Math.max(0, Math.min(newPosition, maxPosition)));
    };

    const handleInteractionEnd = () => {
      // Check ref instead of state to avoid stale closure.
      if (!isDraggingRef.current) return;
      
      if (sliderRef.current && thumbRef.current) {
        const sliderWidth = sliderRef.current.offsetWidth;
        const thumbWidth = thumbRef.current.offsetWidth;
        const activationThreshold = sliderWidth - thumbWidth - 5;

        // Use the ref to get the latest slider position.
        if (sliderPositionRef.current >= activationThreshold) {
          onActivateRef.current();
        }
      }
      
      // Reset state, which will cause a re-render.
      setIsDragging(false);
      setSliderPosition(0);
    };

    // Add listeners to the document so that the drag continues even if the
    // cursor leaves the slider area. These listeners are only attached once.
    document.addEventListener('mousemove', handleInteractionMove);
    document.addEventListener('mouseup', handleInteractionEnd);
    document.addEventListener('touchmove', handleInteractionMove);
    document.addEventListener('touchend', handleInteractionEnd);
    

    return () => {
      // Cleanup listeners when the component unmounts.
      document.removeEventListener('mousemove', handleInteractionMove);
      document.removeEventListener('mouseup', handleInteractionEnd);
      document.removeEventListener('touchmove', handleInteractionMove);
      document.removeEventListener('touchend', handleInteractionEnd);
    };
  }, []); // Empty dependency array means this effect runs only once.

  const getTextOpacity = () => {
    return Math.max(0, 1 - (sliderPosition / 100) * 2);
  };

  return (
    <div
      ref={sliderRef}
      className="relative w-full max-w-sm h-16 bg-primary/20 rounded-full flex items-center p-2 select-none cursor-pointer overflow-hidden"
      onMouseDown={handleInteractionStart}
      onTouchStart={handleInteractionStart}
    >
      <div
        ref={thumbRef}
        className={cn(
          "absolute h-12 w-12 bg-accent rounded-full flex items-center justify-center text-accent-foreground z-10 shadow-lg",
          !isDragging && "transition-transform duration-300 ease-in-out"
        )}
        style={{ transform: `translateX(${sliderPosition}px)` }}
      >
        <ChevronsRight className="w-6 h-6" />
      </div>

      <div
        className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
        style={{ opacity: getTextOpacity() }}
      >
        <p className="text-primary font-semibold text-lg">
          Slide to Activate SOS
        </p>
      </div>

      <div
        className="absolute top-0 left-0 h-full bg-accent/50 rounded-full"
        style={{ width: `${sliderPosition + 48}px` }}
      />
    </div>
  );
}
