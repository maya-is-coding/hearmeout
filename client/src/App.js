import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Intro from './pages/Intro';
import Landing from './pages/Landing';
import Room from './pages/Room';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/room" element={<Room />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;