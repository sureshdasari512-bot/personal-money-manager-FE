import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AuthGuard } from './components/AuthGuard';
import { RoleGuard } from './components/RoleGuard';
import { InvitationsPage } from './features/admin/components/InvitationsPage';
import { UserManagementPage } from './features/admin/components/UserManagementPage';
import { AcceptInvitePage } from './features/auth/components/AcceptInvitePage';
import { ForgotPasswordPage } from './features/auth/components/ForgotPasswordPage';
import { LoginPage } from './features/auth/components/LoginPage';
import { ResetPasswordPage } from './features/auth/components/ResetPasswordPage';
import { UnauthorizedPage } from './features/auth/components/UnauthorizedPage';
import { DashboardPage } from './features/dashboard/components/DashboardPage';
import { PeoplePage } from './features/people/components/PeoplePage';
import { PersonLedgerPage } from './features/transactions/components/PersonLedgerPage';

/**
 * Single React app with role-based routing (SRS Option A — not a separate admin app).
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/invite" element={<AcceptInvitePage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route
          element={
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          }
        >
          <Route
            path="/dashboard"
            element={
              <RoleGuard allowedRoles={['user']}>
                <DashboardPage />
              </RoleGuard>
            }
          />
          <Route
            path="/people"
            element={
              <RoleGuard allowedRoles={['user']}>
                <PeoplePage />
              </RoleGuard>
            }
          />
          <Route
            path="/people/:personId"
            element={
              <RoleGuard allowedRoles={['user']}>
                <PersonLedgerPage />
              </RoleGuard>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleGuard allowedRoles={['admin']}>
                <UserManagementPage />
              </RoleGuard>
            }
          />
          <Route
            path="/admin/invitations"
            element={
              <RoleGuard allowedRoles={['admin']}>
                <InvitationsPage />
              </RoleGuard>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
