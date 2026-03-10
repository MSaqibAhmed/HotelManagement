import React from "react";
import Hero from "../../Components/PublicWebsite/Hero";
import About from "../../Components/PublicWebsite/About";
import FeatureSection from "../../Components/PublicWebsite/FeatureSection";
import ExploreRooms from "../../Components/PublicWebsite/ExploreRooms";
import Amenities from "../../Components/PublicWebsite/Amenities";
import Testimonials from "../../Components/PublicWebsite/Testimonials";
import FAQ from "../../Components/PublicWebsite/FAQ";

const HomePage = () => (
  <>
    <Hero />
    <FeatureSection />
    <ExploreRooms />
    <About />
    <Amenities />
    <Testimonials />
    <FAQ />
  </>
);

export default HomePage;
