import { Routes, Route, useNavigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { PdfViewerPage } from './pages/PdfViewerPage';
import { PDFDocument } from './types';

function App() {
  const navigate = useNavigate();

  const handleSelectPdf = (pdf: PDFDocument) => {
    navigate(`/pdf/${pdf.id}`);
  };

  return (
    <Routes>
      <Route path="/" element={<HomePage onSelectPdf={handleSelectPdf} />} />
      <Route path="/pdf/:id" element={<PdfViewerPage />} />
    </Routes>
  );
}

export default App;
