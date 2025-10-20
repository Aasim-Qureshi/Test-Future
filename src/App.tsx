import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './shared/components/Layout/Layout';
import GlobalAuthGuard from './shared/components/GlobalAuthGuard';
import { UnreadMessagesProvider } from "./features/Support/context/UnreadMessagesContext";
import { TaqeemAuthProvider } from "./shared/context/TaqeemAuthContext";
import { SocketProvider } from './shared/context/SocketContext';
import { ProgressProvider } from './shared/context/ProgressContext';

import ExcelTest from './features/Testing/pages/ExcelTest';
import GetTest from './features/Testing/pages/GetTest';
import TaqeemLoginTest from './features/Testing/pages/TaqeemLoginTest';
import NavigateUploadTest from './features/Testing/pages/NavigateUploadTest';

export function App() {
  return (
    <TaqeemAuthProvider>
      <SocketProvider>
        <ProgressProvider>
          <UnreadMessagesProvider>
            <Router>
              <GlobalAuthGuard>
                <Layout>
                  <Routes>
                    <Route path="/" element={<ExcelTest />} />
                    <Route path="/testing/get" element={<GetTest />} />
                    <Route path="/testing/taqeem-login" element={<TaqeemLoginTest />} />
                    <Route path="/testing/navigate-upload" element={<NavigateUploadTest />} />
                  </Routes>
                </Layout>
              </GlobalAuthGuard>
            </Router>
          </UnreadMessagesProvider>
        </ProgressProvider>
      </SocketProvider>
    </TaqeemAuthProvider>
  );
}