import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Idea {
  source: string;
  strategy: string;
  marketing: string;
  market_potential: string;
  target_audience: string;
}

interface ResultsViewProps {
  ideas: Idea[];
  onRetake: () => void;
  onBack: () => void;
  onRetry: () => void;
  errorMessage: string;
  translatedImageUrl?: string;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

const ResultsView = ({
  ideas,
  onRetake,
  onBack,
  onRetry,
  errorMessage,
  translatedImageUrl,
  selectedLanguage,
  onLanguageChange
}: ResultsViewProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [cardHeight, setCardHeight] = useState<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      setCardHeight(cardRef.current.offsetHeight);
    }
  }, []);

  const handleCardClick = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            返回
          </button>
          <h1 className="text-2xl font-bold">翻译结果</h1>
          <div className="w-20"></div> {/* Spacer for alignment */}
        </div>

        {errorMessage ? (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-300">{errorMessage}</p>
            <button
              onClick={onRetry}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              重试
            </button>
          </div>
        ) : null}

        {/* 显示翻译后的图片 */}
        {translatedImageUrl && (
          <div className="mb-8 bg-gray-800 rounded-lg overflow-hidden shadow-xl">
            <img 
              src={translatedImageUrl} 
              alt="Translated Menu" 
              className="w-full h-auto"
            />
            <div className="p-4 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                已翻译为: {selectedLanguage === 'en' ? '英语' : 
                          selectedLanguage === 'ja' ? '日语' : 
                          selectedLanguage === 'ko' ? '韩语' : 
                          selectedLanguage === 'fr' ? '法语' : 
                          selectedLanguage === 'de' ? '德语' : 
                          selectedLanguage === 'es' ? '西班牙语' : 
                          selectedLanguage === 'ru' ? '俄语' : 
                          selectedLanguage === 'it' ? '意大利语' : 
                          selectedLanguage === 'pt' ? '葡萄牙语' : 
                          selectedLanguage === 'ar' ? '阿拉伯语' : 
                          selectedLanguage === 'hi' ? '印地语' : 
                          selectedLanguage === 'zh' ? '中文' : 
                          selectedLanguage}
              </div>
              <select
                value={selectedLanguage}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 text-sm"
              >
                <option value="en">英语</option>
                <option value="ja">日语</option>
                <option value="ko">韩语</option>
                <option value="fr">法语</option>
                <option value="de">德语</option>
                <option value="es">西班牙语</option>
                <option value="ru">俄语</option>
                <option value="it">意大利语</option>
                <option value="pt">葡萄牙语</option>
                <option value="ar">阿拉伯语</option>
                <option value="hi">印地语</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </div>
        )}

        {ideas.length > 0 && (
          <div className="space-y-4">
            {ideas.map((idea, index) => {
              const isExpanded = expandedIndex === index;
              const zIndex = ideas.length - index;
              const yOffset = isExpanded ? 0 : index * 20;

              return (
                <motion.div
                  key={index}
                  ref={index === 0 ? cardRef : null}
                  className={`relative bg-gray-800 rounded-lg p-6 shadow-lg cursor-pointer overflow-hidden`}
                  style={{ zIndex, marginTop: index === 0 ? 0 : -20 }}
                  initial={false}
                  animate={{
                    y: yOffset,
                    height: isExpanded ? "auto" : cardHeight,
                    transition: { duration: 0.3 },
                  }}
                  onClick={() => handleCardClick(index)}
                >
                  <h3 className="text-xl font-semibold mb-2">{idea.source}</h3>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="mt-4 space-y-4">
                          <div>
                            <h4 className="text-lg font-medium text-blue-400">Strategy</h4>
                            <p className="mt-1 text-gray-300">{idea.strategy}</p>
                          </div>
                          <div>
                            <h4 className="text-lg font-medium text-green-400">Marketing</h4>
                            <p className="mt-1 text-gray-300">{idea.marketing}</p>
                          </div>
                          <div>
                            <h4 className="text-lg font-medium text-yellow-400">Market Potential</h4>
                            <p className="mt-1 text-gray-300">{idea.market_potential}</p>
                          </div>
                          <div>
                            <h4 className="text-lg font-medium text-purple-400">Target Audience</h4>
                            <p className="mt-1 text-gray-300">{idea.target_audience}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={onRetake}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            重新拍照
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;