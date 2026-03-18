import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { isAdminEmail } from '@/config/adminEmails';

const SpoofContext = createContext({
  spoofedUser: null,
  isSpoofing: false,
  startSpoof: () => {},
  stopSpoof: () => {},
});

const SPOOF_STORAGE_KEY = 'admin_spoof_user';

export function SpoofProvider({ children }) {
  const { user: clerkUser, isLoaded } = useUser();
  const [spoofedUser, setSpoofedUser] = useState(null);

  const currentEmail = clerkUser?.primaryEmailAddress?.emailAddress;
  const isAdmin = isAdminEmail(currentEmail);

  // On mount, check URL params and localStorage for spoof state
  useEffect(() => {
    if (!isLoaded || !isAdmin) return;

    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const spoofEmail = urlParams.get('spoof_email');
    const spoofName = urlParams.get('spoof_name');
    const spoofId = urlParams.get('spoof_id');

    if (spoofEmail) {
      const spoofData = {
        id: spoofId || spoofEmail,
        email: spoofEmail,
        full_name: spoofName || spoofEmail,
      };
      setSpoofedUser(spoofData);
      // Save to sessionStorage so it persists on navigation within the tab
      sessionStorage.setItem(SPOOF_STORAGE_KEY, JSON.stringify(spoofData));
      // Clean URL params
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      return;
    }

    // Check sessionStorage
    try {
      const saved = sessionStorage.getItem(SPOOF_STORAGE_KEY);
      if (saved) {
        setSpoofedUser(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error reading spoof state:', e);
    }
  }, [isLoaded, isAdmin]);

  const startSpoof = useCallback((userData) => {
    if (!isAdmin) return;
    setSpoofedUser(userData);
    sessionStorage.setItem(SPOOF_STORAGE_KEY, JSON.stringify(userData));
  }, [isAdmin]);

  const stopSpoof = useCallback(() => {
    setSpoofedUser(null);
    sessionStorage.removeItem(SPOOF_STORAGE_KEY);
  }, []);

  const isSpoofing = !!spoofedUser && isAdmin;

  const value = useMemo(() => ({
    spoofedUser: isAdmin ? spoofedUser : null,
    isSpoofing,
    startSpoof,
    stopSpoof,
  }), [spoofedUser, isSpoofing, startSpoof, stopSpoof, isAdmin]);

  return (
    <SpoofContext.Provider value={value}>
      {children}
    </SpoofContext.Provider>
  );
}

export function useSpoof() {
  return useContext(SpoofContext);
}

/**
 * Hook that returns the effective user - either the spoofed user or the real Clerk user.
 * Use this in pages that need to filter data by user email.
 * Returns the same shape as a Clerk user object so it's a drop-in replacement.
 */
export function useSpoofableUser() {
  const { user: clerkUser, isLoaded } = useUser();
  const { spoofedUser, isSpoofing } = useSpoof();

  const effectiveUser = useMemo(() => {
    if (!clerkUser) return null;

    if (isSpoofing && spoofedUser) {
      // Return a user-like object with the spoofed identity
      // but keep the structure similar to what pages expect
      return {
        // Clerk-like fields
        id: spoofedUser.id,
        primaryEmailAddress: { emailAddress: spoofedUser.email },
        fullName: spoofedUser.full_name,
        username: spoofedUser.full_name,
        publicMetadata: { role: 'user' },
        // Keep a reference to know this is spoofed
        _isSpoofed: true,
        _realUser: clerkUser,
      };
    }

    return clerkUser;
  }, [clerkUser, spoofedUser, isSpoofing]);

  return { user: effectiveUser, isLoaded, isSpoofing };
}
