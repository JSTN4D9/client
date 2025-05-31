
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AuthModal from "../components/AuthModal/AuthModal";
import StaffsSection from "../sections/StaffsSection/StaffsSection";
import BookAppointmentSection from "../sections/BookAppointmentSection/BookAppointmentSection";
import BookNowCTASection from "../sections/BookNowCTASection/BookNowCTASection";
import Footer from "../components/Footer/Footer";
import Header from "../components/Header/Header";
import HeroSection from "../sections/HeroSection/HeroSection";
import ServicesSection from "../sections/ServicesSection/ServicesSection";
import TestimonialsSection from "../sections/TestimonialsSection/TestimonialsSection";

export default function HomePage() {
  const location = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    if (location.state?.fromAuth) {
      setAuthModalOpen(true);
    }
  }, [location]);

  return (
    <>
      <Header />
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <HeroSection />
      <BookNowCTASection />
      <ServicesSection />
      <StaffsSection />
      <TestimonialsSection />
      <BookAppointmentSection />
      <Footer />
    </>
  );
}
