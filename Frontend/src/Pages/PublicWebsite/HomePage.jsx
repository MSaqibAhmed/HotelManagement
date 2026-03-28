import React from "react";
import Hero from "../../Components/PublicWebsite/Hero";
import About from "../../Components/PublicWebsite/About";
import FeatureSection from "../../Components/PublicWebsite/FeatureSection";
import ExploreRooms from "../../Components/PublicWebsite/ExploreRooms";
import Amenities from "../../Components/PublicWebsite/Amenities";
import Testimonials from "../../Components/PublicWebsite/Testimonials";
import FAQ from "../../Components/PublicWebsite/FAQ";

import AnimatedSection from "../../Components/AnimatedSection";

const HomePage = () => (
  <>
    <Hero />
    <AnimatedSection animation="fade-up">
      <FeatureSection />
    </AnimatedSection>
    <AnimatedSection animation="fade-up" delay={0.2}>
      <ExploreRooms />
    </AnimatedSection>
    <AnimatedSection animation="slide-left" delay={0.2}>
      <About />
    </AnimatedSection>
    <AnimatedSection animation="slide-right" delay={0.2}>
      <Amenities />
    </AnimatedSection>
    <AnimatedSection animation="fade-up" delay={0.2}>
      <Testimonials />
    </AnimatedSection>
    <AnimatedSection animation="fade-up" delay={0.2}>
      <FAQ />
    </AnimatedSection>
  </>
);

export default HomePage;
