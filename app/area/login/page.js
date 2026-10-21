import AreaLogin from "../login-view";
import "../platform.css";
import "../../components/private/private-area.css";

export const metadata = { title: "Acesso à área reservada | BaticAmigo", robots: { index: false, follow: false } };

export default function AreaLoginPage() {
  return <AreaLogin />;
}
