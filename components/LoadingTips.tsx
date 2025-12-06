'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface TipItem {
  text: string;
  type: 'nutrition' | 'health' | 'pairing' | 'fun-fact' | 'recipe' | 'cuisine' | 'people';
}

/**
 * 加载提示滚动字幕组件
 * 在加载过程中显示食物营养知识，减少用户等待时的无聊感
 * 支持点击展开查看完整内容
 */
const LoadingTips: React.FC = () => {
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

  // Expanded content including recipes, cuisine facts, and people stories
  const tips: TipItem[] = [
    // Nutrition facts
    { text: 'Bananas are rich in potassium, which helps maintain heart health and regulate blood pressure', type: 'nutrition' },
    { text: 'Blueberries are among the fruits with the highest antioxidant content', type: 'nutrition' },
    { text: 'Spinach is rich in iron, but pairing it with vitamin C foods enhances absorption', type: 'nutrition' },
    { text: 'Nuts are an excellent source of healthy fats and protein', type: 'nutrition' },
    
    // Health tips
    { text: 'Eating 5 different colored fruits and vegetables daily provides more balanced nutrition', type: 'health' },
    { text: 'Chewing slowly aids digestion - aim for 20-30 chews per bite', type: 'health' },
    { text: 'Drinking enough water daily aids metabolism and detoxification', type: 'health' },
    { text: 'Avoid eating too late - stop eating 3 hours before bedtime', type: 'health' },
    
    // Food pairing
    { text: 'Lemon and green tea together can enhance vitamin C absorption', type: 'pairing' },
    { text: 'Tofu and seaweed together provide quality protein and iodine', type: 'pairing' },
    { text: 'Milk and oats together provide complete protein and fiber', type: 'pairing' },
    { text: 'Black sesame and walnuts together enhance brain function', type: 'pairing' },
    
    // Fun facts
    { text: 'Apples can float in water because they contain 25% air', type: 'fun-fact' },
    { text: 'Carrots were originally purple - orange varieties were later cultivated', type: 'fun-fact' },
    { text: 'Strawberries are the only fruit with seeds on the outside', type: 'fun-fact' },
    { text: 'Honey never spoils - archaeological finds of honey are still edible', type: 'fun-fact' },
    { text: 'The higher the cocoa content in chocolate, the stronger its antioxidant power', type: 'fun-fact' },
    { text: 'Bananas are botanically classified as berries', type: 'fun-fact' },
    { text: 'Potato chips were invented when a customer complained that his fries were too thick', type: 'fun-fact' },
    { text: 'Using a sharp knife when cutting onions reduces tears', type: 'fun-fact' },
    
    // Recipes
    { text: 'Classic Caprese: Layer fresh mozzarella, tomatoes, and basil, drizzle with olive oil and balsamic', type: 'recipe' },
    { text: 'Perfect scrambled eggs: Cook slowly over low heat, stirring constantly for creamy texture', type: 'recipe' },
    { text: 'Simple pasta aglio e olio: Sauté garlic in olive oil, toss with pasta and fresh parsley', type: 'recipe' },
    { text: 'Quick stir-fry tip: Add vegetables in order of cooking time - carrots first, leafy greens last', type: 'recipe' },
    { text: 'Fluffy pancakes secret: Don\'t overmix the batter - lumps are okay for tender pancakes', type: 'recipe' },
    
    // Cuisine facts
    { text: 'Italian cuisine uses only 4-5 ingredients per dish to let flavors shine', type: 'cuisine' },
    { text: 'Japanese cuisine emphasizes umami - the fifth taste beyond sweet, sour, salty, and bitter', type: 'cuisine' },
    { text: 'French cooking technique: Mirepoix (onions, carrots, celery) is the base of many dishes', type: 'cuisine' },
    { text: 'Thai cuisine balances five flavors: sweet, sour, salty, bitter, and spicy in every dish', type: 'cuisine' },
    { text: 'Mexican cuisine uses over 60 varieties of chili peppers, each with unique heat and flavor', type: 'cuisine' },
    
    // People & stories
    { text: 'Julia Child introduced French cooking to America through her TV show in the 1960s', type: 'people' },
    { text: 'Auguste Escoffier created the modern kitchen brigade system still used in restaurants today', type: 'people' },
    { text: 'Ferran Adrià revolutionized cooking with molecular gastronomy at elBulli restaurant', type: 'people' },
    { text: 'Anthony Bourdain traveled the world sharing food stories that connected cultures', type: 'people' },
  ];

  // 文字旋转效果 - 每2.5秒切换一次
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % tips.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [tips.length]);

  const currentTip = tips[currentIndex];

  const handleTipClick = (tip: TipItem) => {
    if (expandedTip?.text === tip.text) {
      setExpandedTip(null);
    } else {
      setExpandedTip({ text: tip.text, index: currentIndex });
    }
  };

  return (
    <div className="w-[85%] mx-auto relative">
      <div className="h-5 overflow-hidden relative">
        <div className="flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTip.text}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              onClick={() => handleTipClick(currentTip)}
              className="text-sm font-medium text-zinc-500 h-5 flex items-center whitespace-nowrap cursor-pointer hover:text-zinc-700 transition-colors"
            >
              {currentTip.text}
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

