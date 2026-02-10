import Button from "../components/ui/Button";

function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
          Willkommen bei Dialog Hero
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Lade dein Drehbuch hoch und starte die Analyse.
        </p>
        <div className="mt-8">
          <Button>Drehbuch hochladen</Button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
