import React from 'react';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
}

// 与 ResultsView 保持一致的语言配置
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: '英语', nativeName: 'English' },
  { code: 'ja', name: '日语', nativeName: '日本語' },
  { code: 'ko', name: '韩语', nativeName: '한국어' },
  { code: 'fr', name: '法语', nativeName: 'Français' },
  { code: 'de', name: '德语', nativeName: 'Deutsch' },
  { code: 'es', name: '西班牙语', nativeName: 'Español' },
  { code: 'ru', name: '俄语', nativeName: 'Русский' },
  { code: 'it', name: '意大利语', nativeName: 'Italiano' },
  { code: 'pt', name: '葡萄牙语', nativeName: 'Português' },
  { code: 'ar', name: '阿拉伯语', nativeName: 'العربية' },
  { code: 'hi', name: '印地语', nativeName: 'हिन्दी' },
  { code: 'zh', name: '中文', nativeName: '中文' }
];

// 默认样式配置
const DEFAULT_STYLES = {
  container: "flex flex-col items-center space-y-2",
  label: "text-sm font-medium text-gray-700 dark:text-gray-300",
  select: "block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-gray-200 dark:border-gray-600 transition-colors",
  selectDisabled: "opacity-50 cursor-not-allowed",
  selectLoading: "animate-pulse",
  error: "text-red-500 text-xs mt-1"
};

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  disabled = false,
  loading = false,
  error,
  className
}) => {
  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    if (newLanguage !== selectedLanguage) {
      onLanguageChange(newLanguage);
    }
  };

  const getSelectClassName = () => {
    let classes = DEFAULT_STYLES.select;
    
    if (disabled) {
      classes += ` ${DEFAULT_STYLES.selectDisabled}`;
    }
    
    if (loading) {
      classes += ` ${DEFAULT_STYLES.selectLoading}`;
    }
    
    if (error) {
      classes = classes.replace('border-gray-300', 'border-red-300');
      classes = classes.replace('focus:ring-blue-500 focus:border-blue-500', 'focus:ring-red-500 focus:border-red-500');
    }
    
    return classes;
  };

  const selectedLanguageInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage);

  return (
    <div className={className ? `${DEFAULT_STYLES.container} ${className}` : DEFAULT_STYLES.container}>
      <label 
        htmlFor="language-select" 
        className={DEFAULT_STYLES.label}
        id="language-select-label"
      >
        目标语言
        {loading && (
          <span className="ml-2 inline-flex items-center">
            <svg className="animate-spin h-3 w-3 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
        )}
      </label>
      
      <select
        id="language-select"
        value={selectedLanguage}
        onChange={handleLanguageChange}
        disabled={disabled || loading}
        className={getSelectClassName()}
        aria-labelledby="language-select-label"
        aria-describedby={error ? "language-select-error" : undefined}
        aria-invalid={error ? "true" : "false"}
        title={selectedLanguageInfo ? `当前选择: ${selectedLanguageInfo.name} (${selectedLanguageInfo.nativeName})` : "选择目标语言"}
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.name} ({language.nativeName})
          </option>
        ))}
      </select>
      
      {error && (
        <div 
          id="language-select-error" 
          className={DEFAULT_STYLES.error}
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