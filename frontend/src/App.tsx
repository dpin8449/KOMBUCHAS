import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BatchList } from './pages/BatchList';
import { BatchDetail } from './pages/BatchDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BatchList />} />
        <Route path="/batch/:id" element={<BatchDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
