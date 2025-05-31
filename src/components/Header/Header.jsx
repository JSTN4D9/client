// src/components/Header/Header.jsx
import TopBar from "../TopBar/TopBar";
import Navbar from "../NavBar/NavBar";
import { AppBar, Slide, useScrollTrigger, Button, Box } from "@mui/material";
import PropTypes from "prop-types";
import { useState } from "react";
import SignInModal from "../AuthModals/SignInModal";
import SignUpModal from "../AuthModals/SignUpModal";

function HideOnScroll(props) {
  const { children, window } = props;
  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
  });

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

HideOnScroll.propTypes = {
  children: PropTypes.element.isRequired,
  window: PropTypes.func,
};

export default function Header(props) {
  const [openSignIn, setOpenSignIn] = useState(false);
  const [openSignUp, setOpenSignUp] = useState(false);

  const handleOpenSignIn = () => {
    setOpenSignIn(true);
    setOpenSignUp(false);
  };

  const handleOpenSignUp = () => {
    setOpenSignUp(true);
    setOpenSignIn(false);
  };

  const handleCloseModals = () => {
    setOpenSignIn(false);
    setOpenSignUp(false);
  };

  return (
    <>
      <HideOnScroll {...props}>
        <AppBar position="sticky" color="default" elevation={4}>
          <TopBar />
          <Navbar 
            onLoginClick={handleOpenSignIn}
            onSignUpClick={handleOpenSignUp}
          />
        </AppBar>
      </HideOnScroll>

      <SignInModal
        open={openSignIn}
        onClose={handleCloseModals}
        onSwitchToSignUp={handleOpenSignUp}
      />
      <SignUpModal
        open={openSignUp}
        onClose={handleCloseModals}
        onSwitchToSignIn={handleOpenSignIn}
      />
    </>
  );
}