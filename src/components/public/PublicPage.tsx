import Navbar from "./Navbar";
import Hero from "./Hero";
import BookingCTA from "./BookingCTA";
import Experience from "./Experience";
import Stations from "./Stations";
import Games from "./Games";
import SimRacing from "./SimRacing";
import VRComingSoon from "./VRComingSoon";
import Pricing from "./Pricing";
import BookingForm from "./BookingForm";
import Footer from "./Footer";

export default function PublicPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <BookingCTA />
        <Experience />
        <Stations />
        <Games />
        <SimRacing />
        <VRComingSoon />
        <Pricing />
        <BookingForm />
      </main>
      <Footer />
    </>
  );
}
