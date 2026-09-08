import { FormEvent, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Hexagon,
  Loader2,
  LockKeyhole,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/dashboard/create-batch")({
  component: CreateBatchPage,
});

const API_BASE_URL = "https://honeychain-backend-gurw.onrender.com";

interface LoginResponse {
  access_token: string;
  token_type: string;
  username: string;
  role: string;
}

interface CreateBatchResponse {
  message: string;
  blockchain_registered: boolean;
  blockchain_error?: string;
  metadata_hash?: string;
  passport_url?: string;
  qr_url?: string;
  blockchain?: {
    network: string;
    transaction_hash: string;
    block_number: number;
    registered_by: string;
    contract_address: string;
  };
  batch: {
    batch_id: string;
    beekeeper_name: string;
    location: string;
    hive_id: string;
    honey_type: string;
    harvest_date: string;
    quantity_kg: number;
    status: string;
  };
}

function CreateBatchPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CreateBatchResponse | null>(null);

  const [form, setForm] = useState({
    batch_id: "",
    beekeeper_name: "",
    location: "",
    hive_id: "",
    honey_type: "",
    harvest_date: new Date().toISOString().slice(0, 10),
    quantity_kg: "",
    status: "Harvested",
  });

  useEffect(() => {
    const savedToken = localStorage.getItem("honeychain_access_token");
    const savedUsername = localStorage.getItem("honeychain_username");
    const savedRole = localStorage.getItem("honeychain_role");
    if (savedToken) setToken(savedToken);
    if (savedUsername) setUsername(savedUsername);
    if (savedRole) setRole(savedRole);
  }, []);

  const updateField = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setLoginLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      setToken(data.access_token);
      setUsername(data.username);
      setRole(data.role);
      localStorage.setItem("honeychain_access_token", data.access_token);
      localStorage.setItem("honeychain_username", data.username);
      localStorage.setItem("honeychain_role", data.role);
      setShowLogin(false);
      setLoginPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const createBatch = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setResult(null);

    if (!token) {
      setShowLogin(true);
      setError("Please log in as a beekeeper before creating a batch.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/batches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          quantity_kg: Number(form.quantity_kg),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("honeychain_access_token");
          setToken("");
          setShowLogin(true);
        }
        throw new Error(data.detail || "Could not create honey batch");
      }

      setResult(data);
      setForm((current) => ({
        ...current,
        batch_id: "",
        hive_id: "",
        quantity_kg: "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create honey batch");
    } finally {
      setSubmitting(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("honeychain_access_token");
    localStorage.removeItem("honeychain_username");
    localStorage.removeItem("honeychain_role");
    setToken("");
    setUsername("");
    setRole("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-honey text-honey-foreground">
              <Hexagon className="h-5 w-5 fill-current" />
            </div>
            <div>
              <p className="font-bold tracking-tight">HoneyChain</p>
              <p className="text-xs text-muted-foreground">Create Honey Batch</p>
            </div>
          </Link>
          {token && (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{username}</p>
                <p className="text-xs capitalize text-muted-foreground">{role}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>Log out</Button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Button asChild variant="ghost" className="mb-5 -ml-2">
          <Link to="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to dashboard</Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader>
              <Badge variant="secondary" className="mb-2 w-fit">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" /> On-chain registration enabled
              </Badge>
              <CardTitle className="text-2xl">Create a new honey batch</CardTitle>
              <CardDescription>
                Submit batch metadata to FastAPI. HoneyChain will save it to PostgreSQL, generate a SHA-256 metadata hash, and register that hash on Sepolia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {error}
                </div>
              )}

              {!token && !showLogin && (
                <div className="mb-6 rounded-xl border border-dashed p-5">
                  <div className="flex items-start gap-3">
                    <LockKeyhole className="mt-0.5 h-5 w-5 text-honey-dark" />
                    <div className="flex-1">
                      <p className="font-semibold">Beekeeper login required</p>
                      <p className="mt-1 text-sm text-muted-foreground">The FastAPI endpoint protects batch creation with the beekeeper/admin role.</p>
                    </div>
                    <Button onClick={() => setShowLogin(true)}>Log in</Button>
                  </div>
                </div>
              )}

              {showLogin && !token && (
                <form onSubmit={login} className="mb-6 rounded-xl border bg-muted/20 p-5">
                  <div className="mb-4">
                    <p className="font-semibold">Beekeeper login</p>
                    <p className="text-sm text-muted-foreground">Use an account already registered in HoneyChain.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username</Label>
                      <Input id="login-username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                    </div>
                  </div>
                  <Button type="submit" disabled={loginLoading} className="mt-4 bg-honey-dark text-honey-dark-foreground hover:bg-honey-dark/90">
                    {loginLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-2 h-4 w-4" />}
                    {loginLoading ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
              )}

              <form onSubmit={createBatch} className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Batch ID" id="batch_id" value={form.batch_id} placeholder="HC-2026-0003" onChange={updateField} required />
                  <Field label="Beekeeper name" id="beekeeper_name" value={form.beekeeper_name} placeholder="Your name / apiary" onChange={updateField} required />
                  <Field label="Location" id="location" value={form.location} placeholder="Chennai, Tamil Nadu" onChange={updateField} required />
                  <Field label="Hive ID" id="hive_id" value={form.hive_id} placeholder="HIVE-001" onChange={updateField} required />
                  <Field label="Honey type" id="honey_type" value={form.honey_type} placeholder="Multi-floral" onChange={updateField} required />
                  <Field label="Harvest date" id="harvest_date" type="date" value={form.harvest_date} onChange={updateField} required />
                  <Field label="Quantity (kg)" id="quantity_kg" type="number" min="0.1" step="0.1" value={form.quantity_kg} placeholder="25" onChange={updateField} required />
                  <div className="space-y-2">
                    <Label htmlFor="status">Initial status</Label>
                    <select id="status" value={form.status} onChange={(e) => updateField("status", e.target.value)} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">
                      <option>Harvested</option>
                      <option>Created</option>
                    </select>
                  </div>
                </div>

                <Button type="submit" size="lg" disabled={submitting} className="w-full bg-honey-dark text-honey-dark-foreground hover:bg-honey-dark/90 sm:w-fit">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  {submitting ? "Registering batch…" : "Create & Register Batch"}
                </Button>
              </form>

              {result && (
                <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
                    <div className="min-w-0">
                      <p className="font-bold">{result.message}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Batch {result.batch.batch_id} has been saved and registered on the blockchain.</p>
                      {result.metadata_hash && <p className="mt-3 break-all text-xs text-muted-foreground">Metadata hash: {result.metadata_hash}</p>}
                      {result.blockchain?.transaction_hash && <p className="mt-1 break-all text-xs text-muted-foreground">Transaction: {result.blockchain.transaction_hash}</p>}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button asChild size="sm">
                          <Link to="/passport/$batchId" params={{ batchId: result.batch.batch_id }}>Open Passport</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link to="/dashboard">Back to Dashboard</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">What happens next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <Step n="1" title="Save batch" text="FastAPI stores the batch in PostgreSQL." />
              <Step n="2" title="Hash metadata" text="Important batch fields are converted into a deterministic SHA-256 hash." />
              <Step n="3" title="Register on-chain" text="The hash is written to the HoneyChain smart contract on Sepolia." />
              <Step n="4" title="Verify publicly" text="The QR passport can display the batch and its blockchain verification state." />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  step,
  required,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (id: string, value: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
  step?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} placeholder={placeholder} min={min} step={step} onChange={(e) => onChange(id, e.target.value)} required={required} />
    </div>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-honey/20 text-sm font-bold text-honey-dark">{n}</div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
