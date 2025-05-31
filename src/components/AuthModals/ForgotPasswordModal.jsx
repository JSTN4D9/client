// client/src/components/AuthModals/ForgotPasswordModal.jsx
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  TextField,
  Button,
  Typography,
  Alert,
  Box,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useForgotPasswordMutation } from "../../services/api/authApi";

export default function ForgotPasswordModal({ open, onClose, onSwitchToSignIn }) {
  const { control, handleSubmit } = useForm();
  const [alert, setAlert] = useState(null);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const onSubmit = async (data) => {
    try {
      await forgotPassword(data.email).unwrap();
      setAlert({
        type: "success",
        message: "Password reset link sent to your email.",
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: error.data?.message || "Failed to send reset link.",
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Forgot Password
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          {alert && (
            <Alert sx={{ width: "100%", mb: 2 }} severity={alert.type}>
              {alert.message}
            </Alert>
          )}
          <Controller
            name="email"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                label="Email"
                type="email"
                fullWidth
                required
                margin="normal"
              />
            )}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 1 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <CircularProgress size="1.5rem" color="inherit" />
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", p: 2 }}>
        <Button onClick={onSwitchToSignIn} color="primary">
          Back to Sign In
        </Button>
      </DialogActions>
    </Dialog>
  );
}