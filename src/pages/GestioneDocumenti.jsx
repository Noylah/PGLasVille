import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const CATEGORIES = [
  "Denuncia", "Ricorso", "Rinvio a Giudizio", "Contratto Partnership", "Contratto Lavoro",
  "Contratto Prestito", "Contratto Affitto", "Testamento", "Contratto Vendita Terreno",
  "Cessione Aziendale", "Contratto Generale", "Cancellazione Partito", "Unione Partito",
  "Cambio nome Partito", "Trasferimento Partito", "Richiesta Interna", "Registrazione Bunker",
  "Richiesta Avvocato", "Nomina Avvocato", "Prenotazione Corso Avvocato", "Licenza Avvocato",
  "Rinnovo Licenza Avvocato", "Certificato di Divorzio", "Notifica di Divorzio", "Udienza Confermativa",
  "Convalida Arresto", "Richiesta di Custodia Cautelare", "Verbale", "Notifica di Rinvio", "Verdetto",
  "Verbale Interrogatorio", "Titolo Esecutivo", "Richiesta Rinvio a Giudizio", "Richiesta di Accesso agli Atti",
  "Deposizione Giurata", "Notifica Giudiziaria", "Titolo di Irruzione", "Decreto di Perquisizione Privato",
  "Decreto di Perquisizione Pubblico"
];

const CITIZEN_LABELS = {
  "Denuncia": { a: "Denunciante", b: "Denunciato" },
  "Ricorso": { a: "Ricorrente", b: "Resistente" },
  "Rinvio a Giudizio": { a: "Imputato" },
  "Convalida Arresto": { a: "Arrestato" },
  "Richiesta di Custodia Cautelare": { a: "Indagato" },
  "Richiesta Rinvio a Giudizio": { a: "Imputato" },
  "Verdetto": { a: "Parti in Causa" },
  "Notifica Giudiziaria": { a: "Destinatario" },
  "Contratto Generale": { a: "Parte A", b: "Parte B" },
  "Contratto Partnership": { a: "Partner A", b: "Partner B" },
  "Contratto Lavoro": { a: "Datore di Lavoro", b: "Lavoratore" },
  "Contratto Prestito": { a: "Finanziatore", b: "Beneficiario" },
  "Contratto Affitto": { a: "Locatore", b: "Locatario" },
  "Contratto Vendita Terreno": { a: "Venditore", b: "Acquirente" },
  "Cessione Aziendale": { a: "Contraente A", b: "Contraente B" },
  "Certificato di Divorzio": { a: "Coniuge A", b: "Coniuge B" },
  "Notifica di Divorzio": { a: "Coniuge A", b: "Coniuge B" },
  "Cancellazione Partito": { a: "Partito" },
  "Unione Partito": { a: "Partito Incorporante", b: "Partito Incorporato" },
  "Cambio nome Partito": { a: "Partito" },
  "Trasferimento Partito": { a: "Cedente", b: "Ricevente" },
  "Registrazione Bunker": { a: "Proprietario" },
  "Testamento": { a: "Testatore" },
  "Verbale Interrogatorio": { a: "Interrogato" },
  "Deposizione Giurata": { a: "Deponente" },
  "Titolo di Irruzione": { a: "Autorità", b: "Bersaglio" },
  "Decreto di Perquisizione Pubblico": { a: "Autorità", b: "Bersaglio" },
  "Decreto di Perquisizione Privato": { a: "Autorità", b: "Bersaglio" },
  "Titolo Esecutivo": { a: "Destinatario" },
  "Richiesta Avvocato": { a: "Cliente", b: "Avvocato" },
  "Nomina Avvocato": { a: "Cliente", b: "Avvocato" },
  "Prenotazione Corso Avvocato": { a: "Cittadino" },
  "Licenza Avvocato": { a: "Cittadino" },
  "Rinnovo Licenza Avvocato": { a: "Cittadino" }
};

const GestioneDocumenti = ({ userProfile }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('Tutti');
  const [modalType, setModalType] = useState(null); 
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    category: 'Denuncia', 
    description: '', 
    procedimento_id: '',
    citizen_a: '',
    citizen_b: ''
  });

  const fetchDocs = async () => {
    setLoading(true);
    let query = supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (filterCat !== 'Tutti') query = query.eq('category', filterCat);
    if (search) query = query.or(`title.ilike.%${search}%,citizen_a.ilike.%${search}%,citizen_b.ilike.%${search}%`);
    const { data } = await query;
    setDocs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, [filterCat]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: formData.title,
      category: formData.category,
      description: formData.description?.trim() || null,
      procedimento_id: formData.procedimento_id?.trim() || null,
      citizen_a: formData.citizen_a?.trim() || null,
      citizen_b: formData.citizen_b?.trim() || null,
      updated_at: new Date()
    };

    let error;
    if (modalType === 'create') {
      const { error: err } = await supabase.from('documents').insert([{
        ...payload,
        created_by_id: userProfile.id,
        created_by_name: userProfile.username
      }]);
      error = err;
    } else {
      const { error: err } = await supabase.from('documents').update(payload).eq('id', selectedDoc.id);
      error = err;
    }

    if (!error) { setModalType(null); fetchDocs(); }
  };

  const confirmDelete = async () => {
    const { error } = await supabase.from('documents').delete().eq('id', selectedDoc.id);
    if (!error) { setModalType(null); fetchDocs(); }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Archivio Documentale</h2>
          <p className="text-slate-400 text-sm">Registro Atti e Contratti della Repubblica</p>
        </div>
        <button onClick={() => { setFormData({ title: '', category: 'Denuncia', description: '', procedimento_id: '', citizen_a: '', citizen_b: '' }); setModalType('create'); }} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-cyan-500/20">
          <span className="material-symbols-outlined text-sm">post_add</span> Nuovo Atto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-[#1a2632] p-4 rounded-2xl border border-slate-700/50 shadow-xl">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-sm">search</span>
          <input type="text" placeholder="Cerca titolo o cittadino..." className="w-full bg-[#0d1319] border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-cyan-500" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchDocs()} />
        </div>
        <select className="bg-[#0d1319] border border-slate-700 rounded-lg px-4 py-2 text-sm text-white outline-none cursor-pointer" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="Tutti">Tutte le Categorie</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex items-center justify-end px-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">{docs.length} File Registrati</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {docs.map(doc => (
          <div key={doc.id} className="bg-[#1a2632] border border-slate-700/50 rounded-2xl p-5 hover:border-cyan-500/30 transition-all shadow-lg flex flex-col h-full group">
            <div className="flex-1 cursor-pointer" onClick={() => { setSelectedDoc(doc); setModalType('view'); }}>
              <div className="flex justify-between items-start mb-3">
                <span className="bg-cyan-500/10 text-cyan-400 text-[8px] font-black px-2 py-1 rounded uppercase border border-cyan-500/20">{doc.category}</span>
                <span className="text-[9px] text-cyan-500 font-black">{doc.display_id}</span>
              </div>
              <h3 className="text-white font-bold text-sm mb-4 leading-tight group-hover:text-cyan-400 transition-colors">{doc.title}</h3>
              
              {doc.citizen_a && (
                <div className="mb-4 space-y-1">
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">
                    {CITIZEN_LABELS[doc.category]?.a || "Soggetto"}: <span className="text-slate-300">{doc.citizen_a}</span>
                  </p>
                  {doc.citizen_b && (
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">
                      {CITIZEN_LABELS[doc.category]?.b || "Soggetto"}: <span className="text-slate-300">{doc.citizen_b}</span>
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="material-symbols-outlined text-[14px]">person</span> {doc.created_by_name}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span> {new Date(doc.created_at).toLocaleDateString()}
                </div>
                {doc.procedimento_id && (
                  <div className="flex items-center gap-2 text-[10px] text-yellow-500 font-bold uppercase">
                    <span className="material-symbols-outlined text-[14px]">gavel</span> {doc.procedimento_id}
                  </div>
                )}
              </div>
            </div>
            <div className="pt-4 border-t border-slate-700/50 flex gap-2">
              <button onClick={() => { setSelectedDoc(doc); setFormData({ title: doc.title, category: doc.category, description: doc.description || '', procedimento_id: doc.procedimento_id || '', citizen_a: doc.citizen_a || '', citizen_b: doc.citizen_b || '' }); setModalType('edit'); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-[9px] font-black uppercase cursor-pointer">Modifica</button>
              <button onClick={() => { setSelectedDoc(doc); setModalType('delete'); }} className="px-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-2 rounded-lg transition-all cursor-pointer"><span className="material-symbols-outlined text-sm">delete</span></button>
            </div>
          </div>
        ))}
      </div>

      {(modalType === 'create' || modalType === 'edit') && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#161b22] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border-t-4 border-t-cyan-500">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-[#1a2632]">
              <h3 className="text-white font-black uppercase tracking-widest text-sm">{modalType === 'create' ? 'Protocolla Atto' : 'Modifica Atto'}</h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white cursor-pointer material-symbols-outlined">close</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Titolo</label>
                <input required type="text" className="w-full bg-[#0d1319] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Categoria</label>
                  <select className="w-full bg-[#0d1319] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">ID Procedimento (Opz)</label>
                  <input type="text" className="w-full bg-[#0d1319] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500" placeholder="Es: PROC-0001" value={formData.procedimento_id} onChange={e => setFormData({...formData, procedimento_id: e.target.value})} />
                </div>
              </div>

              {CITIZEN_LABELS[formData.category] && (
                <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-4">
                  <div className={!CITIZEN_LABELS[formData.category].b ? "col-span-2" : ""}>
                    <label className="block text-[10px] font-bold text-cyan-500 uppercase mb-1 tracking-widest">{CITIZEN_LABELS[formData.category].a}</label>
                    <input type="text" className="w-full bg-[#0d1319] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500" value={formData.citizen_a} onChange={e => setFormData({...formData, citizen_a: e.target.value})} />
                  </div>
                  {CITIZEN_LABELS[formData.category].b && (
                    <div>
                      <label className="block text-[10px] font-bold text-cyan-500 uppercase mb-1 tracking-widest">{CITIZEN_LABELS[formData.category].b}</label>
                      <input type="text" className="w-full bg-[#0d1319] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500" value={formData.citizen_b} onChange={e => setFormData({...formData, citizen_b: e.target.value})} />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Note / Contenuto</label>
                <textarea rows="4" className="w-full bg-[#0d1319] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none resize-none focus:border-cyan-500" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all">Salva Atto</button>
            </form>
          </div>
        </div>
      )}

      {modalType === 'delete' && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in zoom-in duration-150">
          <div className="bg-[#1a2632] border border-red-500/30 w-full max-w-sm rounded-2xl p-8 text-center">
            <span className="material-symbols-outlined text-red-500 text-5xl mb-4">warning</span>
            <h3 className="text-white font-black uppercase text-lg mb-2">Conferma Eliminazione</h3>
            <p className="text-slate-400 text-sm mb-8">Questa azione è irreversibile. Procedere?</p>
            <div className="flex gap-4">
              <button onClick={() => setModalType(null)} className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs uppercase cursor-pointer">Annulla</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold text-xs uppercase cursor-pointer">Elimina</button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'view' && selectedDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#161b22] border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border-t-4 border-t-cyan-500">
            <div className="p-8 bg-[#1a2632] border-b border-slate-700 flex justify-between items-start">
              <div>
                <span className="bg-cyan-500/10 text-cyan-400 text-[9px] font-black px-3 py-1 rounded-full uppercase border border-cyan-500/20 mb-3 inline-block tracking-widest">{selectedDoc.category}</span>
                <h3 className="text-2xl font-black text-white leading-tight">{selectedDoc.title}</h3>
                <p className="text-cyan-500 text-xs mt-2 font-black uppercase tracking-widest">ID Protocollo: {selectedDoc.display_id}</p>
              </div>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white cursor-pointer material-symbols-outlined">close</button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compilato da</p>
                  <p className="text-white font-bold text-sm">{selectedDoc.created_by_name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data</p>
                  <p className="text-white font-bold text-sm">{new Date(selectedDoc.created_at).toLocaleString()}</p>
                </div>
              </div>

              {selectedDoc.citizen_a && (
                <div className="grid grid-cols-2 gap-8 py-4 border-y border-white/5">
                  <div>
                    <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">{CITIZEN_LABELS[selectedDoc.category]?.a || "Parte A"}</p>
                    <p className="text-white font-bold text-sm">{selectedDoc.citizen_a}</p>
                  </div>
                  {selectedDoc.citizen_b && (
                    <div>
                      <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">{CITIZEN_LABELS[selectedDoc.category]?.b || "Parte B"}</p>
                      <p className="text-white font-bold text-sm">{selectedDoc.citizen_b}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedDoc.procedimento_id && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-yellow-600 uppercase tracking-widest mb-1">Procedimento Collegato</p>
                  <p className="text-white font-bold text-xs">{selectedDoc.procedimento_id}</p>
                </div>
              )}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contenuto Atto</p>
                <div className="bg-[#0d1319] border border-slate-700 rounded-2xl p-6 min-h-[150px]">
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap italic">
                    {selectedDoc.description || "Nessuna nota presente."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestioneDocumenti;