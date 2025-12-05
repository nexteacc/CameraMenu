'use client';

import React, { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";
import { ChevronDown, Check } from "lucide-react";
import LiquidGlass from 'liquid-glass-react';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (languageName: string) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
  label?: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'zh', name: 'Simplified Chinese', flag: '🇨🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
];

export const getLanguageCode = (name: string): string => {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.name === name);
  return language?.code || 'en';
};

export const getLanguageName = (code: string): string => {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  return language?.name || 'English';
};

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  disabled = false,
  loading = false,
  error,
  className,
  label
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLang = SUPPORTED_LANGUAGES.find(lang => lang.name === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className={cn("relative inline-block", className)} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          {label}
        </label>
      )}
      
      {/* Trigger Button */}
      <LiquidGlass
        displacementScale={80}
        blurAmount={0.25}
        saturation={150}
        aberrationIntensity={3}
        elasticity={0}
        cornerRadius={999}
        padding="0"
        mode="standard"
        overLight={true}
      >
        <button
          onClick={() => !disabled && !loading && setOpen((o) => !o)}
          disabled={disabled || loading}
          className={cn(
            "flex items-center justify-between gap-2 w-full rounded-full border px-4 py-2 text-sm font-medium transition-all",
            "bg-transparent shadow-sm",
            "border-zinc-200/50",
            "text-zinc-800",
            "hover:border-zinc-300",
            disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{selectedLang.flag}</span>
            <span>{loading ? 'Loading...' : selectedLang.name}</span>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            open && "rotate-180"
          )} />
        </button>
      </LiquidGlass>

      {/* Dropdown Menu */}
      {open && !disabled && !loading && (
        <div
          className={cn(
            "absolute left-0 right-0 mt-2 max-h-64 overflow-y-auto rounded-2xl z-50",
            "bg-white/95",
            "shadow-xl border border-zinc-200",
            "animate-fade-in origin-top"
          )}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onLanguageChange(lang.name);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors",
                selectedLang.code === lang.code
                  ? "bg-blue-50 font-semibold text-blue-600"
                  : "text-zinc-800 hover:bg-zinc-100"
              )}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="flex-1">{lang.name}</span>
              {selectedLang.code === lang.code && (
                <Check className="h-4 w-4 text-blue-500" />
              )}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div 
          className="text-red-600 text-xs mt-1"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
