import { DM_Sans, Manrope } from "next/font/google";
import "./globals.css";
import "./site.css";

const bodyFont=DM_Sans({subsets:["latin"],display:"swap",variable:"--font-body"});
const displayFont=Manrope({subsets:["latin"],display:"swap",variable:"--font-display"});

export const metadata = {
  title: "BaticAmigo — Mais perto. Mais juntos.",
  description: "Associação BaticAmigo: desporto, cultura, educação e apoio social ao serviço de todos.",
};

export default function RootLayout({ children }) {
  return <html lang="pt"><head><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"/></head><body className={`app-body ${bodyFont.variable} ${displayFont.variable}`}>{children}</body></html>;
}
