import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout.tsx';
import ShiftsPage from './pages/ShiftsPage.tsx';
import SweetsPage from './pages/SweetsPage.tsx';
import BeansPage from './pages/BeansPage.tsx';
import SuppliesPage from './pages/SuppliesPage.tsx';
import InputPage from './pages/InputPage.tsx';

function App() {
  return (
    <Router>
      <div className="App">
        <Layout>
          <Routes>
            <Route path="/" element={<ShiftsPage />} />
            <Route path="/shifts" element={<ShiftsPage />} />
            <Route path="/inventory/sweets" element={<SweetsPage />} />
            <Route path="/inventory/beans" element={<BeansPage />} />
            <Route path="/inventory/supplies" element={<SuppliesPage />} />
            <Route path="/input" element={<InputPage />} />
          </Routes>
        </Layout>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
