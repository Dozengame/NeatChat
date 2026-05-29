import { getServerSideConfig } from "./config/server";
import { AppPage } from "./components/app-page";
import { unstable_noStore as noStore } from "next/cache";

export const maxDuration = 60;

export default function App() {
  if (process.env.BUILD_MODE !== "export") {
    noStore();
  }

  const serverConfig = getServerSideConfig();

  return <AppPage isVercel={serverConfig?.isVercel} />;
}
