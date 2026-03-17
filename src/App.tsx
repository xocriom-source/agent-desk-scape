import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Lazy-loaded pages for smaller initial bundle
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Lobby = lazy(() => import("./pages/Lobby"));
const Spaces = lazy(() => import("./pages/Spaces"));
const Office = lazy(() => import("./pages/Index"));
const WorldMap = lazy(() => import("./pages/WorldMap"));
const CityView = lazy(() => import("./pages/CityView"));
const CityExplore = lazy(() => import("./pages/CityExplore"));
const FindMyBuilding = lazy(() => import("./pages/FindMyBuilding"));
const BuildingInterior = lazy(() => import("./pages/BuildingInterior"));
const EcosystemHub = lazy(() => import("./pages/EcosystemHub"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const DigitalMarketplace = lazy(() => import("./pages/DigitalMarketplace"));
const LiveCity = lazy(() => import("./pages/LiveCity"));
const Features = lazy(() => import("./pages/Features"));
const About = lazy(() => import("./pages/About"));
const IntegrationHub = lazy(() => import("./pages/IntegrationHub"));
const Pricing = lazy(() => import("./pages/Pricing"));
const FinancialDashboard = lazy(() => import("./pages/FinancialDashboard"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min cache
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[10px] font-mono tracking-wider text-muted-foreground">LOADING...</p>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/features" element={<Features />} />
              <Route path="/about" element={<About />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
              <Route path="/spaces" element={<ProtectedRoute><Spaces /></ProtectedRoute>} />
              <Route path="/world" element={<ProtectedRoute><WorldMap /></ProtectedRoute>} />
              <Route path="/city" element={<ProtectedRoute><CityView /></ProtectedRoute>} />
              <Route path="/city-explore" element={<ProtectedRoute><CityExplore /></ProtectedRoute>} />
              <Route path="/live-city" element={<ProtectedRoute><LiveCity /></ProtectedRoute>} />
              <Route path="/office" element={<ProtectedRoute><Office /></ProtectedRoute>} />
              <Route path="/find-building" element={<ProtectedRoute><FindMyBuilding /></ProtectedRoute>} />
              <Route path="/building/:id" element={<ProtectedRoute><BuildingInterior /></ProtectedRoute>} />
              <Route path="/ecosystem" element={<ProtectedRoute><EcosystemHub /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/marketplace/businesses" element={<ProtectedRoute><DigitalMarketplace /></ProtectedRoute>} />
              <Route path="/integrations" element={<ProtectedRoute><IntegrationHub /></ProtectedRoute>} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/financial" element={<ProtectedRoute><FinancialDashboard /></ProtectedRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
