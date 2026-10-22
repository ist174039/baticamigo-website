import test from "node:test";
import assert from "node:assert/strict";
import { platformContinueUrl } from "../../lib/platform/continue-url.mjs";
import { userCreationError } from "../../lib/platform/user-creation-error.mjs";

test("invitation and reset links use the Firebase-authorized canonical host", () => {
  assert.equal(platformContinueUrl(), "https://baticamigo-website.vercel.app/platform/login");
});

test("an existing Firebase email receives a conflict that guides account linking", () => {
  assert.deepEqual(userCreationError({ code: "auth/email-already-exists" }), {
    status: 409,
    message: "Já existe uma conta com este email. Procure o email na lista de utilizadores e associe o registo à conta existente.",
  });
});

test("invite-domain failures have a safe next step and do not expose Firebase details", () => {
  const result = userCreationError({ code: "auth/unauthorized-continue-uri" });
  assert.equal(result.status, 503);
  assert.match(result.message, /palavra-passe temporária/);
  assert.doesNotMatch(result.message, /Firebase|unauthorized-continue-uri/i);
  assert.equal(userCreationError({ code: "auth/unknown" }), null);
});
