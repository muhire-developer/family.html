import React from 'react';
import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isAuthenticated = !!localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
                    EPMS
                </Typography>
                {isAuthenticated && (
                    <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
                        <Button 
                            color="inherit" 
                            onClick={() => navigate('/dashboard')}
                            sx={{ backgroundColor: isActive('/dashboard') ? 'rgba(255,255,255,0.1)' : 'transparent' }}
                        >
                            Dashboard
                        </Button>
                        <Button 
                            color="inherit" 
                            onClick={() => navigate('/salary')}
                            sx={{ backgroundColor: isActive('/salary') ? 'rgba(255,255,255,0.1)' : 'transparent' }}
                        >
                            Salary
                        </Button>
                        <Button 
                            color="inherit" 
                            onClick={() => navigate('/employees')}
                            sx={{ backgroundColor: isActive('/employees') ? 'rgba(255,255,255,0.1)' : 'transparent' }}
                        >
                            Employees
                        </Button>
                        <Button 
                            color="inherit" 
                            onClick={() => navigate('/departments')}
                            sx={{ backgroundColor: isActive('/departments') ? 'rgba(255,255,255,0.1)' : 'transparent' }}
                        >
                            Departments
                        </Button>
                    </Box>
                )}
                {isAuthenticated ? (
                    <Button color="inherit" onClick={handleLogout}>
                        Logout
                    </Button>
                ) : (
                    <Button color="inherit" onClick={() => navigate('/login')}>
                        Login
                    </Button>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Navigation; 