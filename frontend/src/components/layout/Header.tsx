import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-5xl items-center px-6">
        <Link
          to="/"
          className="text-[17px] font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
        >
          Dialog Hero
        </Link>
      </div>
    </header>
  );
}

export default Header;
