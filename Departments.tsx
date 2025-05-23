import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Alert,
    Divider,
    LinearProgress,
    Tooltip,
} from '@mui/material';
import {
    Business as BusinessIcon,
    Group as GroupIcon,
    AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import axiosInstance from '../utils/axios';
import { useNavigate } from 'react-router-dom';

interface Department {
    department_code: string;
    department_name: string;
    gross_salary: number;
    total_deduction: number;
    employee_count?: number;
}

const Departments: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchDepartments();
    }, [navigate]);

        const fetchDepartments = async () => {
            try {
            const response = await axiosInstance.get('/api/departments');
                setDepartments(response.data);
            setError('');
        } catch (error: any) {
                console.error('Error fetching departments:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            } else {
                setError('Failed to load departments. Please try again.');
            }
        }
    };

    const getTotalEmployees = () => {
        return departments.reduce((sum, dept) => sum + (dept.employee_count || 0), 0);
    };

    const getTotalBudget = () => {
        return departments.reduce((sum, dept) => sum + dept.gross_salary, 0);
    };

    const getEfficiencyRatio = (department: Department) => {
        const netSalary = department.gross_salary - department.total_deduction;
        return (netSalary / department.gross_salary) * 100;
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 600 }}>
                Department Management
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 4 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
                <Card sx={{ 
                    height: '100%', 
                    background: 'linear-gradient(45deg, #673AB7 30%, #9575CD 90%)',
                    color: 'white'
                }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <BusinessIcon sx={{ fontSize: 40, mr: 2 }} />
                            <Typography variant="h6">Total Departments</Typography>
                        </Box>
                        <Typography variant="h3">{departments.length}</Typography>
                    </CardContent>
                </Card>
                <Card sx={{ 
                    height: '100%', 
                    background: 'linear-gradient(45deg, #009688 30%, #4DB6AC 90%)',
                    color: 'white'
                }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <GroupIcon sx={{ fontSize: 40, mr: 2 }} />
                            <Typography variant="h6">Total Employees</Typography>
                        </Box>
                        <Typography variant="h3">{getTotalEmployees()}</Typography>
                    </CardContent>
                </Card>
                <Card sx={{ 
                    height: '100%', 
                    background: 'linear-gradient(45deg, #FF5722 30%, #FF8A65 90%)',
                    color: 'white'
                }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <AccountBalanceIcon sx={{ fontSize: 40, mr: 2 }} />
                            <Typography variant="h6">Total Budget</Typography>
                        </Box>
                        <Typography variant="h3">${getTotalBudget().toLocaleString()}</Typography>
                    </CardContent>
                </Card>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3 }}>
                        {departments.map((department) => (
                    <Card key={department.department_code} sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6" component="h2">
                                    {department.department_name}
                                </Typography>
                                <Typography variant="subtitle1" color="text.secondary">
                                    Code: {department.department_code}
                                </Typography>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                                <Box>
                                    <Typography color="text.secondary">Employees</Typography>
                                    <Typography variant="h6">{department.employee_count}</Typography>
                                </Box>
                                <Box>
                                    <Typography color="text.secondary">Budget</Typography>
                                    <Typography variant="h6">
                                        ${department.gross_salary.toLocaleString()}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ mt: 2 }}>
                                <Typography color="text.secondary" sx={{ mb: 1 }}>
                                    Efficiency Ratio
                                </Typography>
                                <Tooltip title={`${getEfficiencyRatio(department).toFixed(1)}%`}>
                                    <Box sx={{ width: '100%' }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={getEfficiencyRatio(department)}
                                            sx={{
                                                height: 8,
                                                borderRadius: 5,
                                                backgroundColor: '#e0e0e0',
                                                '& .MuiLinearProgress-bar': {
                                                    backgroundColor: getEfficiencyRatio(department) > 75 
                                                        ? '#4caf50' 
                                                        : getEfficiencyRatio(department) > 50 
                                                            ? '#ff9800' 
                                                            : '#f44336'
                                                }
                                            }}
                                        />
                                    </Box>
                                </Tooltip>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Container>
    );
};

export default Departments; 