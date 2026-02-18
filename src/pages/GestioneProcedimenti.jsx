import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const GestioneProcedimenti = ({ userProfile }) => {
  const [procedimenti, setProcedimenti] = useState([]);
  const [collegati, setCollegati] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Carica i procedimenti attivi
    let queryProc = supabase.from('procedimenti').select('*').eq('stato', 'In Corso');

    // Filtri di visibilità gerarchica
    if (userProfile.grado_gerarchico < 10) {
      if (userProfile.funzione === 'requirente') queryProc = queryProc.eq('tipo_procedimento', 'Requirente');
      if (userProfile.funzione === 'giudicante') queryProc = queryProc.eq('tipo_procedimento', 'Giudicante');
    }

    const { data: p } = await queryProc;
    setProcedimenti(p || []);

    // 2. Carica TUTTI i documenti che hanno un procedimento assegnato o che sono atti iniziali
    // La logica di filtraggio la facciamo nel render per essere reattivi
    const { data: d } = await supabase.from('documents').select('*');
    setCollegati(d || []);
    
    setLoading(false);
  };

  useEffect(() => { 
    fetchData(); 

    // Realtime: se i documenti cambiano (es. modificati in Gestione Documenti), aggiorna la vista
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'procedimenti' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStato = async (id, nuovoStato) => {
    const { error } = await supabase.from('procedimenti').update({ stato: nuovoStato }).eq('id', id);
    if (!error) fetchData();
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-20">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Registro Procedimenti</h2>
          <p className="text-slate-500 text-sm">Fascicoli processuali aggiornati in tempo reale</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {procedimenti.map(proc => {
          // FILTRO DINAMICO: 
          // Mostra il documento se ha il procedimento_id uguale al display_id del caso
          // OPPURE se è il documento che ha originato il caso (documento_iniziale_id)
          const fascicolo = collegati.filter(doc => 
            doc.procedimento_id === proc.display_id || 
            doc.id === proc.documento_iniziale_id
          );

          return (
            <div key={proc.id} className="bg-[#1a2632] border border-slate-700/50 rounded-3xl p-7 shadow-2xl relative border-l-4 border-l-cyan-600">
              <div className="absolute top-0 right-0 p-5 flex flex-col items-end gap-2">
                <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20 uppercase tracking-widest">{proc.display_id}</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase">Aperto: {new Date(proc.created_at).toLocaleDateString()}</span>
              </div>
              
              <h3 className="text-xl font-black text-white pr-24 leading-tight mb-6 uppercase">{proc.titolo}</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                  <p className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-widest">PM</p>
                  <p className="text-sm text-white font-bold">{proc.pm_nome || 'NON ASSEGNATO'}</p>
                </div>
                <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                  <p className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-widest">Giudice</p>
                  <p className="text-sm text-white font-bold">{proc.giudice_nome || 'IN ATTESA'}</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Documenti nel Fascicolo ({fascicolo.length})</p>
                  <span className="h-[1px] flex-1 bg-slate-800 mx-4"></span>
                </div>
                
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {fascicolo.length > 0 ? (
                    fascicolo.map(doc => (
                      <button 
                        key={doc.id} 
                        onClick={() => setSelectedDoc(doc)}
                        className="w-full bg-[#0d1319] p-4 rounded-xl border border-slate-800 flex justify-between items-center hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group cursor-pointer text-left"
                      >
                        <div>
                          <p className="text-white text-xs font-bold group-hover:text-cyan-400 transition-colors">{doc.title}</p>
                          <p className="text-[8px] text-slate-500 uppercase font-bold mt-1">{doc.category} • {new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-600 group-hover:text-cyan-400">visibility</span>
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-slate-600 text-[10px] py-4 uppercase font-bold tracking-widest">Nessun documento collegato</p>
                  )}
                </div>
              </div>

              <button 
                onClick={() => updateStato(proc.id, 'Concluso')} 
                className="w-full bg-green-500/10 hover:bg-green-600 text-green-500 hover:text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer border border-green-500/20"
              >
                Archivia Caso
              </button>
            </div>
          );
        })}
      </div>

      {/* MODALE VISUALIZZAZIONE ATTO */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#161b22] border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border-t-4 border-t-cyan-500 animate-in zoom-in duration-200">
            <div className="p-8 bg-[#1a2632] border-b border-slate-700 flex justify-between items-start">
              <div>
                <span className="bg-cyan-500/10 text-cyan-400 text-[9px] font-black px-3 py-1 rounded-full uppercase border border-cyan-500/20 mb-3 inline-block tracking-widest">{selectedDoc.category}</span>
                <h3 className="text-2xl font-black text-white leading-tight">{selectedDoc.title}</h3>
                <p className="text-cyan-500 text-xs mt-2 font-black uppercase tracking-widest">Rif: {selectedDoc.display_id}</p>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="text-slate-500 hover:text-white material-symbols-outlined p-2 bg-white/5 rounded-full cursor-pointer">close</button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Redatto da</p>
                  <p className="text-white font-bold text-sm">{selectedDoc.created_by_name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Data Deposito</p>
                  <p className="text-white font-bold text-sm">{new Date(selectedDoc.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Testo Integrativo</p>
                <div className="bg-[#0d1319] border border-slate-700 rounded-2xl p-6 min-h-[150px]">
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap italic">
                    {selectedDoc.description || "Nessun contenuto aggiuntivo."}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="w-full py-4 bg-slate-800 text-white rounded-xl font-black uppercase text-xs tracking-widest cursor-pointer">Chiudi Fascicolo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestioneProcedimenti;