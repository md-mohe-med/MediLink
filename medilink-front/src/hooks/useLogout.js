import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

/**
 * Returns a handleLogout function that:
 *  1. Calls POST /api/logout to invalidate the Sanctum token on the server
 *  2. Clears token & role from localStorage
 *  3. Redirects the user to /login
 */
export default function useLogout() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await api.post('/logout');
        } catch {
            // Even if the server call fails, clear local session
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            navigate('/login', { replace: true });
        }
    };

    return handleLogout;
}
