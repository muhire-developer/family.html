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
    Box,
    IconButton,
    Alert,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';

interface Department {
    department_code: string;
    department_name: string;
    gross_salary: number;
    total_deduction: number;
}

const DepartmentManagement: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [error, setError] = useState<string>('');
    const [formData, setFormData] = useState({
        department_code: '',
        department_name: '',
        gross_salary: '',
        total_deduction: '',
    });
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

    const handleSubmit = async () => {
        try {
            const payload = {
                ...formData,
                gross_salary: parseFloat(formData.gross_salary),
                total_deduction: parseFloat(formData.total_deduction),
            };

            if (editingDepartment) {
                await axiosInstance.put(`/api/departments/${editingDepartment.department_code}`, payload);
            } else {
                await axiosInstance.post('/api/departments', payload);
            }

            setOpenDialog(false);
            setEditingDepartment(null);
            setFormData({
                department_code: '',
                department_name: '',
                gross_salary: '',
                total_deduction: '',
            });
            fetchDepartments();
            setError('');
        } catch (error: any) {
            console.error('Error saving department:', error);
            setError(error.response?.data?.error || 'Failed to save department. Please try again.');
        }
    };

    const handleEdit = (department: Department) => {
        setEditingDepartment(department);
        setFormData({
            department_code: department.department_code,
            department_name: department.department_name,
            gross_salary: department.gross_salary.toString(),
            total_deduction: department.total_deduction.toString(),
        });
        setOpenDialog(true);
    };

    const handleDelete = async (departmentCode: string) => {
        if (!window.confirm('Are you sure you want to delete this department?')) {
            return;
        }

        try {
            await axiosInstance.delete(`/api/departments/${departmentCode}`);
            fetchDepartments();
            setError('');
        } catch (error: any) {
            console.error('Error deleting department:', error);
            setError(error.response?.data?.error || 'Failed to delete department. Please try again.');
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                    Department Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setEditingDepartment(null);
                        setFormData({
                            department_code: '',
                            department_name: '',
                            gross_salary: '',
                            total_deduction: '',
                        });
                        setOpenDialog(true);
                    }}
                    sx={{ borderRadius: 2 }}
                >
                    Add Department
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 4 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Gross Salary</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Deductions</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Net Salary</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {departments.map((department) => (
                                <TableRow 
                                    key={department.department_code}
                                    sx={{ '&:hover': { backgroundColor: '#f8f9fa' } }}
                                >
                                    <TableCell>{department.department_code}</TableCell>
                                    <TableCell>{department.department_name}</TableCell>
                                    <TableCell>${department.gross_salary.toLocaleString()}</TableCell>
                                    <TableCell>${department.total_deduction.toLocaleString()}</TableCell>
                                    <TableCell>
                                        ${(department.gross_salary - department.total_deduction).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton 
                                            color="primary" 
                                            onClick={() => handleEdit(department)}
                                            size="small"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton 
                                            color="error"
                                            onClick={() => handleDelete(department.department_code)}
                                            size="small"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Dialog 
                open={openDialog} 
                onClose={() => setOpenDialog(false)}
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle>
                    {editingDepartment ? 'Edit Department' : 'Add New Department'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Department Code"
                        value={formData.department_code}
                        onChange={(e) => setFormData({ ...formData, department_code: e.target.value })}
                        disabled={!!editingDepartment}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Department Name"
                        value={formData.department_name}
                        onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Gross Salary"
                        type="number"
                        value={formData.gross_salary}
                        onChange={(e) => setFormData({ ...formData, gross_salary: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Total Deductions"
                        type="number"
                        value={formData.total_deduction}
                        onChange={(e) => setFormData({ ...formData, total_deduction: e.target.value })}
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
                        onClick={handleSubmit}
                        variant="contained"
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        {editingDepartment ? 'Save Changes' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default DepartmentManagement; 