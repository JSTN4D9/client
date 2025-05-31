import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  useFetchStocksQuery, 
  useUpdateStockMutation, 
  useDeleteStockMutation,
  useRecordStockChangeMutation
} from "../../services/api/stocksApi";
import DashboardLayout from "../../layouts/DashboardLayout";
import { ButtonsContainer } from "./StocksBase.styles";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

const StocksBase = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    data, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useFetchStocksQuery({
    page: 1,
    limit: 10,
  });
  
  const [updateStock] = useUpdateStockMutation();
  const [deleteStock] = useDeleteStockMutation();
  const [recordStockChange] = useRecordStockChangeMutation();
  const [selectedStock, setSelectedStock] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (location.state?.alert) {
      setAlert(location.state.alert);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (isError) {
      setAlert({
        severity: "error",
        message: error?.data?.message || "Failed to load stock items",
      });
    }
  }, [isError, error]);

  const handleEdit = (id) => {
    navigate(`/manage-stocks/edit/${id}`);
  };

  const handleOpenDialog = (stock) => {
    setSelectedStock(stock);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStock(null);
  };

  const handleDelete = async () => {
    if (selectedStock) {
      try {
        await deleteStock(selectedStock.id).unwrap();
        setOpenDialog(false);
        setAlert({
          severity: "success",
          message: "Stock item deleted successfully!",
        });
        refetch();
      } catch (error) {
        setAlert({
          severity: "error",
          message: error?.data?.message || "Failed to delete stock item",
        });
      }
    }
  };

  const handleQuantityChange = async (id, change) => {
    try {
      const currentStock = data.results.find(stock => stock.id === id);
      if (!currentStock) return;

      const newQuantity = currentStock.quantity + change;
      if (newQuantity < 0) return; // Prevent negative quantities

      const operation = change > 0 ? 'restock' : 'usage';
      
      // First record the change
      await recordStockChange({
        id,
        change: Math.abs(change),
        operation
      }).unwrap();

      // Then update the stock with the new absolute quantity
      await updateStock({
        id,
        quantity: newQuantity, // Set to the new calculated quantity
        type: currentStock.type,
        category: currentStock.category,
        price: currentStock.price
      }).unwrap();

      setAlert({
        severity: "success",
        message: `Item ${operation === 'restock' ? 'restocked' : 'used'} successfully. New quantity: ${newQuantity}`
      });

      refetch();
    } catch (error) {
      setAlert({
        severity: "error",
        message: error?.data?.message || "Failed to update quantity"
      });
    }
  };

  const columns = [
    { 
      field: "type",
      headerName: "Item Name", 
      width: 200 
    },
    { 
      field: "category", 
      headerName: "Category", 
      width: 150 
    },
    { 
      field: "price", 
      headerName: "Price", 
      width: 150,
      renderCell: (params) => (
        <Typography>₱{params.row.price.toFixed(2)}</Typography>
      )
    },
    { 
      field: "quantity", 
      headerName: "Quantity",
      width: 150,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              handleQuantityChange(params.row.id, -1); // Fixed: now properly decrements
            }}
            disabled={params.row.quantity <= 0}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          <Typography sx={{ mx: 2 }}>{params.row.quantity}</Typography>
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              handleQuantityChange(params.row.id, 1); // Increments
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      renderCell: (params) => (
        <Box>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleEdit(params.row.id)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={() => handleOpenDialog(params.row)}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {alert && (
        <Alert 
          severity={alert.severity}
          onClose={() => setAlert(null)}
          sx={{ mb: 2 }}
        >
          {alert.message}
        </Alert>
      )}

      <Typography variant="h4" gutterBottom>
        Manage Stock
      </Typography>
      
      <ButtonsContainer>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/manage-stocks/create")}
        >
          Add New Stock Item
        </Button>
      </ButtonsContainer>

      <Box sx={{ height: 400, width: "100%", mt: 2 }}>
        {isError ? (    
          <Alert severity="error" sx={{ mb: 2 }}>
            {error?.data?.message || "Failed to load stock items"}
            <Button onClick={() => refetch()} sx={{ ml: 2 }}>
              Retry
            </Button>
          </Alert>
        ) : (
          <DataGrid
            rows={data?.results || []}
            columns={columns}
            loading={isLoading}
            pageSize={data?.limit || 10}
            rowCount={data?.totalResults || 0}
            paginationMode="server"
            onPageChange={(newPage) => refetch({ page: newPage + 1 })}
            disableSelectionOnClick
            getRowId={(row) => row.id || Math.random().toString(36).substring(2, 9)}
          />
        )}
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Delete Stock Item</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the stock item{" "}
            <strong>{selectedStock?.type}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="secondary" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};

export default StocksBase;