// firebaseConfig.js

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA-DS_-sxWmW1k0r3yfZ3VFkSX2jSKeWyQ",
  authDomain: "baticamigo-c0384.firebaseapp.com",
  projectId: "baticamigo-c0384",
  storageBucket: "baticamigo-c0384.firebasestorage.app",
  messagingSenderId: "710064415749",
  appId: "1:710064415749:web:064e7ff27b4359a4a3686c",
}

// Use the same Firebase Auth persistence namespace as /platform/login.
// The modular login client and this legacy compat dashboard are separate SDK
// bundles, so both must use the same app name to observe the same signed-in
// session in browser storage.
const platformAppName = "baticamigo-platform-client"
const platformApp = firebase.apps.find((app) => app.name === platformAppName)
  || firebase.initializeApp(firebaseConfig, platformAppName)

// Referências para os serviços do Firebase
const auth = platformApp.auth()
const db = platformApp.firestore()
const storage = platformApp.storage()

// Configuração de idioma para português
auth.useDeviceLanguage()

// Exportar as referências
export { auth, db, storage }
