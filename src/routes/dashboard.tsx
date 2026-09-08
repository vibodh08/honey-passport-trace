import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Hexagon,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/dashboard")({
  component: BeekeeperDashboard,
});

const API_BASE_URL = "https://honeychain-backend-gurw.onrender.com";

interface HoneyBatch {
  id: number;
  batch_id: string;
  beekeeper_name: string;
  location: string;
  hive_id: string;
  honey_type: string;
  harvest_date: string;
  quantity_kg: number;
  status: string;
}

async function fetchBatches(): Promise<HoneyBatch[]> {
  const response = await fetch(`${API_BASE_URL}/api/batches`);
  if (!response.ok) throw new Error("Could not load honey batches");
  return response.json();
}

function BeekeeperDashboard() {
  const location = useLocation();

  // /dashboard/create-batch is a child route of /dashboard.
  // Let the child route render instead of the dashboard shell.
  if (location.pathname === "/dashboard/create-batch") {
    return <Outlet />;
  }

  const [batches, setBatches] = useState<HoneyBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBatches = async () => {
    setLoading(true);
    setError("");
    try {
      setBatches(await fetchBatches());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load batches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBatches();
  }, []);

  const activeCount = useMemo(
    () => batches.filter((batch) => batch.status.toLowerCase() !== "distributed").length,
    [batches],
  );

  const totalQuantity = useMemo(
    () => batches.reduce((sum, batch) => sum + Number(batch.quantity_kg || 0), 0),
    [batches],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-honey text-honey-foreground">
              <Hexagon className="h-5 w-5 fill-current" />
            </div>
            <div>
              <p className="font-bold tracking-tight">HoneyChain</p>
              <p className="text-xs text-muted-foreground">Beekeeper Console</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void loadBatches()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" className="bg-honey-dark text-honey-dark-foreground hover:bg-honey-dark/90" onClick={() => { window.location.href = "/dashboard/create-batch"; }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Batch
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge variant="secondary" className="mb-3">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" />
              Traceability control center
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Beekeeper Dashboard</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Create honey batches, monitor traceability records, and send verified batch metadata to the HoneyChain blockchain.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/passport/$batchId" params={{ batchId: batches[0]?.batch_id || "HC-2026-0002" }}>
              View Passport <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {error && (
          <Card className="border-destructive/40">
            <CardContent className="flex items-center gap-3 pt-6 text-sm">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span>{error}</span>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Batches" value={batches.length} icon={<Boxes className="h-5 w-5" />} />
          <StatCard title="Active Batches" value={activeCount} icon={<CheckCircle2 className="h-5 w-5" />} />
          <StatCard title="Honey Recorded" value={`${totalQuantity.toFixed(1)} kg`} icon={<Hexagon className="h-5 w-5" />} />
          <StatCard title="Blockchain" value="Sepolia" icon={<ShieldCheck className="h-5 w-5" />} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Honey batches</CardTitle>
            <CardDescription>Every batch created through the FastAPI backend appears here.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex min-h-40 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading batches…
              </div>
            ) : batches.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center">
                <Boxes className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">No batches yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Create your first honey batch to start the hive-to-jar journey.</p>
                <Button className="mt-5 bg-honey-dark text-honey-dark-foreground hover:bg-honey-dark/90" onClick={() => { window.location.href = "/dashboard/create-batch"; }}>
                  <Plus className="mr-2 h-4 w-4" />Create First Batch
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {batches.map((batch) => (
                  <Card key={batch.id} className="overflow-hidden border-muted shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold">{batch.batch_id}</p>
                          <p className="text-sm text-muted-foreground">{batch.honey_type} honey</p>
                        </div>
                        <Badge variant="outline" className="capitalize">{batch.status}</Badge>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                        <Info label="Hive" value={batch.hive_id} />
                        <Info label="Quantity" value={`${batch.quantity_kg} kg`} />
                        <Info label="Harvest" value={batch.harvest_date} />
                        <div>
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="mt-1 flex items-center gap-1 font-medium"><MapPin className="h-3.5 w-3.5" />{batch.location}</p>
                        </div>
                      </div>
                      <Button asChild variant="outline" className="mt-5 w-full">
                        <Link to="/passport/$batchId" params={{ batchId: batch.batch_id }}>
                          Open Honey Passport <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-honey/15 text-honey-dark">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
