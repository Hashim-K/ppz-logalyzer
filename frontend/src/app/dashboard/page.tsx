import { Metadata } from "next";
import DashboardPage from "@/components/DashboardPage";

export const metadata: Metadata = {
  title: "Dashboard | PPZ-Logalyzer",
  description: "Real-time flight data analysis dashboard",
};

export default function Dashboard() {
  return <DashboardPage />;
}
