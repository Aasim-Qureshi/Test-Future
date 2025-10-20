import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, User, Bell, LogIn, Settings, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageToggle from "../Common/LanguageToggle";
import AuthSystem from "./login/AuthSystem";
import { useUnreadMessages } from "../../../features/Support/context/UnreadMessagesContext";

interface NavbarProps {
  onMenuToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { t } = useTranslation();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { unreadMessages } = useUnreadMessages();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleAuthSuccess = () => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberLogin");
    setIsAuthenticated(false);
    setUser(null);
    setUserDropdownOpen(false);
    // Force page reload to trigger auth check
    window.location.reload();
  };

  const totalUnread = Object.values(unreadMessages).reduce((acc, count) => acc + (count as number), 0);

  return (
    <>
      <nav className="bg-white shadow-sm border-b">
        <div className="flex justify-between h-16 px-4">
          {/* Left */}
          <div className="flex items-center">
            <button onClick={onMenuToggle} className="md:hidden p-2">
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/" className="text-blue-600 text-xl font-bold">
              {t("navbar.realEstateSystem")}
            </Link>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            <LanguageToggle />

            {!isAuthenticated ? (
              /* Login Button - Show when NOT authenticated */
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                <LogIn className="h-4 w-4" /> {t("Login")}
              </button>
            ) : (
              <>
                {/* Notifications */}
                <button
                  className="relative p-2 hover:bg-gray-100 rounded-md"
                  onClick={() => navigate("/support")}
                  aria-label="View support tickets"
                >
                  <Bell className="h-5 w-5 text-gray-500" />
                  {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px] h-[18px]">
                      {totalUnread}
                    </span>
                  )}
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-200"
                  >
                    <User className="h-5 w-5" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-md w-48 border z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>

                      {/* Menu Items */}
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        {t("navbar.userSettings")}
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {t("navbar.logout")}
                      </button>
                    </div>
                  )}
                </div>

                {/* NEW: Logout button directly visible */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                >
                  <LogOut className="h-4 w-4" /> {t("navbar.logout")}
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      {authModalOpen && (
        <AuthSystem onClose={() => setAuthModalOpen(false)} onSuccess={handleAuthSuccess} />
      )}
    </>
  );
};

export default Navbar;
