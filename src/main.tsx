import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import "./i18n";
import { Skeleton } from "./components/ui/skeleton.tsx";

const FullPageLoader = () => (
  <div className="flex items-center justify-center h-screen w-screen bg-background">
    <div className="w-full max-w-md p-8 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
    </div>
  </div>
);

createRoot(document.getElementById("root")!).render(
  <React.Suspense fallback={<FullPageLoader />}>
    <App />
  </React.Suspense>
);