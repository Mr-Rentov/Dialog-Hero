import Button from "../components/ui/Button";

function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-5xl font-semibold tracking-tight text-foreground">
          Willkommen bei Dialog Hero
        </h1>
        <p className="mt-4 text-lg text-secondary-text">
          Lade dein Drehbuch hoch und starte die Analyse.
        </p>
        <div className="mt-10">
          <Button>Drehbuch hochladen</Button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
