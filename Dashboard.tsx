import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Alert,
    Box,
    Card,
    CardContent,
} from '@mui/material';
import {
    People as PeopleIcon,
    Business as BusinessIcon,
    AttachMoney as MoneyIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import axiosInstance from '../utils/axios';
import { useNavigate } from 'react-router-dom';

interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    department_code: string;
    department_name: string;
    position: string;
    net_salary: number;
}

interface Department {
    department_code: string;
    department_name: string;
    gross_salary: number;
    total_deduction: number;
}

const Dashboard: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [error, setError] = useState('');
    const [newEmployee, setNewEmployee] = useState({
        firstName: '',
        lastName: '',
        departmentCode: '',
        position: '',
    });
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchEmployees();
        fetchDepartments();
    }, [navigate]);

    const fetchEmployees = async () => {
        try {
            const response = await axiosInstance.get('/api/employees');
            setEmployees(response.data);
            setError('');
        } catch (error: any) {
            console.error('Error fetching employees:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            } else {
                setError('Failed to load employees. Please try again.');
            }
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await axiosInstance.get('/api/departments');
            setDepartments(response.data);
        } catch (error: any) {
            console.error('Error fetching departments:', error);
            setError('Failed to load departments. Please try again.');
        }
    };

    const handleAddEmployee = async () => {
        try {
            await axiosInstance.post('/api/employees', {
                first_name: newEmployee.firstName,
                last_name: newEmployee.lastName,
                department_code: newEmployee.departmentCode,
                position: newEmployee.position,
            });
            setOpenDialog(false);
            fetchEmployees();
            setNewEmployee({
                firstName: '',
                lastName: '',
                departmentCode: '',
                position: '',
            });
            setError('');
        } catch (error: any) {
            console.error('Error adding employee:', error);
            setError('Failed to add employee. Please try again.');
        }
    };

    const getTotalSalary = () => {
        return employees.reduce((sum, emp) => sum + emp.net_salary, 0);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                    Welcome to EPMS
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                    sx={{ borderRadius: 2 }}
                >
                    Add Employee
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 4 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}>
                        <CardContent sx={{ color: 'white' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <PeopleIcon sx={{ fontSize: 40, mr: 2 }} />
                                <Typography variant="h6">Total Employees</Typography>
                            </Box>
                            <Typography variant="h3">{employees.length}</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ height: '100%', background: 'linear-gradient(45deg, #4CAF50 30%, #81C784 90%)' }}>
                        <CardContent sx={{ color: 'white' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <BusinessIcon sx={{ fontSize: 40, mr: 2 }} />
                                <Typography variant="h6">Departments</Typography>
                            </Box>
                            <Typography variant="h3">{departments.length}</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ height: '100%', background: 'linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)' }}>
                        <CardContent sx={{ color: 'white' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <MoneyIcon sx={{ fontSize: 40, mr: 2 }} />
                                <Typography variant="h6">Total Salary</Typography>
                            </Box>
                            <Typography variant="h3">${getTotalSalary().toLocaleString()}</Typography>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Position</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Net Salary</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {employees.map((employee) => (
                                <TableRow 
                                    key={employee.id}
                                    sx={{ '&:hover': { backgroundColor: '#f8f9fa' } }}
                                >
                                    <TableCell>
                                        {employee.first_name} {employee.last_name}
                                    </TableCell>
                                    <TableCell>{employee.department_name}</TableCell>
                                    <TableCell>{employee.position}</TableCell>
                                    <TableCell>${employee.net_salary.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Dialog 
                open={openDialog} 
                onClose={() => setOpenDialog(false)}
                PaperProps={{
                    sx: { borderRadius: 2 }
                }}
            >
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="normal"
                        fullWidth
                        label="First Name"
                        value={newEmployee.firstName}
                        onChange={(e) =>
                            setNewEmployee({ ...newEmployee, firstName: e.target.value })
                        }
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Last Name"
                        value={newEmployee.lastName}
                        onChange={(e) =>
                            setNewEmployee({ ...newEmployee, lastName: e.target.value })
                        }
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        select
                        label="Department"
                        value={newEmployee.departmentCode}
                        onChange={(e) =>
                            setNewEmployee({ ...newEmployee, departmentCode: e.target.value })
                        }
                        sx={{ mb: 2 }}
                    >
                        {departments.map((dept) => (
                            <MenuItem key={dept.department_code} value={dept.department_code}>
                                {dept.department_name}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Position"
                        value={newEmployee.position}
                        onChange={(e) =>
                            setNewEmployee({ ...newEmployee, position: e.target.value })
                        }
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button 
                        onClick={() => setOpenDialog(false)}
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleAddEmployee} 
                        variant="contained"
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        Add
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Dashboard; 