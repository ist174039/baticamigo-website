// firebaseConfig.js

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA-DS_-sxWmW1k0r3yfZ3VFkSX2jSKeWyQ",
  authDomain: "baticamigo-c0384.firebaseapp.com",
  projectId: "baticamigo-c0384",
  storageBucket: "baticamigo-c0384.firebasestorage.app",
  messagingSenderId: "710064415749",
  appId: "1:710064415749:web:064e7ff27b4359a4a3686c",
  measurementId: "G-75HE0LN9JF",
}

// Inicializar Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
}

// Referências para os serviços do Firebase
const auth = firebase.auth()
const db = firebase.firestore()
const storage = firebase.storage()

// Configuração de idioma para português
auth.useDeviceLanguage()

// Exportar as referências
export { auth, db, storage }
