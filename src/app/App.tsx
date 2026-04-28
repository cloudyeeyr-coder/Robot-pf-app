import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import { RoleLayout } from './components/layout/RoleLayout';
import { RouteGuard } from './components/guards/RouteGuard';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';

// Pages
import { HomePage } from '../pages/Home';
import { LandingPage } from '../pages/Landing';
import { LoginPage } from '../pages/Login';
import { NotFoundPage } from '../pages/NotFound';
import { ForbiddenPage } from '../pages/Forbidden';
import { PlaceholderPage } from '../pages/Placeholder';
import { BuyerSignupPage } from '../pages/signup/BuyerSignup';
import { SiPartnerSignupPage } from '../pages/signup/SiPartnerSignup';
import { PartnerPendingPage } from '../pages/signup/PartnerPending';
import { SearchPage } from '../pages/Search';
import { SiPartnerDetailPage } from '../pages/SiPartnerDetail';
import { CalculatorPage } from '../pages/Calculator';
import { EscrowPaymentPage } from '../pages/contracts/EscrowPayment';
import { PaymentStatusPage } from '../pages/contracts/PaymentStatus';
import { WarrantyPage } from '../pages/contracts/Warranty';
import { InspectionPage } from '../pages/contracts/Inspection';
import { DisputePage } from '../pages/contracts/Dispute';
import { NewAsTicketPage } from '../pages/as/NewAsTicket';
import { AsTicketTrackingPage } from '../pages/as/AsTicketTracking';
import { PartnerProfilePage } from '../pages/partner/Profile';
import { PartnerProposalsPage } from '../pages/partner/Proposals';
import { PartnerBadgesPage } from '../pages/partner/Badges';
import { ManufacturerDashboardPage } from '../pages/manufacturer/Dashboard';
import { BadgeManagementPage } from '../pages/manufacturer/BadgeManagement';
import { ProposalManagementPage } from '../pages/manufacturer/ProposalManagement';
import { AdminDashboardPage } from '../pages/admin/Dashboard';
import { EscrowManagementPage } from '../pages/admin/EscrowManagement';
import { AsSlaMonitoringPage } from '../pages/admin/AsSlaMonitoring';
import { EventLogsPage } from '../pages/admin/EventLogs';
import { DisputesPage } from '../pages/admin/Disputes';
import { NotificationsPage } from '../pages/Notifications';
import { BookingPage } from '../pages/Booking';
import { BookingConfirmationPage } from '../pages/BookingConfirmation';

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Landing Page — Hook Stage (no header/footer) */}
      <Route path="/" element={<LandingPage />} />

      {/* Service Home — accessed via CTA */}
      <Route
        path="/home"
        element={
          <PublicLayout>
            <HomePage />
          </PublicLayout>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      {/* Public - No Auth Required */}
      <Route
        path="/search"
        element={
          <PublicLayout>
            <SearchPage />
          </PublicLayout>
        }
      />
      <Route
        path="/search/:siPartnerId"
        element={
          <PublicLayout>
            <SiPartnerDetailPage />
          </PublicLayout>
        }
      />
      <Route
        path="/calculator"
        element={
          <PublicLayout>
            <CalculatorPage />
          </PublicLayout>
        }
      />
      <Route path="/signup/buyer" element={<BuyerSignupPage />} />
      <Route path="/signup/partner" element={<SiPartnerSignupPage />} />
      <Route path="/signup/partner/pending" element={<PartnerPendingPage />} />

      {/* Buyer Routes */}
      <Route
        path="/my/contracts"
        element={
          <RouteGuard requiredRole="buyer">
            <RoleLayout>
              <PlaceholderPage />
            </RoleLayout>
          </RouteGuard>
        }
      />
      <Route
        path="/contracts/:contractId/payment"
        element={
          <RouteGuard requiredRole="buyer">
            <RoleLayout>
              <EscrowPaymentPage />
            </RoleLayout>
          </RouteGuard>
        }
      />
      <Route
        path="/contracts/:contractId/payment/status"
        element={
          <RouteGuard requiredRole="buyer">
            <RoleLayout>
              <PaymentStatusPage />
            </RoleLayout>
          </RouteGuard>
        }
      />
      <Route
        path="/contracts/:contractId/warranty"
        element={
          <RouteGuard requiredRole="buyer">
            <RoleLayout>
              <WarrantyPage />
            </RoleLayout>
          </RouteGuard>
        }
      />
      <Route
        path="/contracts/:contractId/inspection"
        element={
          <RouteGuard requiredRole="buyer">
            <RoleLayout>
              <InspectionPage />
            </RoleLayout>
          </RouteGuard>
        }
      />
      <Route
        path="/contracts/:contractId/dispute"
        element={
          <RouteGuard requiredRole="buyer">
            <RoleLayout>
              <DisputePage />
            </RoleLayout>
          </RouteGuard>
        }
      />
      <Route
        path="/contracts/:contractId/as/new"
        element={
          <RouteGuard requiredRole="buyer">
            <RoleLayout>
              <NewAsTicketPage />
            </RoleLayout>
          </RouteGuard>
        }
      />
      <Route
        path="/contracts/:contractId/as/:ticketId"
        element={
          <RouteGuard requiredRole="buyer">
            <RoleLayout>
              <AsTicketTrackingPage />
            </RoleLayout>
          </RouteGuard>
        }
      />
      <Route
        path="/my/as-tickets"
        element={
          <RouteGuard requiredRole="buyer">
            <RoleLayout>
              <PlaceholderPage />
            </RoleLayout>
          </RouteGuard>
        }
      />
      <Route
        path="/booking"
        element={
          <RouteGuard requiredRole="buyer">
            <RoleLayout>
              <BookingPage />
            </RoleLayout>
          </RouteGuard>
        }
      />
      <Route
        path="/booking/:bookingId"
        element={
          <RouteGuard requiredRole="buyer">
            <RoleLayout>
              <BookingConfirmationPage />
            </RoleLayout>
          </RouteGuard>
        }
      />
      <Route
        path="/notifications"
        element={
          <RouteGuard requireAuth>
            <PublicLayout>
              <NotificationsPage />
            </PublicLayout>
          </RouteGuard>
        }
      />

      {/* SI Partner Routes */}
      <Route
        path="/partner/profile"
        element={
          <RouteGuard requiredRole="si_partner">
            <RoleLayout showSidebar>
              <PartnerProfilePage />
            </RoleLayout>
          </RouteGuard>
        }
      />
      <Route
        path="/partner/proposals"
        element={
          <RouteGuard requiredRole="si_partner">
            <RoleLayout showSidebar>
              <PartnerProposalsPage />
            </RoleLayout>
          </RouteGuard>
        }
      />
      <Route
        path="/partner/badges"
        element={
          <RouteGuard requiredRole="si_partner">
            <RoleLayout showSidebar>
              <PartnerBadgesPage />
            </RoleLayout>
          </RouteGuard>
        }
      />

      {/* Manufacturer Routes */}
      <Route
        path="/manufacturer/dashboard"
        element={
          <RouteGuard requiredRole="manufacturer">
            <RoleLayout showSidebar>
              <ManufacturerDashboardPage />
            </RoleLayout>
          </RouteGuard>
        }
      />
      <Route
        path="/manufacturer/badges"
        element={
          <RouteGuard requiredRole="manufacturer">
            <RoleLayout showSidebar>
              <BadgeManagementPage />
            </RoleLayout>
          </RouteGuard>
        }
      />
      <Route
        path="/manufacturer/proposals"
        element={
          <RouteGuard requiredRole="manufacturer">
            <RoleLayout showSidebar>
              <ProposalManagementPage />
            </RoleLayout>
          </RouteGuard>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <RouteGuard requiredRole="admin">
            <RoleLayout showSidebar>
              <AdminDashboardPage />
            </RoleLayout>
          </RouteGuard>
        }
      />
      <Route
        path="/admin/escrow"
        element={
          <RouteGuard requiredRole="admin">
            <RoleLayout showSidebar>
              <EscrowManagementPage />
            </RoleLayout>
          </RouteGuard>
        }
      />
      <Route
        path="/admin/as-sla"
        element={
          <RouteGuard requiredRole="admin">
            <RoleLayout showSidebar>
              <AsSlaMonitoringPage />
            </RoleLayout>
          </RouteGuard>
        }
      />
      <Route
        path="/admin/events"
        element={
          <RouteGuard requiredRole="admin">
            <RoleLayout showSidebar>
              <EventLogsPage />
            </RoleLayout>
          </RouteGuard>
        }
      />
      <Route
        path="/admin/disputes"
        element={
          <RouteGuard requiredRole="admin">
            <RoleLayout showSidebar>
              <DisputesPage />
            </RoleLayout>
          </RouteGuard>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}