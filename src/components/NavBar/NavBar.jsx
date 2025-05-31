import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHandleSectionLink } from "../../utils/navigationUtils";
import { useLogoutUserMutation } from "../../services/api/authApi";
import { logout } from "../../services/store/authSlice";
import { scroller } from "react-scroll";
import {
  useTheme,
  useMediaQuery,
  Toolbar,
  Container,
  Grid,
  Box,
  ListItem,
  List,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import {
  NavBarContainer,
  NavLink,
  StyledIconButton,
  StyledDrawer,
  StyledListItemText,
} from "./NavBar.styles";
import { getRefreshTokenFromStorage } from "../../utils/storage";
import SignInModal from "../AuthModals/SignInModal";
import SignUpModal from "../AuthModals/SignUpModal";
import ForgotPasswordModal from "../AuthModals/ForgotPasswordModal";

export default function Navbar() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const handleNavClick = useHandleSectionLink();

  const [logoutUser] = useLogoutUserMutation();
  const handleLogout = async () => {
    const refreshToken = getRefreshTokenFromStorage();
    if (refreshToken) {
      try {
        await logoutUser(refreshToken).unwrap();
        dispatch(logout());
      } catch (err) {
        console.error("Failed to logout:", err);
      }
    }
  };

  const user = useSelector((state) => state.auth.user);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const getDashboardRoute = () => {
    if (user?.role === "admin") {
      return "/admin/dashboard";
    } else if (user?.role === "user") {
      return "/user/dashboard";
    } else if (user?.role === "staff") {
      return "/staff/dashboard";
    }
    return "/";
  };

  const handleHomeClick = () => {
    if (window.location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.location.href = "/";
    }
  };

  const drawerContent = (
    <Box sx={{ width: "100%" }}>
      <List>
        <ListItem button onClick={handleHomeClick}>
          <StyledListItemText primary="Home" />
        </ListItem>
        <ListItem button component="a" href="/about">
          <StyledListItemText primary="About Us" />
        </ListItem>
        <ListItem button component="a" href="/staffs">
          <StyledListItemText primary="Staffs" />
        </ListItem>
        <ListItem button onClick={() => handleNavClick("services-section")}>
          <StyledListItemText primary="Services" />
        </ListItem>
        <ListItem button component="a" href="/contact">
          <StyledListItemText primary="Contact Us" />
        </ListItem>
        {user ? (
          <>
            <ListItem button component="a" href={getDashboardRoute()}>
              <StyledListItemText primary="Dashboard" />
            </ListItem>
            <ListItem button onClick={handleLogout}>
              <StyledListItemText primary="Sign Out" />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem button onClick={() => setSignInOpen(true)}>
              <StyledListItemText primary="Sign In" />
            </ListItem>
            <ListItem button onClick={() => setSignUpOpen(true)}>
              <StyledListItemText primary="Sign Up" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <NavBarContainer position="static">
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              {!isSmallScreen && (
                <>
                  <NavLink onClick={handleHomeClick}>Home</NavLink>
                  <NavLink href="/about">About Us</NavLink>
                  <NavLink href="/staffs">Staffs</NavLink>
                  <NavLink onClick={() => handleNavClick("services-section")}>
                    Services
                  </NavLink>
                  <NavLink href="/contact">Contact us</NavLink>
                </>
              )}
              {isSmallScreen && (
                <>
                  <StyledIconButton
                    edge="start"
                    aria-label="menu"
                    onClick={handleDrawerToggle}
                  >
                    <MenuIcon />
                  </StyledIconButton>
                  <StyledDrawer
                    anchor="left"
                    open={drawerOpen}
                    onClose={handleDrawerToggle}
                  >
                    {drawerContent}
                  </StyledDrawer>
                </>
              )}
            </Grid>
            <Grid item>
              {!isSmallScreen && (
                <>
                  {user ? (
                    <>
                      <NavLink href={getDashboardRoute()}>Dashboard</NavLink>
                      <NavLink onClick={handleLogout}>Sign Out</NavLink>
                    </>
                  ) : (
                    <>
                      <Button
                        color="inherit"
                        onClick={() => setSignInOpen(true)}
                      >
                        Sign In
                      </Button>
                      <Button
                        color="inherit"
                        onClick={() => setSignUpOpen(true)}
                      >
                        Sign Up
                      </Button>
                    </>
                  )}
                </>
              )}
              <Button
                variant="outlined"
                onClick={() => handleNavClick("booking-section")}
                sx={{ ml: 2 }}
              >
                Book Now
              </Button>
            </Grid>
          </Grid>
        </Toolbar>
      </Container>

      {/* Auth Modals */}
      <SignInModal
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        onSwitchToSignUp={() => {
          setSignInOpen(false);
          setSignUpOpen(true);
        }}
        onSwitchToForgotPassword={() => {
          setSignInOpen(false);
          setForgotPasswordOpen(true);
        }}
      />
      <SignUpModal
        open={signUpOpen}
        onClose={() => setSignUpOpen(false)}
        onSwitchToSignIn={() => {
          setSignUpOpen(false);
          setSignInOpen(true);
        }}
      />
      <ForgotPasswordModal
        open={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        onSwitchToSignIn={() => {
          setForgotPasswordOpen(false);
          setSignInOpen(true);
        }}
      />
    </NavBarContainer>
  );
}