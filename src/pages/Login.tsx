import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';

export default function Login() {
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
        setResetSent(true);
        return;
      }
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          // Single-institution pilot for now — every signup joins UEM.
          // When this supports multiple institutions, replace this with
          // an institution picker in the signup form.
          const { data: institution } = await supabase
            .from('institutions')
            .select('id')
            .eq('slug', 'uem')
            .single();

          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullName,
            role: 'student',
            institution_id: institution?.id ?? null,
          });
          if (profileError) throw profileError;
        }
      }
      navigate('/');
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
            {mode === 'signin'
              ? t('Entrar', 'Sign in')
              : mode === 'signup'
              ? t('Criar conta', 'Create account')
              : t('Recuperar palavra-passe', 'Reset password')}
          </h2>

          {mode === 'forgot' && resetSent ? (
            <div className="text-sm text-textMuted">
              <p className="mb-4">
                {t(
                  'Se existir uma conta com esse email, enviámos um link para repor a palavra-passe. Verifica a tua caixa de entrada.',
                  "If an account exists with that email, we've sent a password reset link. Check your inbox."
                )}
              </p>
              <button
                onClick={() => {
                  setMode('signin');
                  setResetSent(false);
                }}
                className="text-accent text-xs"
              >
                {t('← Voltar para entrar', '← Back to sign in')}
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {mode === 'signup' && (
                  <input
                    type="text"
                    required
                    placeholder={t('Nome completo', 'Full name')}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-bg2 border border-cardBorder rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                )}
                <input
                  type="email"
                  required
                  placeholder={t('Email', 'Email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-bg2 border border-cardBorder rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                />
                {mode !== 'forgot' && (
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder={t('Palavra-passe', 'Password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-bg2 border border-cardBorder rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                )}

                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-left text-xs text-textMuted hover:text-accent -mt-1"
                  >
                    {t('Esqueceu a palavra-passe?', 'Forgot password?')}
                  </button>
                )}

                {error && <p className="text-danger text-xs">{error}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-2 bg-accent text-bg0 font-display font-semibold rounded-lg py-2.5 text-sm disabled:opacity-60"
                >
                  {busy
                    ? t('A processar...', 'Processing...')
                    : mode === 'signin'
                    ? t('Entrar', 'Sign in')
                    : mode === 'signup'
                    ? t('Criar conta', 'Create account')
                    : t('Enviar link de recuperação', 'Send reset link')}
                </button>
              </form>

              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="w-full text-center text-xs text-textMuted mt-4"
              >
                {mode === 'signin'
                  ? t('Não tem conta? Criar uma', "Don't have an account? Create one")
                  : mode === 'signup'
                  ? t('Já tem conta? Entrar', 'Already have an account? Sign in')
                  : t('← Voltar para entrar', '← Back to sign in')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
