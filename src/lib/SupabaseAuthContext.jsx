import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, supabaseAPI } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // Perfil del usuario desde la tabla users
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    // Verificar sesión actual al montar
    checkUserAuth();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (event === 'SIGNED_IN' && session) {
        await loadUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      // Obtener la sesión actual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error getting session:', sessionError);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        return;
      }

      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'Error al verificar autenticación'
      });
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loadUserProfile = async (authUser) => {
    try {
      setUser(authUser);

      // Intentar cargar el perfil del usuario desde la tabla users
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        // Si no existe perfil, crear uno básico
        if (profileError.code === 'PGRST116') {
          console.log('Creating user profile...');
          const newProfile = {
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || authUser.email,
            role: authUser.user_metadata?.role || 'user',
            custom_role: authUser.user_metadata?.custom_role || null,
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString()
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('users')
            .insert([newProfile])
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            // Continuar con un perfil temporal
            setProfile({
              id: authUser.id,
              email: authUser.email,
              full_name: authUser.email,
              role: 'user'
            });
          } else {
            setProfile(createdProfile);
          }
        } else {
          console.error('Error loading profile:', profileError);
          // Usar datos del auth user como fallback
          setProfile({
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || authUser.email,
            role: authUser.user_metadata?.role || 'user'
          });
        }
      } else {
        setProfile(userProfile);
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setIsAuthenticated(true); // Mantener autenticado aunque falle el perfil
      setProfile({
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.email,
        role: 'user'
      });
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const { data, error } = await supabaseAPI.auth.signIn(email, password);

      if (error) {
        setAuthError({
          type: 'login_failed',
          message: error.message
        });
        throw error;
      }

      await loadUserProfile(data.user);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loginWithCredentials = (userData) => {
    // Para compatibilidad con el Login.jsx actual
    setProfile(userData);
    setUser({ id: userData.id, email: userData.email });
    setIsAuthenticated(true);
    setAuthError(null);
  };

  const signup = async (email, password, metadata = {}) => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const { data, error } = await supabaseAPI.auth.signUp(email, password, metadata);

      if (error) {
        setAuthError({
          type: 'signup_failed',
          message: error.message
        });
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async (shouldRedirect = true) => {
    try {
      await supabaseAPI.auth.signOut();
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);

      if (shouldRedirect) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigateToLogin = () => {
    // Para compatibilidad con el código existente
    setIsAuthenticated(false);
  };

  const checkAppState = async () => {
    // Para compatibilidad con el código existente
    await checkUserAuth();
  };

  // El perfil combinado con los campos que espera el código existente
  const combinedUser = profile ? {
    ...profile,
    // Asegurar que tenga los campos que el código espera
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role,
    custom_role: profile.custom_role
  } : null;

  return (
    <AuthContext.Provider value={{
      user: combinedUser,
      authUser: user, // Usuario de auth de Supabase
      profile, // Perfil de la tabla users
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      login,
      loginWithCredentials,
      signup,
      logout,
      navigateToLogin,
      checkAppState,
      checkUserAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
