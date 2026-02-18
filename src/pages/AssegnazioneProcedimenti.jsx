import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AssegnazioneProcedimenti = ({ userProfile }) => {
  const [docs, setDocs] = useState([]);
  const [magistrati, setMagistrati] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const isProcuratoreCapo = (userProfile.grado_gerarchico >= 8 && userProfile.funzione === 'requirente') || userProfile.grado_gerarchico >= 10;
  const isCorteAppello = (userProfile.grado_gerarchico >= 8 && userProfile.funzione === 'giudicante') || userProfile.grado_gerarchico >= 10;

const fetchData = async () => {
  setLoading(true);

  try {
    // 1. Recuperiamo lo stato attuale dei procedimenti
    // Ci serve sapere quali procedimenti hanno già un PM e quali hanno già un Giudice
    const { data: statusProc } = await supabase
      .from('procedimenti')
      .select('display_id, pm_assegnato_id, giudice_assegnato_id, documento_iniziale_id');

    // Mappe per un controllo rapido
    const procConPM = statusProc?.filter(p => p.pm_assegnato_id).map(p => p.display_id) || [];
    const procConGiudice = statusProc?.filter(p => p.giudice_assegnato_id).map(p => p.display_id) || [];
    const idsInizialiAssegnati = statusProc?.map(p => p.documento_iniziale_id).filter(id => id) || [];

    // 2. Prepariamo la query sui documenti
    let query = supabase.from('documents').select('*');

    // Filtro per Categoria in base al ruolo di chi guarda la pagina
    if (isProcuratoreCapo && !isCorteAppello) {
      query = query.in('category', ['Denuncia', 'Ricorso']);
    } else if (isCorteAppello && !isProcuratoreCapo) {
      query = query.eq('category', 'Rinvio a Giudizio');
    } else if (userProfile.grado_gerarchico >= 10) {
      // I gradi altissimi (10+) vedono tutto, non aggiungiamo filtri categoria
    } else {
      // Se non ha i permessi, svuota e chiudi
      setDocs([]);
      setLoading(false);
      return;
    }

    const { data: tuttiIdoc, error: docError } = await query.order('created_at', { ascending: false });

    if (docError) throw docError;

    const docsDaAssegnare = tuttiIdoc.filter(doc => {
      const isReq = ['Denuncia', 'Ricorso'].includes(doc.category);
      
      if (isReq) {
        const giaAssegnatoComeIniziale = idsInizialiAssegnati.includes(doc.id);
        const haGiaPM = doc.procedimento_id && procConPM.includes(doc.procedimento_id);
        
        return !giaAssegnatoComeIniziale && !haGiaPM;
      } else {
        const haGiaGiudice = doc.procedimento_id && procConGiudice.includes(doc.procedimento_id);
        return !haGiaGiudice;
      }
    });

    setDocs(docsDaAssegnare);

    const { data: m } = await supabase
      .from('profiles')
      .select('id, username, funzione, grado_gerarchico')
      .order('username');
      
    setMagistrati(m || []);

  } catch (error) {
    console.error("Errore durante il caricamento dati:", error.message);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { fetchData(); }, []);

  const handleAssign = async (magistrato) => {
  const isRequirente = ['Denuncia', 'Ricorso'].includes(selectedDoc.category);
  const existingProcID = selectedDoc.procedimento_id;

  if (existingProcID) {
    const updateData = isRequirente 
      ? { pm_assegnato_id: magistrato.id, pm_nome: magistrato.username }
      : { giudice_assegnato_id: magistrato.id, giudice_nome: magistrato.username };

    const { error: updateError } = await supabase
      .from('procedimenti')
      .update(updateData)
      .eq('display_id', existingProcID);

    if (updateError) {
      alert("Errore aggiornamento procedimento: " + updateError.message);
      return;
    }

    await supabase.from('notifications').insert([{
      user_id: magistrato.id,
      title: "Incarico Procedimento Esistente",
      message: `Ti è stato assegnato il caso ${existingProcID}: ${selectedDoc.title}`,
      is_read: false
    }]);

  } else {
    const { data: newProc, error: procError } = await supabase.from('procedimenti').insert([{
      documento_iniziale_id: selectedDoc.id,
      titolo: selectedDoc.title,
      tipo_procedimento: isRequirente ? 'Requirente' : 'Giudicante',
      pm_assegnato_id: isRequirente ? magistrato.id : null,
      pm_nome: isRequirente ? magistrato.username : null,
      giudice_assegnato_id: !isRequirente ? magistrato.id : null,
      giudice_nome: !isRequirente ? magistrato.username : null,
    }]).select().single();

    if (procError) {
      alert("Errore creazione procedimento: " + procError.message);
      return;
    }

    await supabase.from('documents')
      .update({ procedimento_id: newProc.display_id })
      .eq('id', selectedDoc.id);

    await supabase.from('notifications').insert([{
      user_id: magistrato.id,
      title: "Nuovo Procedimento Assegnato",
      message: `Creato nuovo fascicolo ${newProc.display_id} per: ${selectedDoc.title}`,
      is_read: false
    }]);
  }

  setSelectedDoc(null);
  fetchData();
};

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <h2 className="text-2xl font-black text-white uppercase italic mb-8">Assegnazione Carichi Pendenti</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docs.map(doc => (
          <div key={doc.id} className="bg-[#1a2632] border border-slate-700 p-6 rounded-2xl hover:border-cyan-500 transition-all cursor-pointer" onClick={() => setSelectedDoc(doc)}>
            <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded font-black uppercase">{doc.category}</span>
            <h3 className="text-white font-bold mt-3">{doc.title}</h3>
            <p className="text-slate-500 text-[10px] mt-2 italic">Creato da: {doc.created_by_name}</p>
          </div>
        ))}
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-slate-700 w-full max-w-md rounded-2xl p-6">
            <h3 className="text-white font-black uppercase text-sm mb-4 tracking-widest text-center">Seleziona Magistrato</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {magistrati
                .filter(m => {
                  const isReqDoc = ['Denuncia', 'Ricorso'].includes(selectedDoc.category);
                  if (isReqDoc) return m.funzione === 'requirente' || m.funzione === 'entrambi';
                  return m.funzione === 'giudicante' || m.funzione === 'entrambi';
                })
                .map(m => (
                  <button key={m.id} onClick={() => handleAssign(m)} className="w-full text-left p-4 bg-[#1a2632] hover:bg-cyan-600 rounded-xl transition-all group">
                    <p className="text-white font-bold group-hover:text-white">{m.username}</p>
                    <p className="text-[9px] text-slate-500 uppercase group-hover:text-cyan-100">Grado {m.grado_gerarchico} - {m.funzione}</p>
                  </button>
                ))}
            </div>
            <button onClick={() => setSelectedDoc(null)} className="w-full mt-4 py-3 text-slate-400 font-bold uppercase text-[10px]">Annulla</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssegnazioneProcedimenti;