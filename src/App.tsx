import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Workbench from "@/pages/Workbench";
import History from "@/pages/History";
import Preview from "@/pages/Preview";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Workbench />} />
          <Route path="/history" element={<History />} />
          <Route path="/preview/:taskId" element={<Preview />} />
        </Route>
      </Routes>
    </Router>
  );
}
