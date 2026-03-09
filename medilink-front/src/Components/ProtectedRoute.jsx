import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api/axios';

/**
 * Protects routes by verifying the session via the backend API.
 *   - No token in localStorage → redirect to /login
 *   - Token exists → calls GET /api/me to verify identity and role
 *   - Wrong role or invalid token → shows 403 page
 */
export default function ProtectedRoute({ allowedRole, children }) {
    const [status, setStatus] = useState('loading'); // loading | authorized | unauthorized | no-token

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setStatus('no-token');
            return;
        }

        api.get('/me')
            .then(res => {
                if (allowedRole && res.data.role !== allowedRole) {
                    setStatus('unauthorized');
                } else {
                    setStatus('authorized');
                }
            })
            .catch(() => {
                // Token is invalid or expired
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                setStatus('no-token');
            });
    }, [allowedRole]);

    if (status === 'loading') {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                background: '#F8FAFC',
                color: '#9CA3AF',
                fontSize: '15px',
            }}>
                Verifying session...
            </div>
        );
    }

    if (status === 'no-token') {
        return <Navigate to="/login" replace />;
    }

    if (status === 'unauthorized') {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                background: '#F8FAFC',
                textAlign: 'center',
                padding: '24px',
            }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚫</div>
                <h1 style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    color: '#111827',
                    margin: '0 0 8px',
                }}>403 — Access Denied</h1>
                <p style={{
                    fontSize: '15px',
                    color: '#6B7280',
                    margin: '0 0 24px',
                }}>You are not authorized to access this page.</p>
                <button
                    onClick={() => window.history.back()}
                    style={{
                        padding: '10px 24px',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >Go Back</button>
            </div>
        );
    }

    return children;
}
