import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getRankTitle } from './Dashboard';

const GestioneDipendenti = () => {
  const [dipendenti, setDipendenti] = useState([]);
  const [procedimenti, setProcedimenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDocs, setUserDocs] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: profiles } = await supabase.from('profiles').select('*').order('grado_gerarchico', { ascending: false });
    const { data: procs } = await supabase.from('procedimenti').select('*');
    const { data: docs } = await supabase.from('documents').select('*');

    setProcedimenti(procs || []);
    setUserDocs(docs || []);

    const elaborati = profiles.map(user => {
      const assegnati = procs.filter(p => p.pm_assegnato_id === user.id || p.giudice_assegnato_id === user.id);
      const completati = assegnati.filter(p => p.stato === 'Concluso').length;
      const inCorso = assegnati.filter(p => p.stato === 'In Corso').length;
      const totale = assegnati.length;
      const ratio = totale > 0 ? Math.round((completati / totale) * 100) : 0;

      return { ...user, statistiche: { totale, completati, inCorso, ratio } };
    });

    setDipendenti(elaborati);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-20">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Dipendenti Magistratura</h2>
          <p className="text-slate-500 text-sm">Monitoraggio carichi di lavoro e rendimento del personale</p>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-xl">
          <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest text-center">Dipendenti Totali</p>
          <p className="text-white font-black text-center">{dipendenti.length}</p>
        </div>
      </div>

      <div className="bg-[#1a2632] border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-black/20 border-b border-slate-700">
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Magistrato</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Titolo / Ruolo</th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Totali</th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Attivi</th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Efficienza</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {dipendenti.map(user => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-cyan-400 text-xs border border-white/5">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white uppercase">{user.username}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{user.ruolo_extra || ''}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-black text-cyan-500 bg-cyan-500/5 px-3 py-1 rounded-full border border-cyan-500/10 uppercase tracking-widest">
                    {getRankTitle(user.grado_gerarchico, user.funzione)}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm font-bold text-slate-300">{user.statistiche.totale}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm font-bold text-orange-500">{user.statistiche.inCorso}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-sm font-bold text-cyan-400">{user.statistiche.ratio}%</span>
                    <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500" style={{ width: `${user.statistiche.ratio}%` }}></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setSelectedUser(user)}
                    className="bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer"
                  >
                    Vedi Fascicoli
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#161b22] border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-8 bg-[#1a2632] border-b border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-cyan-600/20 border border-cyan-600/40 flex items-center justify-center">
                  <span className="material-symbols-outlined text-cyan-400 text-3xl">account_circle</span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase">{selectedUser.username}</h3>
                  <div className="flex gap-4 mt-1">
                    <span className="text-[10px] text-cyan-500 font-black uppercase tracking-widest">
                      {getRankTitle(selectedUser.grado_gerarchico, selectedUser.funzione)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">{selectedUser.ruolo_extra || ''}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-slate-500 hover:text-white material-symbols-outlined p-2 bg-white/5 rounded-full cursor-pointer">close</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="flex items-center gap-4 mb-8">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Procedimenti in carico</h4>
                <div className="h-px flex-1 bg-slate-800"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {procedimenti.filter(p => (p.pm_assegnato_id === selectedUser.id || p.giudice_assegnato_id === selectedUser.id) && p.stato === 'In Corso').length > 0 ? (
                  procedimenti.filter(p => (p.pm_assegnato_id === selectedUser.id || p.giudice_assegnato_id === selectedUser.id) && p.stato === 'In Corso').map(p => (
                    <div key={p.id} className="bg-black/20 border border-slate-800 rounded-2xl p-6 hover:border-slate-600 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-cyan-500 text-[10px] font-black uppercase mb-1 tracking-widest">{p.display_id}</p>
                          <h5 className="text-white font-bold text-sm leading-tight uppercase">{p.titolo}</h5>
                        </div>
                        <span className="text-[8px] bg-orange-500/10 text-orange-500 px-2 py-1 rounded font-black uppercase border border-orange-500/20">In Corso</span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                        <p className="text-[9px] text-slate-500 font-black uppercase mb-2">Estratto Fascicolo</p>
                        {userDocs.filter(d => d.procedimento_id === p.display_id || d.id === p.documento_iniziale_id).map(doc => (
                          <div key={doc.id} className="flex justify-between items-center bg-[#0d1319] p-3 rounded-xl border border-slate-800 group/doc">
                            <span className="text-[11px] text-slate-300 font-medium">{doc.title}</span>
                            <span className="text-[8px] bg-slate-800 text-slate-500 px-2 py-1 rounded uppercase font-bold group-hover/doc:text-cyan-400 transition-colors tracking-tighter">{doc.category}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-20 bg-black/10 rounded-3xl border border-dashed border-slate-800">
                    <span className="material-symbols-outlined text-slate-700 text-5xl mb-4">folder_off</span>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Nessun procedimento attivo assegnato</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-[#1a2632] border-t border-slate-700">
              <button onClick={() => setSelectedUser(null)} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer transition-all">Chiudi Scheda Dipendente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestioneDipendenti;