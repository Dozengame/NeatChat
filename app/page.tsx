import { getServerSideConfig } from "./config/server";
import { AppPage } from "./components/app-page";
import { unstable_noStore as noStore } from "next/cache";
import type { Metadata } from "next";

export const maxDuration = 60;

export const metadata: Metadata = {
  title: "NeatChat",
  description: "Your personal ChatGPT Chat Bot.",
};

export default function App() {
  if (process.env.BUILD_MODE !== "export") {
    noStore();
  }

  const serverConfig = getServerSideConfig();

  return <AppPage isVercel={serverConfig?.isVercel} />;
}
