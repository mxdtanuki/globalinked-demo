import React from 'react';
import Header from './components/Header';
import Intro from './components/Intro';
import Officials from './components/Officials';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import './public-page.css';

export default function PublicPage() {
  return (
    <>
      <Header />
      <main>
        <Intro />
        <Officials />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
