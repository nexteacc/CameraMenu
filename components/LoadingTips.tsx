'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { loadingTips, TipItem } from '../data/loadingTips';

/**
 * 加载提示滚动字幕组件
 * 在加载过程中显示食物营养知识，减少用户等待时的无聊感
 * 支持点击展开查看完整内容
 */
interface LoadingTipsProps {
  targetLanguage?: string; // e.g., en, zh...
}

const LoadingTips: React.FC<LoadingTipsProps> = ({ targetLanguage = 'en' }) => {
  const [expandedTip, setExpandedTip] = useState<{ text: string; index: number } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭弹出框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setExpandedTip(null);
      }
    };

    if (expandedTip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [expandedTip]);

  // 文字旋转效果 - 每2.5秒切换一次
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % loadingTips.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // 目标语言变化时重置索引
  useEffect(() => {
    setCurrentIndex(0);
  }, [targetLanguage]);

  const currentTip = loadingTips[currentIndex];
  const currentText =
    currentTip.translations[targetLanguage] || currentTip.translations.en || '';

  const handleTipClick = (tip: TipItem) => {
    const text = tip.translations[targetLanguage] || tip.translations.en || '';
    if (expandedTip?.text === text) {
      setExpandedTip(null);
    } else {
      setExpandedTip({ text, index: currentIndex });
    }
  };

  return (
    <div className="w-[85%] mx-auto relative">
      <div className="h-5 overflow-hidden relative">
        <div className="flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentTip.id}-${targetLanguage}-${currentIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              onClick={() => handleTipClick(currentTip)}
              className="text-sm font-medium text-zinc-500 h-5 flex items-center whitespace-nowrap cursor-pointer hover:text-zinc-700 transition-colors"
            >
              {currentText}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* 展开的完整内容弹出 */}
      {expandedTip && (
        <div 
          ref={popupRef}
          className="absolute top-6 left-0 right-0 z-50 bg-amber-50/95 backdrop-blur-md border border-amber-200/60 rounded-lg shadow-lg p-3 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-sm font-medium text-zinc-700 leading-relaxed break-words">
            {expandedTip.text}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingTips;

