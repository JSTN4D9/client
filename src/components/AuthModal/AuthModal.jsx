import { useState } from "react";
import { Modal, Box, Tabs, Tab } from "@mui/material";
import SignIn from "../../routes/auth/SignIn";
import SignUp from "../../routes/auth/SignUp";
import ForgotPassword from "../../routes/auth/ForgotPassword";

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

export default function AuthModal({ open, onClose }) {
  const [activeTab, setActiveTab] = useState('signin');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setShowForgotPassword(false);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        {!showForgotPassword ? (
          <>
            <Tabs value={activeTab} onChange={handleTabChange} centered>
              <Tab label="Sign In" value="signin" />
              <Tab label="Sign Up" value="signup" />
            </Tabs>
            <Box sx={{ mt: 2 }}>
              {activeTab === 'signin' ? (
                <SignIn 
                  onSuccess={onClose} 
                  onForgotPassword={() => setShowForgotPassword(true)} 
                />
              ) : (
                <SignUp onSuccess={onClose} />
              )}
            </Box>
          </>
        ) : (
          <ForgotPassword 
            onSuccess={() => setShowForgotPassword(false)} 
            />
        )}
      </Box>
    </Modal>
  );
}