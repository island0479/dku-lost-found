import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ItemList from './pages/ItemList';
import ItemDetail from './pages/ItemDetail';
import ItemForm from './pages/ItemForm';
import MyItems from './pages/MyItems';
import Login from './pages/Login';
import Signup from './pages/Signup';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <div className="container py-4">
          <Routes>
            <Route path="/" element={<ItemList />} />
            <Route path="/item/new" element={<ItemForm />} />
            <Route path="/item/:id" element={<ItemDetail />} />
            <Route path="/item/:id/edit" element={<ItemForm />} />
            <Route path="/my" element={<MyItems />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
