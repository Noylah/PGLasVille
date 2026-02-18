import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn("Profilo non trovato nel DB, uso default.");
        setProfile({ username: "Utente Senza Profilo", grado_gerarchico: 0 });
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Errore fetchProfile:", err);
    } finally {
      // Questo DEVE essere eseguito per togliere la scritta "Caricamento..."
      setLoading(false);
    }
  };

  useEffect(() => {
    // Controllo iniziale sessione
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Ascolto cambiamenti Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasPermission = (minGrado, extra = null) => {
    if (!profile) return false;
    if (profile.grado_gerarchico >= minGrado) return true;
    if (extra && profile.ruoli_extra?.includes(extra)) return true;
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, hasPermission, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);