import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(advancedFormat);
dayjs.extend(weekOfYear);

export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const calculateStats = (dateRange, timeRange, customDate, customStartDate, customEndDate, appointments) => {
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

  // Hourly breakdown (for day view)
  const hourlyData = {};
  if (timeRange === 'day') {
    for (let hour = 0; hour < 24; hour++) {
      hourlyData[`${hour}:00`] = 0;
    }
    filteredAppointments.forEach(appointment => {
      const hour = dayjs(appointment.appointmentDateTime).hour();
      const hourKey = `${hour}:00`;
      hourlyData[hourKey] = (hourlyData[hourKey] || 0) + 1;
    });
  }

  // Daily breakdown (for week/month/year views)
  const dailyData = {};
  const weeklyData = {};
  const monthlyData = {};

  let currentDate = startDate;
  while (currentDate.isSameOrBefore(endDate)) {
    const dayKey = currentDate.format('YYYY-MM-DD');
    const weekKey = `Week ${currentDate.week()}`;
    const monthKey = currentDate.format('MMMM YYYY');
    
    dailyData[dayKey] = 0;
    weeklyData[weekKey] = 0;
    monthlyData[monthKey] = 0;
    
    currentDate = currentDate.add(1, 'day');
  }

  filteredAppointments.forEach(appointment => {
    const appointmentDate = dayjs(appointment.appointmentDateTime);
    const dayKey = appointmentDate.format('YYYY-MM-DD');
    const weekKey = `Week ${appointmentDate.week()}`;
    const monthKey = appointmentDate.format('MMMM YYYY');
    
    if (dailyData[dayKey] !== undefined) dailyData[dayKey]++;
    if (weeklyData[weekKey] !== undefined) weeklyData[weekKey]++;
    if (monthlyData[monthKey] !== undefined) monthlyData[monthKey]++;
  });

  // Convert to array for charts
  const hourlyChartData = Object.keys(hourlyData).map(hour => ({
    hour,
    count: hourlyData[hour]
  }));

  const dailyChartData = Object.keys(dailyData).map(date => ({
    date,
    count: dailyData[date]
  }));

  const weeklyChartData = Object.keys(weeklyData).map(week => ({
    week,
    count: weeklyData[week]
  }));

  const monthlyChartData = Object.keys(monthlyData).map(month => ({
    month,
    count: monthlyData[month]
  }));

  // Calculate averages for predictive analytics
  const totalDays = endDate.diff(startDate, 'day') + 1;
  const avgDaily = filteredAppointments.length / totalDays;
  const predictedRemaining = avgDaily * (endDate.diff(dayjs(), 'day'));

  return {
    total: filteredAppointments.length,
    statusCounts,
    hourlyChartData,
    dailyChartData,
    weeklyChartData,
    monthlyChartData,
    avgDaily: Math.round(avgDaily * 10) / 10,
    predictedTotal: Math.round((filteredAppointments.length + predictedRemaining) * 10) / 10,
    startDate,
    endDate
  };
};