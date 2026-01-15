import React, { useState } from 'react';
import { Wallet, Lock, User, Loader2 } from 'lucide-react';
import { auth } from '../firebase';
import { signInAnonymously } from 'firebase/auth';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username === 'shake' && password === 'lulaladrao') {
      setLoading(true);
      try {
        // Attempt to sign in anonymously to satisfy Firestore Security Rules
        await signInAnonymously(auth);
        onLogin();
      } catch (err: any) {
        console.error("Firebase Auth Error:", err);
        // If anonymous auth is not enabled in console, we might still proceed 
        // if the user has public rules, but usually this error means we need to warn them.
        if (err.code === 'auth/operation-not-allowed') {
          // If auth is disabled but credentials are correct, try to proceed anyway.
          // The App component will catch the Firestore permission error if rules are strict.
          onLogin();
        } else {
          setError('Erro de conexão com o servidor. Tente novamente.');
        }
      } finally {
        setLoading(false);
      }
    } else {
      setError('Credenciais inválidas. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="bg-secondary p-8 rounded-3xl shadow-2xl border border-accent/30 w-full max-w-md relative overflow-hidden">
        
        {/* Background glow effect */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/30">
            <Wallet className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">SHAKE CRED</h1>
          <p className="text-slate-400 mt-2">Acesso Restrito</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Usuário</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-dark/80 border border-accent rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="Identificação"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark/80 border border-accent rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-emerald-600 text-dark font-bold py-4 rounded-xl shadow-lg shadow-primary/25 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Acessando...
              </>
            ) : (
              'ENTRAR'
            )}
          </button>
        </form>
        
        <p className="text-center text-slate-600 text-xs mt-8">
          Sistema Seguro v2.1 • Shake Cred Inc.
        </p>
      </div>
    </div>
  );
};

export default Login;