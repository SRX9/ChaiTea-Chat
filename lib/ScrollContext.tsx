"use client";

import React, {
  createContext,
  useState,
  useRef,
  useContext,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

interface ScrollContextType {
  scrollableRef: React.RefObject<HTMLElement | null>;
  showScrollToBottom: boolean;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  isAtBottom: boolean;
}

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

export const useScroll = () => {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error("useScroll must be used within a ScrollProvider");
  }
  return context;
};

interface ScrollProviderProps {
  children: ReactNode;
}

export const ScrollProvider: React.FC<ScrollProviderProps> = ({ children }) => {
  const scrollableRef = useRef<HTMLElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (scrollableRef.current) {
      scrollableRef.current.scrollTo({
        top: scrollableRef.current.scrollHeight,
        behavior,
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollableRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollableRef.current;
      const atBottom = scrollHeight - scrollTop <= clientHeight + 20; // 20px threshold
      setIsAtBottom(atBottom);
      setShowScrollToBottom(!atBottom);
    }
  }, []);

  useEffect(() => {
    const ref = scrollableRef.current;
    if (ref) {
      ref.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        ref.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  return (
    <ScrollContext.Provider
      value={{
        scrollableRef,
        showScrollToBottom,
        scrollToBottom,
        isAtBottom,
      }}
    >
      {children}
    </ScrollContext.Provider>
  );
};
