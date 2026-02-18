import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { getRankTitle } from './Dashboard';

const sendNotification = async (userId, title, message) => {
  await supabase.from('notifications').insert([
    {
      user_id: userId,
      title: title,
      message: message,
      type: 'info'
    }
  ]);
};

const GestioneUtenti = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const extraRolesList = [
    "GAM", "Docente Accademico", "Docente Avvocatura", 
    "Presidente CC", "Vice Presidente CC", "Giudice CC", 
    "Avvocato", "Aspirante Avvocato"
  ];

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('grado_gerarchico', { ascending: false });

    if (!error) setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUser = async (userId, field, value) => {
    const targetUser = users.find(u => u.id === userId);
    const { error } = await supabase.from('profiles').update({ [field]: value }).eq('id', userId);

    if (!error) {
      if (field === 'grado_gerarchico') {
        const newTitle = getRankTitle(value, targetUser.funzione);
        await sendNotification(userId, "CAMBIO RUOLO", `Il tuo ruolo è ora ${newTitle}.`);
      } 
      else if (field === 'funzione') {
        const label = value.charAt(0).toUpperCase() + value.slice(1);
        await sendNotification(userId, "CAMBIO FUNZIONE", `La tua funzione è ora ${label}.`);
      }
      fetchUsers();
    }
  };

  const toggleExtraRole = async (userId, role) => {
    const targetUser = users.find(u => u.id === userId);
    // Assicuriamoci che ruoli_extra sia sempre un array pulito
    const currentRoles = Array.isArray(targetUser.ruoli_extra) ? targetUser.ruoli_extra : [];
    
    const isRemoving = currentRoles.includes(role);
    const newRoles = isRemoving 
      ? currentRoles.filter(r => r !== role) 
      : [...currentRoles, role];

    const { error } = await supabase.from('profiles').update({ ruoli_extra: newRoles }).eq('id', userId);

    if (!error) {
      await sendNotification(
        userId, 
        isRemoving ? "RIMOZIONE RUOLO EXTRA" : "CAMBIO RUOLO EXTRA", 
        isRemoving ? `Il ruolo extra ${role} è stato rimosso.` : `Il tuo ruolo extra è ora ${role}.`
      );
      fetchUsers();
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-white tracking-tight uppercase">Gestione Personale</h2>
        <p className="text-slate-400 text-sm mt-1">Controllo gerarchico e ruoli extra</p>
      </div>

      <div className="bg-[#1a2632] border border-slate-700/50 rounded-xl overflow-visible shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0b1016] border-b border-slate-700/50 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <th className="p-5">Magistrato</th>
              <th className="p-5">Funzione</th>
              <th className="p-5">Grado</th>
              <th className="p-5 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {users.map((u) => {
              // Pulizia dei ruoli per il conteggio preciso
              const validRoles = (u.ruoli_extra || []).filter(r => r && r.trim() !== "");
              const hasRoles = validRoles.length > 0;

              return (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-cyan-400 border border-slate-600">
                        {u.username?.[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{u.username}</p>
                        <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-wider">
                          {getRankTitle(u.grado_gerarchico, u.funzione)}
                        </p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-5">
                    <select 
                      value={u.funzione || 'nessuna'} 
                      onChange={(e) => updateUser(u.id, 'funzione', e.target.value)}
                      className="bg-[#0d1319] border border-slate-600 text-xs rounded-lg px-3 py-2 text-slate-300 cursor-pointer focus:border-cyan-500 outline-none transition-all"
                    >
                      <option value="requirente">Requirente</option>
                      <option value="giudicante">Giudicante</option>
                      <option value="entrambi">Entrambi</option>
                      <option value="nessuna">Nessuna</option>
                    </select>
                  </td>

                  <td className="p-5">
                    <select 
                      value={u.grado_gerarchico} 
                      onChange={(e) => updateUser(u.id, 'grado_gerarchico', parseInt(e.target.value))}
                      className="bg-[#0d1319] border border-slate-600 text-xs rounded-lg px-3 py-2 text-slate-300 cursor-pointer focus:border-cyan-500 outline-none transition-all"
                    >
                      {[...Array(12).keys()].reverse().map(n => (
                        <option key={n} value={n}>Livello {n}</option>
                      ))}
                    </select>
                  </td>

                  <td className="p-5 text-right relative">
                    <button 
                      onClick={() => setActiveDropdown(activeDropdown === u.id ? null : u.id)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all cursor-pointer border ${
                        hasRoles 
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      Ruoli Extra {hasRoles && `(${validRoles.length})`}
                    </button>

                    {activeDropdown === u.id && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)}></div>
                        <div className="absolute right-5 mt-2 w-56 bg-[#0d1319] border border-slate-700 shadow-2xl rounded-xl z-40 overflow-hidden text-left animate-in fade-in zoom-in duration-150">
                          <div className="p-3 border-b border-slate-700 bg-[#111921]">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assegna Ruoli Extra</p>
                          </div>
                          <div className="p-2 space-y-1">
                            {extraRolesList.map(role => {
                              const isActive = validRoles.includes(role);
                              return (
                                <button
                                  key={role}
                                  onClick={() => toggleExtraRole(u.id, role)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                                    isActive ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                  }`}
                                >
                                  {role}
                                  {isActive && <span className="material-symbols-outlined text-sm">check_circle</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && <div className="p-8 text-center text-slate-500 text-xs uppercase animate-pulse">Sincronizzazione in corso...</div>}
      </div>
    </div>
  );
};

export default GestioneUtenti;