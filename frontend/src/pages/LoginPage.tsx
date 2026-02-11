import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        setError(axiosErr.response?.data?.detail ?? "Anmeldung fehlgeschlagen.");
      } else {
        setError("Anmeldung fehlgeschlagen.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-20 max-w-sm px-4">
      <h1 className="mb-6 text-center text-2xl font-bold text-foreground">Anmelden</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-error/10 px-4 py-2.5 text-[13px] text-error">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-[13px] font-medium text-foreground">
            E-Mail
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[14px] text-foreground outline-none transition-colors focus:border-primary"
            placeholder="name@beispiel.de"
          />
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-foreground">
            Passwort
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[14px] text-foreground outline-none transition-colors focus:border-primary"
            placeholder="Passwort"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {submitting ? "Wird angemeldet..." : "Anmelden"}
        </button>
      </form>

      <p className="mt-4 text-center text-[13px] text-secondary-text">
        Noch kein Konto?{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Registrieren
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
