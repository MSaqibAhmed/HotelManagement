import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const AnimatedSection = ({ children, className = '', animation = 'fade-up', delay = 0 }) => {
  const container = useRef(null);

  useGSAP(() => {
    const el = container.current;

    let fromVars = { opacity: 0 };
    if (animation === 'fade-up') {
      fromVars = { opacity: 0, y: 50 };
    } else if (animation === 'fade-in') {
      fromVars = { opacity: 0 };
    } else if (animation === 'slide-right') {
      fromVars = { opacity: 0, x: -50 };
    } else if (animation === 'slide-left') {
      fromVars = { opacity: 0, x: 50 };
    }

    gsap.fromTo(
      el,
      fromVars,
      {
        opacity: 1,
        y: 0,
        x: 0,
        duration: 1,
        delay: delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%', // Trigger when top of element is 85% down viewport
          toggleActions: 'play none none none',
        },
      }
    );
  }, { scope: container });

  return (
    <div ref={container} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
};

export default AnimatedSection;
