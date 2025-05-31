import { useEffect, useState, useMemo, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useMediaQuery,
  Badge,
  MenuItem,
  Select,
  FormControl,
  IconButton,
  Menu,
} from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useFetchAllAppointmentsQuery,
  useFetchAppointmentsByUserQuery,
  useDeleteAppointmentMutation,
  useUpdateAppointmentMutation,
} from "../../services/api/appointmentsApi";
import { useFetchServiceByIdQuery } from "../../services/api/servicesApi";
import FadeAlert from "../../components/FadeAlert/FadeAlert";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import AppointmentDetailsModal from "./AppointmentDetailsModal";

const AppointmentsBase = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id?.toString();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("md"));

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 9,
  });
  const rowCountRef = useRef(0);
  const [alert, setAlert] = useState(location.state?.alert || null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [statusChangeDialog, setStatusChangeDialog] = useState({
    open: false,
    appointmentId: null,
    newStatus: null,
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentAppointment, setCurrentAppointment] = useState(null);

  const [deleteAppointment] = useDeleteAppointmentMutation();
  const [updateAppointment] = useUpdateAppointmentMutation();

  useEffect(() => {
    if (location.state?.alert) {
      setAlert(location.state.alert);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  let appointmentsQuery;

  switch (user?.role) {
    case "admin":
      appointmentsQuery = useFetchAllAppointmentsQuery({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
      });
      break;
    case "user":
      appointmentsQuery = useFetchAppointmentsByUserQuery({
        userId,
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
      });
      break;
    default:
      appointmentsQuery = {
        data: [],
        isLoading: false,
        isError: true,
        refetch: () => {},
      };
      break;
  }

  const {
    data: appointmentsData,
    isLoading,
    isError,
    refetch,
  } = appointmentsQuery;

  const appointments = useMemo(
    () =>
      (appointmentsData?.results || [])
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [appointmentsData]
  );

  const rowCount = useMemo(() => {
    if (appointmentsData?.totalResults !== undefined) {
      rowCountRef.current = appointmentsData.totalResults;
    }
    return rowCountRef.current;
  }, [appointmentsData?.totalResults]);

  const handleMenuOpen = (event, appointment) => {
    setAnchorEl(event.currentTarget);
    setCurrentAppointment(appointment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setCurrentAppointment(null);
  };

  const handleStatusChange = (newStatus) => {
    if (currentAppointment) {
      setStatusChangeDialog({
        open: true,
        appointmentId: currentAppointment.id,
        newStatus,
      });
      handleMenuClose();
    }
  };

  const confirmStatusChange = async () => {
    try {
      await updateAppointment({
        id: statusChangeDialog.appointmentId,
        status: statusChangeDialog.newStatus,
      }).unwrap();
      refetch();
      setStatusChangeDialog({ open: false, appointmentId: null, newStatus: null });
    } catch (error) {
      setAlert({
        message: `Error updating status: ${error.message}`,
        severity: "error",
      });
    }
  };

  const cancelStatusChange = () => {
    setStatusChangeDialog({ open: false, appointmentId: null, newStatus: null });
  };

  const handleEdit = (id) => {
    navigate(`/appointments/edit/${id}`);
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setOpenDetailsModal(true);
  };

  const handleOpenDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAppointment(null);
  };

  const handleAlertClose = () => {
    setAlert(null);
  };

  const handleDelete = async () => {
    if (selectedAppointment) {
      try {
        await deleteAppointment(selectedAppointment.id).unwrap();
        setOpenDialog(false);
        refetch();
        setAlert({
          message: "Appointment deleted successfully!",
          severity: "success",
        });
      } catch (error) {
        setAlert({
          message: `Error deleting appointment: ${error.message}`,
          severity: "error",
        });
      }
    }
  };

  const handleCancel = async () => {
    if (selectedAppointment) {
      try {
        await updateAppointment({
          id: selectedAppointment.id,
          status: "Cancelled",
        }).unwrap();
        setOpenDialog(false);
        refetch();
        setAlert({
          message: "Appointment cancelled successfully!",
          severity: "success",
        });
      } catch (error) {
        setAlert({
          message: `Error cancelling appointment: ${error.message}`,
          severity: "error",
        });
      }
    }
  };

  const columns = [
    {
      field: "fullName",
      headerName: "Full Name",
      width: 200,
      renderCell: (params) => `${params.row.firstName} ${params.row.lastName}`,
    },
    {
      field: "serviceType",
      headerName: "Service",
      width: 200,
      renderCell: (params) => {
        const { data: service } = useFetchServiceByIdQuery(params.row.serviceType);
        return service ? service.title : "Loading...";
      },
    },
    {
      field: "price",
      headerName: "Price",
      width: 100,
      renderCell: (params) => {
        const { data: service } = useFetchServiceByIdQuery(params.row.serviceType);
        return service ? `₱${service.price}` : "Loading...";
      },
    },
    {
      field: "appointmentDateTime",
      headerName: "Date & Time",
      width: 150,
      renderCell: (params) =>
        dayjs(params.row.appointmentDateTime).format("DD/MM/YYYY HH:mm"),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Badge
          badgeContent={params.row.status}
          color={
            params.row.status === "Upcoming" ? "primary" : 
            params.row.status === "Completed" ? "success" : "secondary"
          }
          sx={{ padding: "5px 20px" }}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          {params.row.status === "Completed" ? (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => handleViewDetails(params.row)}
              sx={{ mr: 1 }}
            >
              View
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => handleEdit(params.row.id)}
              sx={{ mr: 1 }}
              disabled={
                params.row.status === "Cancelled" || 
                params.row.status === "No Arrival" ||
                params.row.status === "Completed"
              }
            >
              Edit
            </Button>
          )}
          
          <IconButton
            aria-label="more"
            aria-controls="long-menu"
            aria-haspopup="true"
            onClick={(e) => handleMenuOpen(e, params.row)}
          >
            <MoreVertIcon />
          </IconButton>
          
          <Menu
            id="long-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl && currentAppointment?.id === params.row.id)}
            onClose={handleMenuClose}
          >
            {user?.role === "admin" && params.row.status !== "Completed" && [
              <MenuItem key="complete" onClick={() => handleStatusChange("Completed")}>
                Mark as Completed
              </MenuItem>,
              <MenuItem key="cancel" onClick={() => handleStatusChange("Cancelled")}>
                Mark as Cancelled
              </MenuItem>,
              <MenuItem key="no-arrival" onClick={() => handleStatusChange("No Arrival")}>
                Mark as No Arrival
              </MenuItem>,
              <MenuItem key="delete" onClick={() => {
                handleMenuClose();
                handleOpenDialog(params.row);
              }}>
                Delete Appointment
              </MenuItem>
            ]}
            {(user?.role === "user" && 
              (params.row.status === "Upcoming" || params.row.status === "Rescheduled")) && (
              <MenuItem key="user-cancel" onClick={() => {
                handleMenuClose();
                handleOpenDialog(params.row);
              }}>
                Cancel Appointment
              </MenuItem>
            )}
          </Menu>
        </Box>
      ),
    },
  ];

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (isError) {
    return <Typography>Error loading appointments</Typography>;
  }

  return (
    <DashboardLayout>
      {alert && (
        <FadeAlert
          message={alert.message}
          severity={alert.severity}
          duration={3000}
          onClose={handleAlertClose}
        />
      )}
      <Typography variant="h4" gutterBottom>
        {user?.role === "admin" ? "Manage All Appointments" : "My Appointments"}
      </Typography>

      <Box sx={{ height: 650, width: "100%" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: isSmallScreen ? "flex-start" : "flex-end",
            mb: 2,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/appointments/create")}
          >
            Create New Appointment
          </Button>
        </Box>
        <DataGrid
          rows={appointments}
          columns={columns}
          rowCount={rowCount}
          loading={isLoading}
          paginationMode="server"
          pageSizeOptions={[9, 20, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          disableSelectionOnClick
        />
        
        {/* Delete/Cancel Confirmation Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {user?.role === "admin"
              ? "Delete Appointment"
              : "Cancel Appointment"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {user?.role === "admin"
                ? `Are you sure you want to delete the appointment for ${selectedAppointment?.firstName} ${selectedAppointment?.lastName}?`
                : `Are you sure you want to cancel the appointment for ${selectedAppointment?.firstName} ${selectedAppointment?.lastName}?`}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="primary">
              Cancel
            </Button>
            <Button
              onClick={user?.role === "admin" ? handleDelete : handleCancel}
              color="secondary"
              autoFocus
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Status Change Confirmation Dialog */}
        <Dialog
          open={statusChangeDialog.open}
          onClose={cancelStatusChange}
          aria-labelledby="status-change-dialog-title"
        >
          <DialogTitle id="status-change-dialog-title">
            Confirm Status Change
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to change this appointment's status to "{statusChangeDialog.newStatus}"?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelStatusChange} color="primary">
              Cancel
            </Button>
            <Button onClick={confirmStatusChange} color="secondary" autoFocus>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
        
        <AppointmentDetailsModal
          open={openDetailsModal}
          onClose={() => setOpenDetailsModal(false)}
          appointment={selectedAppointment}
        />
      </Box>
    </DashboardLayout>
  );
};

export default AppointmentsBase;