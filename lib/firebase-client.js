import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

let emulatorAttached = false;

// Public project identifiers, matching the existing website. No Admin credentials.
export function platformAuth() {
  const name = "baticamigo-platform-client";
  const app = getApps().some((candidate) => candidate.name === name)
    ? getApp(name)
    : initializeApp({
      apiKey: "AIzaSyA-DS_-sxWmW1k0r3yfZ3VFkSX2jSKeWyQ",
      authDomain: "baticamigo-c0384.firebaseapp.com",
      projectId: "baticamigo-c0384",
      appId: "1:710064415749:web:064e7ff27b4359a4a3686c",
    }, name);
  const auth = getAuth(app);
  auth.languageCode = "pt";
  // Browser E2E only: opt-in, localhost and development; never connect to emulator in production.
  if (!emulatorAttached && typeof window !== "undefined" && process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_E2E_FIREBASE_AUTH_EMULATOR === "1" &&
      ["localhost","127.0.0.1"].includes(window.location.hostname)) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    emulatorAttached = true;
  }
  return auth;
}
