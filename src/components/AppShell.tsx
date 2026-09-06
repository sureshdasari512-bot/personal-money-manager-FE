import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';

/**
 * Authenticated chrome. Admin sees Users and Invites only.
 * People and Dashboard stay on the user role.
 */
export function AppShell() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-[11px] font-bold text-white">
                PMM
              </div>
              <p className="hidden text-sm font-semibold text-slate-900 sm:block">Money Manager</p>
            </div>
            <nav aria-label="Primary" className="flex flex-wrap items-center gap-1">
              {!isAdmin ? (
                <>
                  <NavLink to="/dashboard" className={navClass}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/people" className={navClass}>
                    People
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/admin/users" className={navClass}>
                    Users
                  </NavLink>
                  <NavLink to="/admin/invitations" className={navClass}>
                    Invites
                  </NavLink>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="max-w-40 truncate text-sm font-medium text-slate-800">{user?.email}</p>
              <StatusBadge label={user?.role ?? 'user'} tone={isAdmin ? 'info' : 'neutral'} />
            </div>
            <Button variant="ghost" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <Outlet />
      </div>
    </div>
  );
}

/**
 * Styles an active nav item so the current location is obvious.
 *
 * @param args - React Router nav-state
 * @returns Class names
 */
function navClass({ isActive }: { isActive: boolean }): string {
  return isActive
    ? 'rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800'
    : 'rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900';
}
