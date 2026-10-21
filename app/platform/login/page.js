import PlatformLogin from "../login-view";
import "../../area/platform.css";
import "../../components/private/private-area.css";

export const metadata = { title: "Acesso à plataforma | BaticAmigo", robots: { index: false, follow: false } };

export default function PlatformLoginPage() {
  return <PlatformLogin />;
}
