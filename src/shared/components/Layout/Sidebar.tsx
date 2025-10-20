import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronDown, TestTube } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';

interface SidebarProps {
  isOpen: boolean;
}

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  subItems?: {
    name: string;
    path: string;
  }[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { isRTL } = useLanguage();
  const location = useLocation();
  
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    '/testing': true // Expand testing menu by default
  });


  const menuItems: MenuItem[] = [
    {
      name: 'Testing Environment',
      path: '/testing',
      icon: <TestTube className="h-5 w-5" />,
      subItems: [
        {
          name: 'Excel Test',
          path: '/'
        },
        {
          name: 'Get Test',
          path: '/testing/get'
        },
        {
          name: 'Taqeem Login Test',
          path: '/testing/taqeem-login'
        },
        {
          name: 'Navigate and Upload Test',
          path: '/testing/navigate-upload'
        }
      ]
    },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isSubActive = (path: string) => {
    if(!path) return false;
    return location.pathname.startsWith(path);
  }

  const toggleMenu = (path: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Dynamic positioning based on language
  const sidebarClasses = `
    ${isOpen ? 'sidebar-slide-center' : isRTL ? 'sidebar-slide-rtl' : 'sidebar-slide-ltr'}
    md:translate-x-0 fixed md:relative top-16 h-[calc(100vh-4rem)] w-64 bg-white 
    ${isRTL ? 'sidebar-rtl' : 'sidebar-ltr'}
    sidebar-transition z-10
  `;

  const iconMargin = isRTL ? 'ml-3' : 'mr-3';
  const textMargin = isRTL ? 'mr-3' : 'ml-3';
  const subMenuMargin = isRTL ? 'mr-6' : 'ml-6';
  const subMenuBorder = isRTL ? 'border-r' : 'border-l';
  const subMenuPadding = isRTL ? 'pr-3' : 'pl-3';

  return (
    <aside className={sidebarClasses}>
      <div className="h-full px-3 py-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              {item.subItems ? (
                <div className="space-y-2">
                  <div 
                    className={`flex items-center p-2 text-gray-700 rounded-lg cursor-pointer ${
                      isSubActive(item.path) ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'
                    }`} 
                    onClick={() => toggleMenu(item.path)}
                  >
                    <span className={iconMargin}>{item.icon}</span>
                    <span className={`flex-1 ${textMargin} whitespace-nowrap`}>
                      {item.name}
                    </span>
                    {expandedMenus[item.path] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                  {expandedMenus[item.path] && (
                    <ul className={`${subMenuMargin} space-y-1 ${subMenuBorder} border-gray-200 ${subMenuPadding}`}>
                      {item.subItems.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          <Link 
                            to={subItem.path} 
                            className={`flex items-center p-2 text-gray-700 rounded-lg ${
                              isActive(subItem.path) ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'
                            }`}
                          >
                            <span className="flex-1 whitespace-nowrap">
                              {subItem.name}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link 
                  to={item.path} 
                  className={`flex items-center p-2 text-gray-700 rounded-lg ${
                    isActive(item.path) ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <span className={iconMargin}>{item.icon}</span>
                  <span className={`flex-1 ${textMargin} whitespace-nowrap`}>
                    {item.name}
                  </span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;