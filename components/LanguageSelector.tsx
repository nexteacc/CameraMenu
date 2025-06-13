import React from "react";

interface LanguageSelectorProps {
  selectedLanguage: string; // This will now store the language NAME
  onLanguageChange: (languageName: string) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
  label?: string; // Optional label for the selector
}

// Updated supported languages as per user request
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Vietnamese' },
  { code: 'zh', name: 'Simplified Chinese', nativeName: 'Simplified Chinese' }
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  disabled = false,
  loading = false,
  error,
  className,
  label // Destructure the label prop here
}) => {
  const handleSelectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLangName = event.target.value;
    if (selectedLangName !== selectedLanguage) {
      onLanguageChange(selectedLangName);
    }
  };

  return (
    <div className={className}> 
      {label && <label htmlFor={label.replace(/\s+/g, '-').toLowerCase()} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <select
        id={label ? label.replace(/\s+/g, '-').toLowerCase() : undefined}
        value={selectedLanguage}
        onChange={handleSelectionChange}
        disabled={disabled || loading}
        // Tailwind classes for a native select that tries to match the previous styling somewhat
        // Increased padding py-3 px-4, adjusted min-width, and ensured w-full
        className={`capitalize min-w-[150px] sm:min-w-[200px] w-full py-3 px-4 border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 ${className}`}
        aria-label={label || "语言选择"}
      >
        {loading && <option value="" disabled>加载中...</option>} 
        {!loading && SUPPORTED_LANGUAGES.map((language) => (
          <option 
            key={language.code} 
            value={language.name}
            // Basic styling for options, though direct styling of <option> is limited
            className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800"
          > 
            {language.name}
          </option>
        ))}
      </select>
      
      {error && (
        <div 
          className="text-red-500 text-xs mt-1"
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