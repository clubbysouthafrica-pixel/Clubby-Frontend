import {useContext} from 'react'
import {BrowserRouter as Router} from 'react-router-dom';
import {AuthContext} from "@/context/AuthContext.tsx";
import MarketLayout from "@/layouts/market/MarketLayout.tsx";
import MarketRoutes from "@/layouts/market/MarketRoutes.tsx";
import AdminLayout from "@/layouts/admin/AdminLayout.tsx";
import AdminRoutes from "@/layouts/admin/AdminRoutes.tsx";
import { Loader2 } from 'lucide-react';
import { Toaster } from './components/ui/sonner';


function App() {
    const { loading, isAdmin } = useContext(AuthContext) || {};

  return (
    //   <ThemeProvider defaultTheme="light" storageKey="ui-theme">
    <>
          <Router>
              {loading ? 
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div> :
                  <>
                  {
                      !isAdmin ?
                          <MarketLayout>
                              <MarketRoutes />
                          </MarketLayout>
                          :
                          <AdminLayout>
                              <AdminRoutes/>
                          </AdminLayout>
                  }
                  {/*    {*/}
                  {/*        user != null ?*/}
                  {/*            <DashboardLayout>*/}
                  {/*                <DashboardRoutes />*/}
                  {/*            </DashboardLayout> :*/}
                  {/*            <Routes>*/}
                  {/*                <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>}></Route>*/}
                  {/*                <Route path="/login" element={<LoginPage />}></Route>*/}
                  {/*                <Route path="/register" element={<RegisterUserDetails />}></Route>*/}
                  {/*                <Route path="/register/user" element={<RegisterUserDetails />}></Route>*/}
                  {/*                <Route path="/forgot-password" element={<ForgotPassword />}></Route>*/}
                  {/*                <Route path="*" element={<Navigate to="/login" replace />} />*/}
                  {/*            </Routes>*/}
                  {/*    }*/}
                  {/*</>*/}
                  </>
              }
          </Router>
          <Toaster/>
          </>
    //   </ThemeProvider>
  )
}

export default App
