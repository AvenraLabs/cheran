import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import CheranIrrigationPage from './pages/CheranIrrigationPage';
import CheranPlastPage from './pages/CheranPlastPage';
import SubsidyGuidePage from './pages/SubsidyGuidePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ProductsPage from './pages/ProductsPage';

// Clean placeholder component for upcoming pages in the sitemap
function PlaceholderPage({ title, taTitle, description }) {
  return (
    <div className="w-full bg-paper-50 min-h-[50vh] py-16 px-4 sm:px-6 lg:px-10 flex flex-col items-center justify-center text-center">
      <span className="text-xs uppercase font-mono font-bold tracking-widest text-forest-700 bg-paper-100 px-3 py-1 rounded-full border border-line-200 mb-4">
        Cheran Group • Official Division
      </span>
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest-900 mb-2">
        {title}
      </h1>
      <p className="text-sm font-medium text-forest-700 mb-4">
        {taTitle}
      </p>
      <p className="text-sm text-steel-600 max-w-lg mb-8 leading-relaxed">
        {description || 'This section is being synchronized with the next design module. For technical specifications or direct factory orders, please connect with our engineers.'}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <a
          href="/cheran-irrigation"
          className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-900 text-paper-50 px-6 py-3 rounded text-sm font-semibold transition-colors"
        >
          <span>Explore Micro-Irrigation Division</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </a>
        <a
          href="tel:18004251595"
          className="inline-flex items-center gap-2 bg-paper-100 hover:bg-surface-container-high text-forest-900 px-6 py-3 rounded text-sm font-semibold border border-line-200 transition-colors"
        >
          <span className="material-symbols-outlined text-sun-500 text-lg">call</span>
          <span>Toll-Free 1800 425 1595</span>
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-paper-50 text-ink font-sans selection:bg-forest-700 selection:text-paper-50">
      {/* Sticky Header with logo, nav, bilingual switcher, toll-free CTA */}
      <Header />

      {/* Main Content View */}
      <main className="flex-1 w-full pt-20">
        <Routes>
          {/* Main Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/cheran-irrigation" element={<CheranIrrigationPage />} />

          {/* Additional Sitemap Pages */}
          <Route path="/cheran-plast" element={<CheranPlastPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/subsidy-guide" element={<SubsidyGuidePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/certifications" element={<Navigate to="/about" replace />} />
          <Route path="/contact" element={<ContactPage />} />
          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Persistent Industrial Footer */}
      <Footer />
    </div>
  );
}
