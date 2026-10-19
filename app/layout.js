import "./globals.css";
import "./site.css";

export const metadata = {
  title: "BaticAmigo — Mais perto. Mais juntos.",
  description: "Associação BaticAmigo: desporto, cultura, educação e apoio social ao serviço de todos.",
};

export default function RootLayout({ children }) {
  return <html lang="pt"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"/><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"/></head><body className="app-body">{children}</body></html>;
}
