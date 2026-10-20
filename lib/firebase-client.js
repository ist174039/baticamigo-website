import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

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
  return auth;
}
