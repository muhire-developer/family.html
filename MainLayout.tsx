import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Navigation from './Navigation';
import { Box } from '@mui/material';

const MainLayout: React.FC = () => {
    const isAuthenticated = !!localStorage.getItem('token');

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navigation />
            <Box sx={{ flexGrow: 1, p: 3 }}>
                <Outlet />
            </Box>
        </Box>
    );
};

export default MainLayout; 