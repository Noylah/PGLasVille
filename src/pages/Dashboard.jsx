import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import GestioneUtenti from './GestioneUtenti';
import GestioneDocumenti from './GestioneDocumenti';
import AssegnazioneProcedimenti from './AssegnazioneProcedimenti';
import GestioneProcedimenti from './GestioneProcedimenti';
import GestioneDipendenti from './GestioneDipendenti';

export const getRankTitle = (grado, funzione) => {
  if (grado === 11) return "Procuratore Generale";
  if (grado === 10) return "Procuratore Vicario";
  if (funzione === 'requirente') {
    if (grado === 9) return "Procuratore Aggiunto";
    if (grado === 8) return "Procuratore Capo";
    if (grado === 7) return "Procuratore Coordinatore";
    if (grado === 6) return "Procuratore Superiore";
    if (grado === 5) return "Procuratore";
    if (grado === 4) return "Sostituto Procuratore";
  }
  if (funzione === 'giudicante') {
    if (grado === 9) return "Presidente Corte d'Appello";
    if (grado === 8) return "Vice Pres. Corte d'Appello";
    if (grado === 7) return "Giudice Coordinatore CdA";
    if (grado === 6) return "Giudice Superiore CdA";
    if (grado === 5) return "Giudice Corte d'Appello";
    if (grado === 4) return "Giudice Ausiliario CdA";
  }
  if (grado === 3) return "Magistrato Capo";
  if (grado === 2) return "Magistrato Togato";
  if (grado === 1) return "Magistrato Ordinario";
  if (grado === 0) return "Magistrato Tirocinante";
  return "Cittadino";
};

const Dashboard = () => {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const rankTitle = getRankTitle(profile?.grado_gerarchico, profile?.funzione);

  const fetchNotifications = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    if (data) setNotifications(data);
  };

  const handleOpenNotifications = async () => {
    const nextState = !showNotif;
    setShowNotif(nextState);

    if (nextState && profile?.id) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);

      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    const channel = supabase
      .channel('notif-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile?.id}` },
        () => fetchNotifications()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  return (
    <div className="flex h-screen w-full bg-[#111921] text-slate-100 font-sans overflow-hidden">
      <aside className="w-72 flex-shrink-0 flex flex-col border-r border-slate-700/50 bg-[#0a2948] z-20">
        <div className="h-20 flex items-center px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-cyan-400">
              <span className="material-symbols-outlined">balance</span>
            </div>
            <div>
              <h1 className="text-white text-sm font-bold tracking-wide uppercase">Portale Giustizia</h1>
              <p className="text-slate-400 text-[9px] uppercase">Repubblica di LasVille</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
          <Section title="Generale">
            <NavItem 
              icon="dashboard" 
              label="Dashboard" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
            />
          </Section>

          {profile?.grado_gerarchico >= 11 && (
            <Section title="Amministrazione">
              <NavItem 
                icon="admin_panel_settings" 
                label="Gestione Utenti" 
                color="text-cyan-400" 
                active={activeTab === 'gestione_utenti'} 
                onClick={() => setActiveTab('gestione_utenti')} 
              />
            </Section>
          )}

          {profile?.grado_gerarchico >= 8 && (
            <Section title="Consiglio Superiore della Magistratura">
              <NavItem 
                icon="groups" 
                label="Gestione Magistratura" 
                active={activeTab === 'gestione_dipendenti'} 
                onClick={() => setActiveTab('gestione_dipendenti')} 
              />
              <NavItem 
                icon="assignment_ind" 
                label="Assegnazione Procedimenti" 
                active={activeTab === 'assegnazione_procedimenti'} 
                onClick={() => setActiveTab('assegnazione_procedimenti')} 
              />
              <NavItem 
                icon="gavel" 
                label="Gestione Procedimenti" 
                active={activeTab === 'gestione_procedimenti'} 
                onClick={() => setActiveTab('gestione_procedimenti')} 
              />
            </Section>
          )}

          {(profile?.grado_gerarchico >= 8 || profile?.ruoli_extra?.includes('GAM')) && (
            <Section title="Gestione Archivi Magistratura">
              <NavItem 
                icon="inventory_2" 
                label="Gestione Documenti" 
                active={activeTab === 'gestione_documenti'} 
                onClick={() => setActiveTab('gestione_documenti')} 
              />
            </Section>
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={signOut} className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-slate-400 hover:text-red-400 transition-all cursor-pointer group">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm font-medium">Esci</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full bg-[#161b22] overflow-hidden">
        <header className="h-20 bg-[#1a2632] border-b border-slate-700/50 flex items-center justify-between px-8 shrink-0">
          <div className="text-slate-400 text-sm font-medium tracking-widest uppercase">
            Gestionale Ufficiale di Giustizia
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={handleOpenNotifications}
                className="p-2 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer relative"
              >
                <span className="material-symbols-outlined">notifications</span>
                {notifications.some(n => !n.is_read) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 mt-3 w-80 bg-[#1a2632] border border-slate-700 shadow-2xl rounded-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-white">Notifiche</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-6 text-center text-xs text-slate-500 italic">Nessuna notifica</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-4 border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                          <p className="text-xs font-bold text-cyan-400 mb-1">{n.title}</p>
                          <p className="text-[11px] text-slate-300 leading-tight">{n.message}</p>
                          <p className="text-[9px] text-slate-500 mt-2 font-mono">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 border-l border-slate-700/50 pl-6">
              <div className="text-right">
                <p className="text-sm font-bold text-white leading-tight">{profile?.username}</p>
                <p className="text-[10px] text-cyan-400 font-bold uppercase">{rankTitle}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-cyan-900 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400">
                {profile?.username?.[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'dashboard' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-[#1a2632] border border-slate-700/50 rounded-2xl p-10 text-center shadow-2xl">
                <h2 className="text-3xl font-black text-white mb-2 italic uppercase">Benvenuto Operatore</h2>
                <p className="text-slate-500 text-sm">Seleziona un modulo operativo dalla barra laterale per iniziare.</p>
              </div>
            </div>
          )}

          {activeTab === 'gestione_utenti' && <GestioneUtenti />}
          {activeTab === 'gestione_documenti' && <GestioneDocumenti userProfile={profile} />}
          {activeTab === 'assegnazione_procedimenti' && <AssegnazioneProcedimenti userProfile={profile} />}
          {activeTab === 'gestione_procedimenti' && <GestioneProcedimenti userProfile={profile} />}
          {activeTab === 'gestione_dipendenti' && <GestioneDipendenti />}
        </div>
      </main>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="mb-4">
    <h3 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{title}</h3>
    <div className="space-y-1">{children}</div>
  </div>
);

const NavItem = ({ icon, label, active = false, color = "", onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
      active ? 'bg-white/10 text-cyan-400 border-l-4 border-cyan-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <span className={`material-symbols-outlined ${color}`}>{icon}</span>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

export default Dashboard;