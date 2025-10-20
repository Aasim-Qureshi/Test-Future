import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';

const LanguageToggle: React.FC = () => {
  const { language, toggleLanguage, isRTL } = useLanguage();

  // Add default values and null checks
  const currentLanguage = language || 'ar';
  const currentIsRTL = isRTL !== undefined ? isRTL : true;

  const handleToggle = () => {
    console.log('Language toggle clicked!');
    console.log('Current language:', currentLanguage);
    console.log('Current isRTL:', currentIsRTL);
    toggleLanguage();
  };

  return (
    <div className="group relative">
      <button
        onClick={handleToggle}
        className="relative inline-flex items-center justify-center w-12 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        aria-label={`Switch to ${currentIsRTL ? 'English' : 'العربية'}`}
        title={`Current: ${currentIsRTL ? 'Arabic' : 'English'} - Click to switch`}
      >
        <div className="absolute inset-0 bg-white/20 rounded-full backdrop-blur-sm"></div>
        
        {/* Language indicator */}
        <div className="relative flex items-center justify-center w-full h-full">
          <Globe className="w-4 h-4 text-white" />
        </div>
        
        {/* Animated language indicator - positioned based on language */}
        <div 
          className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ease-in-out"
          style={{
            // Simple positioning logic
            left: currentIsRTL ? 'auto' : '0.25rem',
            right: currentIsRTL ? '0.25rem' : 'auto'
          }}
        >
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-700">
            {currentIsRTL ? 'ع' : 'EN'}
          </div>
        </div>
        
        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
      </button>
      
      {/* Tooltip */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
        {currentIsRTL ? 'Switch to English' : 'التبديل إلى العربية'}
      </div>
      
      {/* Current language indicator */}
      {/* <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md opacity-75">
        {currentIsRTL ? 'العربية' : 'English'}
      </div> */}
    </div>
  );
};

export default LanguageToggle; 