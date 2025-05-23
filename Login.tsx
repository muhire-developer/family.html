import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Box,
    Avatar,
    CssBaseline,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';

interface LoginCredentials {
    username: string;
    password: string;
}

interface RegisterData extends LoginCredentials {
    full_name: string;
    email: string;
}

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState<LoginCredentials>({
        username: '',
        password: '',
    });
    const [registerData, setRegisterData] = useState<RegisterData>({
        username: '',
        password: '',
        full_name: '',
        email: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [openRegister, setOpenRegister] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            const response = await axiosInstance.post('/api/login', credentials);
            
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                navigate('/dashboard');
            } else {
                setError('Invalid response from server');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.response?.data?.error || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        setError('');
        setIsLoading(true);
        
        try {
            const response = await axiosInstance.post('/api/register', registerData);
            
            // Store token and user data
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                navigate('/dashboard');
            } else {
                setOpenRegister(false);
                setCredentials({
                    username: registerData.username,
                    password: registerData.password,
                });
                setRegisterData({
                    username: '',
                    password: '',
                    full_name: '',
                    email: '',
                });
                setError('Registration successful! Please log in.');
            }
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.response?.data?.error || 'Failed to register. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
                    <LockOutlinedIcon fontSize="large" />
                </Avatar>
                <Typography component="h1" variant="h4" sx={{ mb: 3 }}>
                    Welcome to EPMS
                </Typography>
                <Paper 
                    elevation={3} 
                    sx={{ 
                        p: 4, 
                        width: '100%',
                        borderRadius: 2,
                        background: 'linear-gradient(to right bottom, #ffffff, #f8f9fa)'
                    }}
                >
                    {error && (
                        <Alert 
                            severity={error.includes('successful') ? 'success' : 'error'} 
                            sx={{ mb: 2 }}
                        >
                            {error}
                        </Alert>
                    )}
                    <form onSubmit={handleLogin}>
                        <TextField
                            fullWidth
                            label="Username"
                            variant="outlined"
                            margin="normal"
                            value={credentials.username}
                            onChange={(e) =>
                                setCredentials({ ...credentials, username: e.target.value })
                            }
                            required
                            disabled={isLoading}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            variant="outlined"
                            margin="normal"
                            value={credentials.password}
                            onChange={(e) =>
                                setCredentials({ ...credentials, password: e.target.value })
                            }
                            required
                            disabled={isLoading}
                            sx={{ mb: 3 }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={isLoading}
                            sx={{
                                py: 1.5,
                                textTransform: 'none',
                                fontSize: '1.1rem',
                                borderRadius: 2,
                                boxShadow: 3,
                                mb: 2
                            }}
                        >
                            {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
                        </Button>
                        <Button
                            fullWidth
                            onClick={() => setOpenRegister(true)}
                            disabled={isLoading}
                            sx={{
                                textTransform: 'none',
                                fontSize: '1rem',
                            }}
                        >
                            Create New Account
                        </Button>
                    </form>
                </Paper>
            </Box>

            <Dialog 
                open={openRegister} 
                onClose={() => setOpenRegister(false)}
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle>Create New Account</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Full Name"
                        variant="outlined"
                        margin="normal"
                        value={registerData.full_name}
                        onChange={(e) =>
                            setRegisterData({ ...registerData, full_name: e.target.value })
                        }
                        required
                        disabled={isLoading}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        variant="outlined"
                        margin="normal"
                        value={registerData.email}
                        onChange={(e) =>
                            setRegisterData({ ...registerData, email: e.target.value })
                        }
                        required
                        disabled={isLoading}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Username"
                        variant="outlined"
                        margin="normal"
                        value={registerData.username}
                        onChange={(e) =>
                            setRegisterData({ ...registerData, username: e.target.value })
                        }
                        required
                        disabled={isLoading}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        variant="outlined"
                        margin="normal"
                        value={registerData.password}
                        onChange={(e) =>
                            setRegisterData({ ...registerData, password: e.target.value })
                        }
                        required
                        disabled={isLoading}
                        helperText="Password must be at least 6 characters long"
                        sx={{ mb: 2 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button 
                        onClick={() => setOpenRegister(false)}
                        disabled={isLoading}
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleRegister}
                        variant="contained"
                        disabled={isLoading}
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        {isLoading ? <CircularProgress size={24} /> : 'Register'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Login; 