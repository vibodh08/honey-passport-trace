import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Hexagon, QrCode, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HoneyChain — Traceable Honey from Hive to Jar" },
      {
        name: "description",
        content:
          "HoneyChain verifies the journey of every honey batch using blockchain-powered traceability.",
      },
      {
        property: "og:title",
        content: "HoneyChain — Traceable Honey from Hive to Jar",
      },
      {
        property: "og:description",
        content:
          "HoneyChain verifies the journey of every honey batch using blockchain-powered traceability.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-5xl items-center gap-2 px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-honey text-honey-foreground">
            <Hexagon className="h-5 w-5 fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight">HoneyChain</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-honey text-honey-foreground shadow-xl">
          <Hexagon className="h-10 w-10 fill-current" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
          HoneyChain
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground md:text-xl">
          Blockchain-powered traceability for honey. Scan any bottle to verify
          its journey from hive to jar.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="bg-honey-dark text-honey-dark-foreground hover:bg-honey-dark/90"
          >
            <Link to="/passport/$batchId" params={{ batchId: "HC-2026-0002" }}>
              <QrCode className="mr-2 h-4 w-4" />
              View Demo Passport
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/passport/$batchId" params={{ batchId: "HC-2026-0002" }}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Verify Batch HC-2026-0002
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid max-w-3xl gap-6 sm:grid-cols-3">
          <Feature
            title="Hive to Jar"
            description="Track every step of the honey supply chain."
          />
          <Feature
            title="Blockchain Verified"
            description="Immutable records on the HoneyChain network."
          />
          <Feature
            title="Lab Tested"
            description="Quality and purity metrics for every batch."
          />
        </div>
      </main>

      <footer className="border-t bg-background py-6 text-center text-sm text-muted-foreground">
        <p>Smart India Hackathon 2026 · HoneyChain Demo</p>
      </footer>
    </div>
  );
}

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 text-center shadow-sm">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
