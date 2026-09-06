import { Link } from 'react-router-dom';
import { AuthLayout } from '../../../components/AuthLayout';
import { useAuth } from '../../../hooks/useAuth';

/**
 * Shown when a RoleGuard rejects the current user.
 */
export function UnauthorizedPage() {
  const { user } = useAuth();
  const homePath = user?.role === 'admin' ? '/admin/users' : '/dashboard';

  return (
    <AuthLayout
      title="You cannot open this page"
      description="Your account does not have access to this area."
    >
      <Link
        to={homePath}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-700 text-sm font-semibold text-white hover:bg-blue-800"
      >
        Back to {user?.role === 'admin' ? 'users' : 'dashboard'}
      </Link>
    </AuthLayout>
  );
}
