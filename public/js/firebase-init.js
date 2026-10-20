

// Script para inicializar o Firebase
document.addEventListener("DOMContentLoaded", () => {
  console.log("Inicializando Firebase...")

  // Verificar se o Firebase já foi inicializado
  if (typeof firebase === "undefined") {
    console.error("Firebase não está carregado. Verifique se os scripts do Firebase foram incluídos.")
    return
  }

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

  // Inicializar Firebase se ainda não foi inicializado
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig)
    console.log("Firebase inicializado com sucesso")
  } else {
    console.log("Firebase já estava inicializado")
  }

  // Exportar referências para os serviços do Firebase para uso global
  window.db = firebase.firestore()
  window.auth = firebase.auth()
  window.storage = firebase.storage()

  // Configuração de idioma para português
  if (firebase && firebase.auth) {
    firebase.auth().useDeviceLanguage()
  }

  console.log("Serviços do Firebase configurados e prontos para uso")
})

