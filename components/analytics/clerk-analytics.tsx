"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { trackCompleteRegistration, trackLogin } from "./meta-pixel";

export const ClerkAnalytics = () => {
  const { isSignedIn, user } = useUser();
  const hasTrackedRef = useRef(false);
  const previousSignInStateRef = useRef<boolean>(false);

  useEffect(() => {
    // Si el usuario no está autenticado, resetear el tracking
    if (!isSignedIn) {
      hasTrackedRef.current = false;
      previousSignInStateRef.current = false;
      return;
    }

    // Si ya rastreamos este usuario, no volver a rastrear
    if (hasTrackedRef.current) {
      return;
    }

    // Si el usuario está autenticado y tenemos información del usuario
    if (isSignedIn && user) {
      // Detectar si es un nuevo registro o inicio de sesión
      const createdAt = user.createdAt;
      const now = new Date().getTime();
      const userAge = now - createdAt;

      // Si el usuario fue creado hace menos de 10 segundos, es un nuevo registro
      // Ajusta este valor según tus necesidades
      const isNewRegistration = userAge < 10000; // 10 segundos

      if (isNewRegistration) {
        console.log("Meta Pixel: Tracking CompleteRegistration");
        trackCompleteRegistration();
      } else {
        console.log("Meta Pixel: Tracking Login");
        trackLogin();
      }

      hasTrackedRef.current = true;
      previousSignInStateRef.current = true;
    }
  }, [isSignedIn, user]);

  return null;
};
