import React from "react";
import {Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button} from "@heroui/react";

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
  // selectedLanguage prop now stores the language NAME. We use language CODE for DropdownItem keys.
  const [selectedKeys, setSelectedKeys] = React.useState(new Set([
    SUPPORTED_LANGUAGES.find(lang => lang.name === selectedLanguage)?.code || SUPPORTED_LANGUAGES[0].code
  ]));

  const selectedValueDisplay = React.useMemo(() => {
    const selectedLangObject = SUPPORTED_LANGUAGES.find(lang => lang.name === selectedLanguage);
    // Display the name directly as it's now the primary identifier from the parent
    return selectedLangObject ? selectedLangObject.name : (label || '选择语言');
  }, [selectedLanguage, label]);

  const handleSelectionChange = (keys: any) => {
    const selectedLangCode = Array.from(keys)[0] as string;
    const selectedLangObject = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLangCode);
    if (selectedLangObject && selectedLangObject.name !== selectedLanguage) {
      setSelectedKeys(new Set([selectedLangCode]));
      onLanguageChange(selectedLangObject.name); // Pass the language NAME to the callback
    }
  };

  // When selectedLanguage (name) prop changes, update selectedKeys (code)
  React.useEffect(() => {
    const currentLangCode = SUPPORTED_LANGUAGES.find(lang => lang.name === selectedLanguage)?.code;
    if (currentLangCode) {
      setSelectedKeys(new Set([currentLangCode]));
    }
  }, [selectedLanguage]);

  return (
    <div className={className}>
      <Dropdown>
        <DropdownTrigger>
          <Button 
            className="capitalize min-w-[200px] border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500" 
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
              selectedValueDisplay
            )}
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          disallowEmptySelection
          aria-label={label || "语言选择"}
          selectedKeys={selectedKeys} // This should be the language CODE
          selectionMode="single"
          variant="solid" // 改为 solid 以确保背景不透明
          onSelectionChange={handleSelectionChange}
          className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-lg min-w-[200px]" // 调整背景和边框颜色以增加对比度
          itemClasses={{
            base: "text-center text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700", // 确保文本颜色对比度，并设置hover效果
          }}
        >
          {SUPPORTED_LANGUAGES.map((language) => (
            <DropdownItem 
              key={language.code} // Key should be unique, code is good here
              className="text-center text-zinc-900 dark:text-zinc-100 data-[hover=true]:bg-zinc-100 data-[hover=true]:dark:bg-zinc-700 data-[selectable=true]:focus:bg-zinc-200 data-[selectable=true]:dark:focus:bg-zinc-600 data-[selected=true]:bg-blue-500 data-[selected=true]:text-white data-[selected=true]:dark:bg-blue-600 data-[selected=true]:dark:text-white"
            > 
              {language.name} {/* Display only the name as requested */}
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