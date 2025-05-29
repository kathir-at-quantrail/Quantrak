import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const AuthAwareRedirect = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/home" replace /> : <Navigate to="/" replace />;
};

export default AuthAwareRedirect;