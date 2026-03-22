import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const BookClass = lazy(() => import("./pages/BookClass"));
const BookingSuccess = lazy(() => import("./pages/BookingSuccess"));
const Login = lazy(() => import("./pages/Login"));
const AuthDebug = lazy(() => import("./pages/AuthDebug"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PianoTheory = lazy(() => import("./pages/PianoTheory"));
const SightReading = lazy(() => import("./pages/SightReading"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/blog/piano-theory" element={<PianoTheory />} />
              <Route path="/blog/sight-reading" element={<SightReading />} />
              <Route path="/book-class" element={<BookClass />} />
              <Route path="/booking-success" element={<BookingSuccess />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard/*" element={<Dashboard />} />
              <Route path="/auth-debug" element={<AuthDebug />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
