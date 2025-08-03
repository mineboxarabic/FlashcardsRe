import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { DeveloperCredit } from "./developer-credit";
import { FloatingCreateButton } from "./FloatingCreateButton";

const DashboardLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="py-8">
        <DeveloperCredit />
      </footer>
      <FloatingCreateButton />
    </div>
  );
};

export default DashboardLayout;