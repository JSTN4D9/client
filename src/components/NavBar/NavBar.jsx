import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  Modal,
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
import SignIn from "../../routes/auth/SignIn";
import SignUp from "../../routes/auth/SignUp";
import ForgotPassword from "../../routes/auth/ForgotPassword";
import { Tab, Tabs } from "@mui/material";

const AuthModal = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState('signin');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setShowForgotPassword(false);
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
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
};

export default function Navbar() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const handleNavClick = useHandleSectionLink();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

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
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    if (location.pathname === "/" && location.state?.sectionId) {
      scroller.scrollTo(location.state.sectionId, {
        duration: 350,
        delay: 0,
        smooth: "easeInOutQuart",
      });
    }
  }, [location]);

  const drawerContent = (
    <Box sx={{ width: "100%" }}>
      <List>
        <ListItem button component={Link} to="/" onClick={handleHomeClick}>
          <StyledListItemText primary="Home" />
        </ListItem>
        <ListItem button component={Link} to="/about">
          <StyledListItemText primary="About Us" />
        </ListItem>
        <ListItem button component={Link} to="/staffs">
          <StyledListItemText primary="Staffs" />
        </ListItem>
        <ListItem button onClick={() => handleNavClick("services-section")}>
          <StyledListItemText primary="Services" />
        </ListItem>
        <ListItem button component={Link} to="/contact">
          <StyledListItemText primary="Contact Us" />
        </ListItem>
        {user ? (
          <>
            <ListItem button component={Link} to={getDashboardRoute()}>
              <StyledListItemText primary="Dashboard" />
            </ListItem>
            <ListItem button onClick={handleLogout}>
              <StyledListItemText primary="Sign Out" />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem button onClick={() => setAuthModalOpen(true)}>
              <StyledListItemText primary="Sign In" />
            </ListItem>
            <ListItem button onClick={() => setAuthModalOpen(true)}>
              <StyledListItemText primary="Sign Up" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <NavBarContainer position="static">
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid item>
                {!isSmallScreen && (
                  <>
                    <NavLink onClick={handleHomeClick}>Home</NavLink>
                    <Link to="/about">
                      <NavLink>About Us</NavLink>
                    </Link>
                    <Link to="/staffs">
                      <NavLink>Staffs</NavLink>
                    </Link>
                    <NavLink onClick={() => handleNavClick("services-section")}>
                      Services
                    </NavLink>
                    <Link to="/contact">
                      <NavLink>Contact us</NavLink>
                    </Link>
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
                        <Link to={getDashboardRoute()}>
                          <NavLink>Dashboard</NavLink>
                        </Link>
                        <NavLink onClick={handleLogout}>Sign Out</NavLink>
                      </>
                    ) : (
                      <>
                        <NavLink onClick={() => setAuthModalOpen(true)}>
                          Sign In
                        </NavLink>
                        <NavLink onClick={() => setAuthModalOpen(true)}>
                          Sign Up
                        </NavLink>
                      </>
                    )}
                  </>
                )}
                <NavLink
                  variant="outlined"
                  onClick={() => handleNavClick("booking-section")}
                >
                  Book Now
                </NavLink>
              </Grid>
            </Grid>
          </Toolbar>
        </Container>
      </NavBarContainer>
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}