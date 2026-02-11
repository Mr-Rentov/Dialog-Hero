import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-6">
        <Link
          to="/"
          className="text-[17px] font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
        >
          Dialog Hero
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-[13px] text-secondary-text">
                {user.display_name || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-border px-3 py-1 text-[13px] font-medium text-foreground transition-colors hover:bg-background"
              >
                Abmelden
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-primary px-3 py-1 text-[13px] font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Anmelden
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
