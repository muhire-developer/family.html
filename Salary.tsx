import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Card,
    CardContent,
    MenuItem,
    Alert,
    Box,
    Chip,
    Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
    Add as AddIcon,
    AttachMoney as MoneyIcon,
    Assessment as AssessmentIcon,
} from '@mui/icons-material';
import axiosInstance from '../utils/axios';

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
}

interface SalaryTransaction {
    id: number;
    employee_id: number;
    employee_name: string;
    department_name: string;
    transaction_date: string;
    basic_salary: number;
    allowances: number;
    deductions: number;
    net_amount: number;
    payment_status: 'pending' | 'paid' | 'cancelled';
    payment_date: string | null;
    remarks: string;
}

interface SalaryReport {
    department_name: string;
    employee_count: number;
    total_basic_salary: number;
    total_allowances: number;
    total_deductions: number;
    total_net_amount: number;
}

const Salary: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [transactions, setTransactions] = useState<SalaryTransaction[]>([]);
    const [report, setReport] = useState<SalaryReport[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openReportDialog, setOpenReportDialog] = useState(false);
    const [error, setError] = useState('');
    const [newTransaction, setNewTransaction] = useState({
        employee_id: '',
        transaction_date: new Date(),
        basic_salary: '',
        allowances: '',
        deductions: '',
        remarks: '',
    });
    const [reportFilters, setReportFilters] = useState({
        start_date: new Date(),
        end_date: new Date(),
        department_code: '',
    });

    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
        fetchTransactions();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await axiosInstance.get('/api/employees');
            setEmployees(response.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
            setError('Failed to load employees');
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await axiosInstance.get('/api/departments');
            setDepartments(response.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
            setError('Failed to load departments');
        }
    };

    const fetchTransactions = async () => {
        try {
            const response = await axiosInstance.get('/api/salary/transactions');
            setTransactions(response.data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setError('Failed to load salary transactions');
        }
    };

    const generateReport = async () => {
        try {
            const response = await axiosInstance.get('/api/salary/report', {
                params: {
                    start_date: reportFilters.start_date.toISOString().split('T')[0],
                    end_date: reportFilters.end_date.toISOString().split('T')[0],
                    department_code: reportFilters.department_code || undefined,
                },
            });
            setReport(response.data);
        } catch (error) {
            console.error('Error generating report:', error);
            setError('Failed to generate salary report');
        }
    };

    const handleAddTransaction = async () => {
        try {
            await axiosInstance.post('/api/salary/transactions', {
                employee_id: parseInt(newTransaction.employee_id),
                transaction_date: newTransaction.transaction_date.toISOString().split('T')[0],
                basic_salary: parseFloat(newTransaction.basic_salary),
                allowances: parseFloat(newTransaction.allowances) || 0,
                deductions: parseFloat(newTransaction.deductions) || 0,
                remarks: newTransaction.remarks,
            });
            setOpenDialog(false);
            fetchTransactions();
            setNewTransaction({
                employee_id: '',
                transaction_date: new Date(),
                basic_salary: '',
                allowances: '',
                deductions: '',
                remarks: '',
            });
            setError('');
        } catch (error) {
            console.error('Error adding transaction:', error);
            setError('Failed to add salary transaction');
        }
    };

    const updateTransactionStatus = async (id: number, status: string) => {
        try {
            await axiosInstance.put(`/api/salary/transactions/${id}/status`, { status });
            fetchTransactions();
        } catch (error) {
            console.error('Error updating transaction status:', error);
            setError('Failed to update transaction status');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'success';
            case 'pending':
                return 'warning';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    return (
        <Container>
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1">
                        Salary Management
                    </Typography>
                    <Box>
                        <Button
                            variant="contained"
                            startIcon={<AssessmentIcon />}
                            onClick={() => setOpenReportDialog(true)}
                            sx={{ mr: 2 }}
                        >
                            Generate Report
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenDialog(true)}
                        >
                            New Transaction
                        </Button>
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 4 }}>
                    <Card sx={{ flex: 1 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <MoneyIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                                <Typography variant="h6">Total Transactions</Typography>
                            </Box>
                            <Typography variant="h3">{transactions.length}</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: 1 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <MoneyIcon sx={{ fontSize: 40, mr: 2, color: 'success.main' }} />
                                <Typography variant="h6">Total Paid Amount</Typography>
                            </Box>
                            <Typography variant="h3">
                                ${transactions
                                    .filter((t) => t.payment_status === 'paid')
                                    .reduce((sum, t) => sum + t.net_amount, 0)
                                    .toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: 1 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <MoneyIcon sx={{ fontSize: 40, mr: 2, color: 'warning.main' }} />
                                <Typography variant="h6">Pending Payments</Typography>
                            </Box>
                            <Typography variant="h3">
                                {transactions.filter((t) => t.payment_status === 'pending').length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Stack>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Employee</TableCell>
                                <TableCell>Department</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Basic Salary</TableCell>
                                <TableCell>Allowances</TableCell>
                                <TableCell>Deductions</TableCell>
                                <TableCell>Net Amount</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell>{transaction.employee_name}</TableCell>
                                    <TableCell>{transaction.department_name}</TableCell>
                                    <TableCell>{new Date(transaction.transaction_date).toLocaleDateString()}</TableCell>
                                    <TableCell>${transaction.basic_salary.toLocaleString()}</TableCell>
                                    <TableCell>${transaction.allowances.toLocaleString()}</TableCell>
                                    <TableCell>${transaction.deductions.toLocaleString()}</TableCell>
                                    <TableCell>${transaction.net_amount.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={transaction.payment_status}
                                            color={getStatusColor(transaction.payment_status)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {transaction.payment_status === 'pending' && (
                                            <>
                                                <Button
                                                    size="small"
                                                    onClick={() => updateTransactionStatus(transaction.id, 'paid')}
                                                    sx={{ mr: 1 }}
                                                >
                                                    Mark Paid
                                                </Button>
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    onClick={() => updateTransactionStatus(transaction.id, 'cancelled')}
                                                >
                                                    Cancel
                                                </Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* New Transaction Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>New Salary Transaction</DialogTitle>
                <DialogContent>
                    <TextField
                        select
                        fullWidth
                        label="Employee"
                        value={newTransaction.employee_id}
                        onChange={(e) => setNewTransaction({ ...newTransaction, employee_id: e.target.value })}
                        margin="normal"
                    >
                        {employees.map((employee) => (
                            <MenuItem key={employee.id} value={employee.id}>
                                {employee.first_name} {employee.last_name} - {employee.department_name}
                            </MenuItem>
                        ))}
                    </TextField>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="Transaction Date"
                            value={newTransaction.transaction_date}
                            onChange={(date) => setNewTransaction({ ...newTransaction, transaction_date: date || new Date() })}
                            sx={{ mt: 2, width: '100%' }}
                        />
                    </LocalizationProvider>
                    <TextField
                        fullWidth
                        label="Basic Salary"
                        type="number"
                        value={newTransaction.basic_salary}
                        onChange={(e) => setNewTransaction({ ...newTransaction, basic_salary: e.target.value })}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Allowances"
                        type="number"
                        value={newTransaction.allowances}
                        onChange={(e) => setNewTransaction({ ...newTransaction, allowances: e.target.value })}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Deductions"
                        type="number"
                        value={newTransaction.deductions}
                        onChange={(e) => setNewTransaction({ ...newTransaction, deductions: e.target.value })}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Remarks"
                        multiline
                        rows={3}
                        value={newTransaction.remarks}
                        onChange={(e) => setNewTransaction({ ...newTransaction, remarks: e.target.value })}
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddTransaction} variant="contained">
                        Add Transaction
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Report Dialog */}
            <Dialog open={openReportDialog} onClose={() => setOpenReportDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Generate Salary Report</DialogTitle>
                <DialogContent>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 1 }}>
                        <Box sx={{ flex: 1 }}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Start Date"
                                    value={reportFilters.start_date}
                                    onChange={(date) => setReportFilters({ ...reportFilters, start_date: date || new Date() })}
                                    sx={{ width: '100%' }}
                                />
                            </LocalizationProvider>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="End Date"
                                    value={reportFilters.end_date}
                                    onChange={(date) => setReportFilters({ ...reportFilters, end_date: date || new Date() })}
                                    sx={{ width: '100%' }}
                                />
                            </LocalizationProvider>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <TextField
                                select
                                fullWidth
                                label="Department"
                                value={reportFilters.department_code}
                                onChange={(e) => setReportFilters({ ...reportFilters, department_code: e.target.value })}
                            >
                                <MenuItem value="">All Departments</MenuItem>
                                {departments.map((dept) => (
                                    <MenuItem key={dept.department_code} value={dept.department_code}>
                                        {dept.department_name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                    </Stack>

                    <Button
                        fullWidth
                        variant="contained"
                        onClick={generateReport}
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Generate Report
                    </Button>

                    {report.length > 0 && (
                        <TableContainer component={Paper} sx={{ mt: 2 }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Department</TableCell>
                                        <TableCell>Employees</TableCell>
                                        <TableCell>Basic Salary</TableCell>
                                        <TableCell>Allowances</TableCell>
                                        <TableCell>Deductions</TableCell>
                                        <TableCell>Net Amount</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {report.map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{row.department_name}</TableCell>
                                            <TableCell>{row.employee_count}</TableCell>
                                            <TableCell>${row.total_basic_salary.toLocaleString()}</TableCell>
                                            <TableCell>${row.total_allowances.toLocaleString()}</TableCell>
                                            <TableCell>${row.total_deductions.toLocaleString()}</TableCell>
                                            <TableCell>${row.total_net_amount.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenReportDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Salary; 