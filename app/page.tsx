import { getServerSideConfig } from "./config/server";
import { AppPage } from "./components/app-page";

export const maxDuration = 60;

export default function App() {
  const serverConfig = getServerSideConfig();

  return <AppPage isVercel={serverConfig?.isVercel} />;
}
