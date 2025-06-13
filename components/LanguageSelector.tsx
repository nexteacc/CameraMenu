import React from 'react';
import {Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button} from "@heroui/react";

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

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  disabled = false,
  loading = false,
  error,
  className
}) => {
  const [selectedKeys, setSelectedKeys] = React.useState(new Set([selectedLanguage]));

  const selectedValue = React.useMemo(() => {
    const selectedLang = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage);
    return selectedLang ? `${selectedLang.name} (${selectedLang.nativeName})` : '选择语言';
  }, [selectedLanguage]);

  const handleSelectionChange = (keys: any) => {
    const selectedKey = Array.from(keys)[0] as string;
    if (selectedKey && selectedKey !== selectedLanguage) {
      setSelectedKeys(new Set([selectedKey]));
      onLanguageChange(selectedKey);
    }
  };

  return (
    <div className={className}>
      <Dropdown>
        <DropdownTrigger>
          <Button 
            className="capitalize min-w-[200px] text-black dark:text-white bg-white dark:bg-zinc-800 border border-gray-300 dark:border-gray-600" 
            variant="bordered"
            disabled={disabled || loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                加载中...
              </span>
            ) : (
              selectedValue
            )}
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          disallowEmptySelection
          aria-label="语言选择"
          selectedKeys={selectedKeys}
          selectionMode="single"
          variant="flat"
          onSelectionChange={handleSelectionChange}
          className="bg-white dark:bg-zinc-800 text-black dark:text-white"
        >
          {SUPPORTED_LANGUAGES.map((language) => (
            <DropdownItem 
              key={language.code} 
              className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-700"
            >
              {language.name} ({language.nativeName})
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
      
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