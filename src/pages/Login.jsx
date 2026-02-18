import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const fullEmail = `${username.toLowerCase().trim()}@lasville.it`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: fullEmail,
      password: password,
    });

    if (error) {
      setErrorMsg('Credenziali non valide o utente inesistente.');
      setLoading(false);
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="bg-[#0B1116] font-['Public_Sans'] text-white min-h-screen flex flex-col overflow-hidden relative selection:bg-[#D4842D] selection:text-white">
      
      <div className="absolute inset-0 z-0 bg-[#0a2948]/20 bg-cover bg-center">
        <div className="absolute inset-0 bg-[#07131f]/90 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a2948]/80 via-[#061421]/90 to-[#03080c]"></div>
        
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#0a2948]/40 rounded-full blur-[120px] pointer-events-none opacity-60"></div>
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#D4842D]/10 rounded-full blur-[100px] pointer-events-none mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8 w-full">
        <div className="w-full max-w-[480px] rounded-2xl overflow-hidden p-8 sm:p-10 flex flex-col gap-8 shadow-2xl relative border border-white/10"
             style={{
               background: 'rgba(10, 41, 72, 0.6)',
               backdropFilter: 'blur(16px)',
               WebkitBackdropFilter: 'blur(16px)'
             }}>
          
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-[#D4842D]/10 border border-[#D4842D]/30 flex items-center justify-center shadow-[0_0_15px_rgba(212,132,45,0.2)]">
              <span className="material-symbols-outlined text-[#D4842D] text-3xl" style={{fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48"}}>
                balance
              </span>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight text-white" style={{textShadow: '0 0 20px rgba(212, 132, 45, 0.5)'}}>
                ACCEDI AL PORTALE
              </h1>
              <p className="text-gray-400 font-medium text-sm uppercase tracking-widest">Portale Giustizia di LasVille</p>
            </div>
          </div>

          <form className="flex flex-col gap-5 w-full" onSubmit={handleLogin}>
            <div className="flex flex-col gap-2">
              <label className="text-gray-300 text-sm font-semibold tracking-wide">Nome Utente</label>
              <div className="relative flex items-center group">
                <span className="absolute left-4 flex items-center justify-center text-gray-500 group-focus-within:text-[#D4842D] transition-colors duration-300">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </span>
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Inserisci il tuo nome utente"
                  className="w-full h-12 pl-12 pr-4 rounded-lg bg-[#1a232e] border border-[#2d3b4a] text-white placeholder-gray-500 focus:border-[#D4842D] focus:ring-1 focus:ring-[#D4842D] focus:outline-none transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-gray-300 text-sm font-semibold tracking-wide">Password</label>
              <div className="relative flex items-center group">
                <span className="absolute left-4 flex items-center justify-center text-gray-500 group-focus-within:text-[#D4842D] transition-colors duration-300">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </span>
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Inserisci la tua password"
                  className="w-full h-12 pl-12 pr-12 rounded-lg bg-[#1a232e] border border-[#2d3b4a] text-white placeholder-gray-500 focus:border-[#D4842D] focus:ring-1 focus:ring-[#D4842D] focus:outline-none transition-all duration-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 rounded border-gray-600 bg-[#1a232e] text-[#D4842D] focus:ring-0 focus:ring-offset-0 transition-all checked:bg-[#D4842D]" 
                />
                <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors select-none">Ricordami</span>
              </label>
              <a href="#" className="text-sm text-[#D4842D] hover:text-white transition-colors font-medium">Password Dimenticata?</a>
            </div>

            {errorMsg && <p className="text-red-400 text-xs text-center font-medium">{errorMsg}</p>}

            <button 
              type="submit"
              disabled={loading}
              className="mt-4 w-full h-12 bg-[#0a2948] hover:bg-[#0e3a63] text-white rounded-lg font-bold tracking-wide uppercase transition-all duration-300 border border-[#0a2948] hover:border-[#D4842D]/50 flex items-center justify-center gap-2 group hover:shadow-[0_0_20px_rgba(212,132,45,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Verifica in corso...' : 'Accedi'}</span>
              {!loading && <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>}
            </button>
          </form>

          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4842D]/50 to-transparent opacity-50"></div>
        </div>

        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-gray-500 font-medium">
            © 2026 LasVille. Tutti i diritti riservati.<br/>
            Contenuto fittizio a scopo ludico (RP). Ogni riferimento a persone o fatti reali è puramente casuale e non inerente alla realtà.
          </p>
          <div className="flex gap-4 justify-center text-xs text-gray-600">
            <a href="#" className="hover:text-gray-400">Privacy</a>
            <span>•</span>
            <a href="#" className="hover:text-gray-400">Termini di Servizio</a>
            <span>•</span>
            <a href="#" className="hover:text-gray-400">Supporto</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;