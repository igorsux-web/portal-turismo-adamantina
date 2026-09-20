import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Admin from "@/pages/Admin";
import Attendance from "@/pages/Attendance";
import Itineraries from "@/pages/Itineraries";
import ItineraryDetail from "@/pages/ItineraryDetail";
import InviteAccept from "@/pages/InviteAccept";
import PlaceDetail from "@/pages/PlaceDetail";
import EventDetail from "@/pages/EventDetail";
import Events from "@/pages/Events";
import Account from "@/pages/Account";
import PersonalItineraryDetail from "@/pages/PersonalItineraryDetail";
import Privacy from "@/pages/Privacy";
import Auth from "@/pages/Auth";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route path="/login" component={Auth} />
      <Route path="/verificar-email" component={Auth} />
      <Route path="/redefinir-senha" component={Auth} />
      <Route path="/minha-conta" component={Account} />
      <Route path="/minha-conta/roteiros/:id" component={PersonalItineraryDetail} />
      <Route path="/presenca/:code" component={Attendance} />
      <Route path="/privacidade" component={Privacy} />
      <Route path="/locais/:id" component={PlaceDetail} />
      <Route path="/eventos" component={Events} />
      <Route path="/eventos/:id" component={EventDetail} />
      <Route path="/roteiros" component={Itineraries} />
      <Route path="/roteiros/:id" component={ItineraryDetail} />
      <Route path="/convites/:token" component={InviteAccept} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
