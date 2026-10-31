import Platform from "./platform";
import "./platform.css";
import "../components/ui/workspace-panels.css";
import "../components/private/private-area.css";

export const metadata = { title: "Área reservada — BaticAmigo", robots: { index: false, follow: false } };

export default function AreaPage() {
  return <Platform />;
}
