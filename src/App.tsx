import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Lobby from "./pages/Lobby.tsx";
import Spaces from "./pages/Spaces.tsx";
import Office from "./pages/Index.tsx";
import WorldMap from "./pages/WorldMap.tsx";
import CityView from "./pages/CityView.tsx";
import CityExplore from "./pages/CityExplore.tsx";
import FindMyBuilding from "./pages/FindMyBuilding.tsx";
import BuildingInterior from "./pages/BuildingInterior.tsx";
import EcosystemHub from "./pages/EcosystemHub.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import DigitalMarketplace from "./pages/DigitalMarketplace.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
            <Route path="/spaces" element={<ProtectedRoute><Spaces /></ProtectedRoute>} />
            <Route path="/world" element={<ProtectedRoute><WorldMap /></ProtectedRoute>} />
            <Route path="/city" element={<ProtectedRoute><CityView /></ProtectedRoute>} />
            <Route path="/city-explore" element={<ProtectedRoute><CityExplore /></ProtectedRoute>} />
            <Route path="/office" element={<ProtectedRoute><Office /></ProtectedRoute>} />
            <Route path="/find-building" element={<ProtectedRoute><FindMyBuilding /></ProtectedRoute>} />
            <Route path="/building/:id" element={<ProtectedRoute><BuildingInterior /></ProtectedRoute>} />
            <Route path="/ecosystem" element={<ProtectedRoute><EcosystemHub /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
