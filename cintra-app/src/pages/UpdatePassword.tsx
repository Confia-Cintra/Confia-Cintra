import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';

export default function UpdatePassword() {
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // The reset link logs the user into a temporary recovery session.
    // We just need to confirm a session exists before showing the form.
    supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError(t('As palavras-passe não coincidem.', "Passwords don't match."));
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-display font-bold text-2xl">Cintra</h1>
          <div className="flex bg-bg2 border border-cardBorder rounded-full p-0.5 font-mono text-xs">
            <button
              onClick={() => setLang('pt')}
              className={`px-3 py-1 rounded-full ${lang === 'pt' ? 'bg-accent text-bg0' : 'text-textFaint'}`}
            >
              PT
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-full ${lang === 'en' ? 'bg-accent text-bg0' : 'text-textFaint'}`}
            >
              EN
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display font-semibold text-lg mb-4">
            {t('Nova palavra-passe', 'New password')}
          </h2>

          {!ready ? (
            <p className="text-textMuted text-sm">
              {t(
                'A verificar o link de recuperação... Se chegaste aqui directamente, pede um novo link na página de entrada.',
                'Verifying reset link... If you got here directly, request a new link from the sign-in page.'
              )}
            </p>
          ) : done ? (
            <p className="text-success text-sm">
              {t('Palavra-passe actualizada. A redireccionar...', 'Password updated. Redirecting...')}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="password"
                required
                minLength={6}
                placeholder={t('Nova palavra-passe', 'New password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-bg2 border border-cardBorder rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder={t('Confirmar palavra-passe', 'Confirm password')}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="bg-bg2 border border-cardBorder rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
              />

              {error && <p className="text-danger text-xs">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="mt-2 bg-accent text-bg0 font-display font-semibold rounded-lg py-2.5 text-sm disabled:opacity-60"
              >
                {busy ? t('A processar...', 'Processing...') : t('Actualizar palavra-passe', 'Update password')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
