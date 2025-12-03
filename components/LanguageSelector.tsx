import React from "react";

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
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'zh', name: 'Simplified Chinese' },
  { code: 'th', name: 'Thai' },
  { code: 'ko', name: 'Korean' },
  { code: 'ja', name: 'Japanese' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
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
  const handleSelectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLangName = event.target.value;
    if (selectedLangName !== selectedLanguage) {
      onLanguageChange(selectedLangName);
    }
  };

  return (
    <div className={className}> 
      {label && <label htmlFor={label.replace(/\s+/g, '-').toLowerCase()} className="block text-sm font-medium text-zinc-800 dark:text-white mb-1">{label}</label>}
      <select
        id={label ? label.replace(/\s+/g, '-').toLowerCase() : undefined}
        value={selectedLanguage}
        onChange={handleSelectionChange}
        disabled={disabled || loading}

        className={`capitalize min-w-[150px] sm:min-w-[200px] w-full py-3 px-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-black dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:opacity-50 ${className}`}
        aria-label={label || "Language selection"}
      >
        {loading && <option value="" disabled>Loading...</option>} 
        {!loading && SUPPORTED_LANGUAGES.map((language) => (
          <option 
            key={language.code} 
            value={language.name}

            className="text-black dark:text-white bg-white dark:bg-zinc-800"
          > 
            {language.name}
          </option>
        ))}
      </select>
      
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