// Firebase Auth only accepts continue URLs on configured Firebase Auth domains.
// Keep account invitations and password resets on the canonical production host.
export const platformContinueUrl = () => "https://baticamigo-website.vercel.app/platform/login";
