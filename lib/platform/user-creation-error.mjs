const creationErrors = {
  "auth/email-already-exists": {
    status: 409,
    message: "Já existe uma conta com este email. Procure o email na lista de utilizadores e associe o registo à conta existente.",
  },
  "auth/unauthorized-continue-uri": {
    status: 503,
    message: "Não foi possível gerar o convite. Pode escolher uma palavra-passe temporária e criar a conta sem convite por email.",
  },
};

export function userCreationError(error) {
  return creationErrors[error?.code] || null;
}
