import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AppProviders } from '../data';
import AppContent from './AppContent';

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppProviders>
          <AppContent />
        </AppProviders>
      </BrowserRouter>
    </HelmetProvider>
  );
}
