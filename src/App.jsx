import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Import delle pagine
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Pagina di accesso iniziale */}
          <Route path="/" element={<Login />} />

          {/* Area protetta: accessibile solo se loggati */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Rotte specifiche per permessi (Esempi futuri) */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute minGrado={11}>
                {/* Qui andrà il componente AdminPanel quando lo creeremo */}
                <div className="text-white p-20">Area Amministrativa Riservata</div>
              </ProtectedRoute>
            } 
          />

          {/* Redirect di sicurezza: se l'utente scrive un URL a caso, torna al login o dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;