import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from "dayjs";
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { useFetchAllAppointmentsQuery } from '../../services/api/appointmentsApi';
import { 
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Extend dayjs with plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(advancedFormat);
dayjs.extend(weekOfYear);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const calculateStats = (dateRange, timeRange, customDate, customStartDate, customEndDate, appointments) => {
  let startDate, endDate;
  
  if (dateRange === 'current') {
    switch (timeRange) {
      case 'day':
        startDate = customDate.startOf('day');
        endDate = customDate.endOf('day');
        break;
      case 'week':
        startDate = customStartDate.startOf('day');
        endDate = customEndDate.endOf('day');
        break;
      case 'month':
        startDate = customDate.startOf('month');
        endDate = customDate.endOf('month');
        break;
      case 'year':
        startDate = customDate.startOf('year');
        endDate = customDate.endOf('year');
        break;
      default:
        startDate = dayjs().startOf('day');
        endDate = dayjs().endOf('day');
    }
  } else {
    // For comparison period
    switch (timeRange) {
      case 'day':
        startDate = customDate.startOf('day');
        endDate = customDate.endOf('day');
        break;
      case 'week':
        startDate = customDate.startOf('week');
        endDate = customDate.endOf('week');
        break;
      case 'month':
        startDate = customDate.startOf('month');
        endDate = customDate.endOf('month');
        break;
      case 'year':
        startDate = customDate.startOf('year');
        endDate = customDate.endOf('year');
        break;
      default:
        startDate = dayjs().subtract(1, 'day').startOf('day');
        endDate = dayjs().subtract(1, 'day').endOf('day');
    }
  }

  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = dayjs(appointment.appointmentDateTime);
    return appointmentDate.isSameOrAfter(startDate) && appointmentDate.isSameOrBefore(endDate);
  });

  // Status counts
  const statusCounts = filteredAppointments.reduce((acc, appointment) => {
    acc[appointment.status] = (acc[appointment.status] || 0) + 1;
    return acc;
  }, {});

  // Calculate averages for predictive analytics
  const totalDays = endDate.diff(startDate, 'day') + 1;
  const avgDaily = filteredAppointments.length / totalDays;
  const predictedRemaining = avgDaily * (endDate.diff(dayjs(), 'day'));

  return {
    total: filteredAppointments.length,
    statusCounts,
    avgDaily: Math.round(avgDaily * 10) / 10,
    predictedTotal: Math.round((filteredAppointments.length + predictedRemaining) * 10) / 10,
    startDate,
    endDate
  };
};

const AppointmentAnalytics = () => {
  const [timeRange, setTimeRange] = useState('day');
  const [compareMode, setCompareMode] = useState('none');
  const [customDate, setCustomDate] = useState(dayjs());
  const [compareDate, setCompareDate] = useState(dayjs().subtract(1, 'month'));
  const [customStartDate, setCustomStartDate] = useState(dayjs().startOf('week'));
  const [customEndDate, setCustomEndDate] = useState(dayjs().endOf('week'));
  const { data: allAppointments = { results: [] }, isLoading } = useFetchAllAppointmentsQuery({
    limit: 10000 // Fetch all appointments for analytics
  });

  const handleTimeRangeChange = (event, newValue) => {
    setTimeRange(newValue);
  };

  const handleCompareModeChange = (event) => {
    setCompareMode(event.target.value);
  };

  const currentStats = calculateStats('current', timeRange, customDate, customStartDate, customEndDate, allAppointments.results);
  const comparisonStats = compareMode !== 'none' ? calculateStats('comparison', timeRange, compareDate, compareDate.startOf('week'), compareDate.endOf('week'), allAppointments.results) : null;

  if (isLoading) {
    return <CircularProgress disableShrink />;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Appointment Analytics
        </Typography>
        
        {/* Time range selector */}
        <Box sx={{ mb: 3 }}>
          <Tabs 
            value={timeRange} 
            onChange={handleTimeRangeChange} 
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Day" value="day" />
            <Tab label="Week" value="week" />
            <Tab label="Month" value="month" />
            <Tab label="Year" value="year" />
          </Tabs>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {timeRange === 'day' && (
              <DatePicker
                label="Select Date"
                value={customDate}
                onChange={(newValue) => setCustomDate(newValue)}
                renderInput={(params) => <TextField {...params} />}
              />
            )}
            
            {timeRange === 'week' && (
              <>
                <DatePicker
                  label="Start Date"
                  value={customStartDate}
                  onChange={(newValue) => setCustomStartDate(newValue)}
                  renderInput={(params) => <TextField {...params} />}
                />
                <DatePicker
                  label="End Date"
                  value={customEndDate}
                  onChange={(newValue) => setCustomEndDate(newValue)}
                  minDate={customStartDate}
                  renderInput={(params) => <TextField {...params} />}
                />
              </>
            )}
            
            {(timeRange === 'month' || timeRange === 'year') && (
              <DatePicker
                label={`Select ${timeRange === 'month' ? 'Month' : 'Year'}`}
                value={customDate}
                onChange={(newValue) => setCustomDate(newValue)}
                views={timeRange === 'month' ? ['year', 'month'] : ['year']}
                openTo={timeRange === 'month' ? 'month' : 'year'}
                renderInput={(params) => <TextField {...params} />}
              />
            )}

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Compare With</InputLabel>
              <Select
                value={compareMode}
                onChange={handleCompareModeChange}
                label="Compare With"
              >
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="previous_period">Previous Period</MenuItem>
                <MenuItem value="custom">Custom Date</MenuItem>
              </Select>
            </FormControl>

            {compareMode === 'custom' && (
              timeRange === 'day' ? (
                <DatePicker
                  label="Compare Date"
                  value={compareDate}
                  onChange={(newValue) => setCompareDate(newValue)}
                  renderInput={(params) => <TextField {...params} />}
                />
              ) : timeRange === 'week' ? (
                <DatePicker
                  label="Compare Week"
                  value={compareDate}
                  onChange={(newValue) => setCompareDate(newValue)}
                  views={['year', 'month', 'day']}
                  renderInput={(params) => <TextField {...params} />}
                />
              ) : timeRange === 'month' ? (
                <DatePicker
                  label="Compare Month"
                  value={compareDate}
                  onChange={(newValue) => setCompareDate(newValue)}
                  views={['year', 'month']}
                  renderInput={(params) => <TextField {...params} />}
                />
              ) : (
                <DatePicker
                  label="Compare Year"
                  value={compareDate}
                  onChange={(newValue) => setCompareDate(newValue)}
                  views={['year']}
                  renderInput={(params) => <TextField {...params} />}
                />
              )
            )}
          </Box>
        </Box>
        
        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" color="text.secondary">
                Total Appointments
              </Typography>
              <Typography variant="h3" sx={{ mt: 1 }}>
                {currentStats.total}
                {comparisonStats && (
                  <Typography 
                    variant="subtitle1" 
                    color={currentStats.total > comparisonStats.total ? 'success.main' : 'error.main'}
                    component="span"
                    sx={{ ml: 1 }}
                  >
                    ({((currentStats.total - comparisonStats.total) / comparisonStats.total * 100).toFixed(1)}%)
                  </Typography>
                )}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                {timeRange === 'day' ? customDate.format('MMMM D, YYYY') : 
                 timeRange === 'week' ? `${customStartDate.format('MMM D')} - ${customEndDate.format('MMM D, YYYY')}` : 
                 timeRange === 'month' ? customDate.format('MMMM YYYY') : 
                 customDate.format('YYYY')}
                {comparisonStats && (
                  <>
                    <br />
                    vs {timeRange === 'day' ? compareDate.format('MMMM D, YYYY') : 
                        timeRange === 'week' ? `${compareDate.startOf('week').format('MMM D')} - ${compareDate.endOf('week').format('MMM D, YYYY')}` : 
                        timeRange === 'month' ? compareDate.format('MMMM YYYY') : 
                        compareDate.format('YYYY')}: {comparisonStats.total}
                  </>
                )}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" color="text.secondary">
                Average Daily Appointments
              </Typography>
              <Typography variant="h3" sx={{ mt: 1 }}>
                {currentStats.avgDaily}
                {comparisonStats && (
                  <Typography 
                    variant="subtitle1" 
                    color={currentStats.avgDaily > comparisonStats.avgDaily ? 'success.main' : 'error.main'}
                    component="span"
                    sx={{ ml: 1 }}
                  >
                    ({((currentStats.avgDaily - comparisonStats.avgDaily) / comparisonStats.avgDaily * 100).toFixed(1)}%)
                  </Typography>
                )}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                Based on current period
                {comparisonStats && (
                  <>
                    <br />
                    Previous: {comparisonStats.avgDaily}
                  </>
                )}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" color="text.secondary">
                Predicted Total
              </Typography>
              <Typography variant="h3" sx={{ mt: 1 }}>
                {currentStats.predictedTotal}
                {comparisonStats && (
                  <Typography 
                    variant="subtitle1" 
                    color={currentStats.predictedTotal > comparisonStats.predictedTotal ? 'success.main' : 'error.main'}
                    component="span"
                    sx={{ ml: 1 }}
                  >
                    ({((currentStats.predictedTotal - comparisonStats.predictedTotal) / comparisonStats.predictedTotal * 100).toFixed(1)}%)
                  </Typography>
                )}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                Projected for entire period
                {comparisonStats && (
                  <>
                    <br />
                    Previous: {comparisonStats.predictedTotal}
                  </>
                )}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Status Distribution */}
        <Typography variant="h5" gutterBottom>
          Current Period Analytics
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.keys(currentStats.statusCounts).map(status => ({
                    status,
                    count: currentStats.statusCounts[status]
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Appointments" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          
          {/* Pie Chart for Status Distribution */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Status Percentage Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.keys(currentStats.statusCounts).map(status => ({
                      name: status,
                      value: currentStats.statusCounts[status]
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {Object.keys(currentStats.statusCounts).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Detailed Status Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {Object.keys(currentStats.statusCounts).map((status, index) => (
            <Grid item xs={12} sm={6} md={3} key={status}>
              <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  {status}
                </Typography>
                <Typography variant="h3" sx={{ mt: 1 }}>
                  {currentStats.statusCounts[status]}
                  {comparisonStats && (
                    <Typography 
                      variant="subtitle1" 
                      color={currentStats.statusCounts[status] > (comparisonStats.statusCounts[status] || 0) ? 'success.main' : 'error.main'}
                      component="span"
                      sx={{ ml: 1 }}
                    >
                      ({comparisonStats.statusCounts[status] ? 
                        ((currentStats.statusCounts[status] - comparisonStats.statusCounts[status]) / comparisonStats.statusCounts[status] * 100).toFixed(1) :
                        '+100'}%)
                    </Typography>
                  )}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                  {Math.round((currentStats.statusCounts[status] / currentStats.total) * 100)}% of total
                  {comparisonStats && (
                    <>
                      <br />
                      Previous: {comparisonStats.statusCounts[status] || 0}
                    </>
                  )}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default AppointmentAnalytics;