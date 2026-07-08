import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { WinterDashboard } from "@/pages/WinterDashboard";
import { ResearchLibrary } from "@/pages/ResearchLibrary";
import { DailyReview } from "@/pages/DailyReview";
import { Intel } from "@/pages/Intel";
import { Sectors } from "@/pages/Sectors";
import { SectorDetail } from "@/pages/SectorDetail";
import { Portfolio } from "@/pages/Portfolio";
import { StockData } from "@/pages/StockData";
import { Notes } from "@/pages/Notes";
import { Settings } from "@/pages/Settings";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Navigate to="/winter" replace /> },
      { path: "/winter", element: <WinterDashboard /> },
      { path: "/research-library", element: <ResearchLibrary /> },
      { path: "/daily-review", element: <DailyReview /> },
      { path: "/intel", element: <Intel /> },
      { path: "/sectors", element: <Sectors /> },
      { path: "/sectors/:key", element: <SectorDetail /> },
      { path: "/portfolio", element: <Portfolio /> },
      { path: "/stock-data", element: <StockData /> },
      { path: "/notes", element: <Notes /> },
      { path: "/settings", element: <Settings /> },
    ],
  },
]);
