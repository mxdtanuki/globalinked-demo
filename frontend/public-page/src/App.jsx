import React from 'react';
import Header from './components/Header';
import Intro from './components/Intro';
import Officials from './components/Officials';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import './index.css';

export default function App() {
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
