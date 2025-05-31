import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent,
  Container,
  CircularProgress,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { 
  useGetStockAnalyticsQuery,
  useGetStockHistoryQuery,
  useGetStockForecastQuery 
} from '../../services/api/stocksApi';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const StockAnalytics = () => {
  const [timeRange, setTimeRange] = useState('month');
  const { 
    data: analytics, 
    isLoading: analyticsLoading 
  } = useGetStockAnalyticsQuery();
  
  const { 
    data: history, 
    isLoading: historyLoading 
  } = useGetStockHistoryQuery(timeRange);
  
  const { 
    data: forecast, 
    isLoading: forecastLoading 
  } = useGetStockForecastQuery();

  const handleTimeRangeChange = (event, newValue) => {
    setTimeRange(newValue);
  };

  if (analyticsLoading || historyLoading || forecastLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Prepare data for charts
  const categoryData = analytics?.byCategory || [];
  const trendData = history || [];
  const forecastData = forecast || [];

  // Group history data by operation type
  const groupedHistory = trendData.reduce((acc, item) => {
    if (!acc[item.operation]) {
      acc[item.operation] = [];
    }
    acc[item.operation].push(item);
    return acc;
  }, {});

  return (
    <Box>
      <Typography
        component="h1"
        variant="h3"
        color="inherit"
        noWrap
        sx={{ flexGrow: 1, mb: 4 }}
      >
        <AnalyticsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        Stock Analytics
      </Typography>

      {/* Time range selector */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={timeRange} 
          onChange={handleTimeRangeChange} 
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Week" value="week" />
          <Tab label="Month" value="month" />
          <Tab label="Year" value="year" />
        </Tabs>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Inventory Value
              </Typography>
              <Typography variant="h4">
                {new Intl.NumberFormat('en-PH', {
                  style: 'currency',
                  currency: 'PHP'
                }).format(analytics?.overall?.totalValue || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Items
              </Typography>
              <Typography variant="h4">
                {analytics?.overall?.totalItems || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Low Stock Items (≤5)
              </Typography>
              <Typography variant="h4" color="error">
                {analytics?.overall?.lowStockItems || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Category Breakdown */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Inventory by Category
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={categoryData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => 
                    value.toLocaleString('en-PH', { 
                      style: 'currency', 
                      currency: 'PHP' 
                    })
                  }
                />
                <Legend />
                <Bar dataKey="totalValue" fill="#8884d8" name="Total Value" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Category Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalItems"
                  nameKey="category"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Stock Movement Trends */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Stock Movement Trends ({timeRange})
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => 
                    timeRange === 'week' ? new Date(date).toLocaleDateString() :
                    timeRange === 'month' ? `Day ${new Date(date).getDate()}` :
                    new Date(date).toLocaleDateString('default', { month: 'short' })
                  }
                />
                <YAxis />
                <Tooltip />
                <Legend />
                {Object.keys(groupedHistory).map((operation, idx) => (
                  <Line
                    key={operation}
                    type="monotone"
                    dataKey="totalChange"
                    data={groupedHistory[operation]}
                    name={operation === 'restock' ? 'Restocks' : 'Usage'}
                    stroke={COLORS[idx % COLORS.length]}
                    activeDot={{ r: 8 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Stock Forecast */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Stock Forecast (Days Until Empty)
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={forecastData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="item" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => 
                    name === 'Days Until Empty' ? 
                    [`${value.toFixed(1)} days`, name] : 
                    [value, name]
                  }
                />
                <Legend />
                <Bar 
                  dataKey="daysUntilEmpty" 
                  fill="#FF8042" 
                  name="Days Until Empty"
                />
                <Bar 
                  dataKey="currentQuantity" 
                  fill="#0088FE" 
                  name="Current Quantity"
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Detailed Category Cards */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {categoryData.map((category, index) => (
          <Grid item xs={12} sm={6} md={3} key={category.category}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" color="textSecondary">
                  {category.category}
                </Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {category.totalItems}
                </Typography>
                <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>
                  {new Intl.NumberFormat('en-PH', {
                    style: 'currency',
                    currency: 'PHP'
                  }).format(category.totalValue)}
                </Typography>
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {category.lowStockItems} low stock items
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default StockAnalytics;