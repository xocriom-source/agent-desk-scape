import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/spaces" element={<Spaces />} />
          <Route path="/world" element={<WorldMap />} />
          <Route path="/city" element={<CityView />} />
          <Route path="/city-explore" element={<CityExplore />} />
          <Route path="/office" element={<Office />} />
          <Route path="/find-building" element={<FindMyBuilding />} />
          <Route path="/building/:id" element={<BuildingInterior />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
