import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../../contexts/AuthContext';
import type { UserRole } from '../../../types';

interface RouteGuardProps {
  children: ReactNode;
  requiredRole?: Exclude<UserRole, null> | Exclude<UserRole, null>[];
  requireAuth?: boolean;
}

export function RouteGuard({
  children,
  requiredRole,
  requireAuth = true,
}: RouteGuardProps) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role if specified
  if (requiredRole && user) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/403" replace />;
    }
  }

  return <>{children}</>;
}
