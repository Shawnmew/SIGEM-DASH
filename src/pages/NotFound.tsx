// src/pages/NotFound.tsx
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Página não encontrada</p>
        <Link
          to="/"
          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;