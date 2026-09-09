import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Boxes, CheckCircle2, FileCheck2, Hexagon, Loader2, LogOut, MapPin, Plus, RefreshCw, ShieldCheck, TestTube2, Truck, Wheat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
type Role = "beekeeper" | "processor" | "lab" | "distributor" | "customer" | "admin";
interface UserInfo { username: string; role: Role; }
interface HoneyBatch { id: number; batch_id: string; beekeeper_name: string; location: string; hive_id: string; honey_type: string; harvest_date: string; quantity_kg: number; status: string; }

const roleMeta: Record<Role, { title: string; subtitle: string; description: string }> = {
  beekeeper: { title: "Beekeeper Dashboard", subtitle: "Hive-to-jar traceability", description: "Create your honey batches and monitor their verified journey through the supply chain." },
  processor: { title: "Processor Dashboard", subtitle: "Processing control center", description: "Record extraction, processing and bottling events for traceable honey batches." },
  lab: { title: "Laboratory Dashboard", subtitle: "Quality certification center", description: "Attach laboratory test certificates to honey batches and make quality evidence visible." },
  distributor: { title: "Distributor Dashboard", subtitle: "Distribution control center", description: "Record distribution events and keep the final leg of every honey batch traceable." },
  customer: { title: "Honey Passport", subtitle: "Public verification", description: "Customers verify a bottle by scanning its QR code; no supply-chain account is required." },
  admin: { title: "Admin Dashboard", subtitle: "HoneyChain control center", description: "Manage and verify honey traceability records across the complete supply chain." },
};

async function apiFetch(path: string, token: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || `Request failed (${response.status})`);
  return data;
}

function getSavedSession(): { token: string; user: UserInfo | null } {
  const token = localStorage.getItem("honeychain_access_token") || "";
  const rawUser = localStorage.getItem("honeychain_user");
  if (!rawUser) return { token, user: null };
  try { return { token, user: JSON.parse(rawUser) as UserInfo }; } catch { return { token, user: null }; }
}

function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<{ token: string; user: UserInfo | null }>({ token: "", user: null });
  const [batches, setBatches] = useState<HoneyBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [certificate, setCertificate] = useState({ certificate_id: "", laboratory_name: "", test_date: new Date().toISOString().slice(0, 10), test_result: "", quality_status: "Passed", notes: "" });
  const isChildRoute = location.pathname === "/dashboard/create-batch";

  useEffect(() => { setSession(getSavedSession()); }, []);
  const logout = () => { ["honeychain_access_token", "honeychain_user", "honeychain_username", "honeychain_role"].forEach((key) => localStorage.removeItem(key)); void navigate({ to: "/auth" }); };
  const loadBatches = async () => {
    if (!session.token) { setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const data = await apiFetch("/api/batches", session.token);
      setBatches(Array.isArray(data) ? data : []);
      if (!selectedBatchId && data?.[0]?.batch_id) setSelectedBatchId(data[0].batch_id);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load batches"); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (!isChildRoute) void loadBatches(); }, [session.token, isChildRoute]);

  const role = session.user?.role || "beekeeper";
  const meta = roleMeta[role];
  const activeCount = useMemo(() => batches.filter((b) => b.status.toLowerCase() !== "distributed").length, [batches]);
  const totalQuantity = useMemo(() => batches.reduce((sum, b) => sum + Number(b.quantity_kg || 0), 0), [batches]);
  const allowedEvents = useMemo(() => {
    if (role === "beekeeper" || role === "admin") return ["Harvested"];
    if (role === "processor") return ["Extracted", "Processed", "Bottled"];
    if (role === "lab") return ["Lab Tested"];
    if (role === "distributor") return ["Distributed"];
    return [];
  }, [role]);
  useEffect(() => { if (allowedEvents.length && !allowedEvents.includes(eventType)) setEventType(allowedEvents[0]); }, [allowedEvents, eventType]);
  if (isChildRoute) return <Outlet />;
  if (!session.token || !session.user) return <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground"><Card className="w-full max-w-md"><CardHeader className="text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-honey text-honey-foreground"><Hexagon className="h-6 w-6 fill-current" /></div><CardTitle className="mt-3">Login required</CardTitle><CardDescription>Sign in to access your HoneyChain role dashboard.</CardDescription></CardHeader><CardContent><Button className="w-full bg-honey-dark text-honey-dark-foreground hover:bg-honey-dark/90" onClick={() => void navigate({ to: "/auth" })}>Go to Login <ArrowRight className="ml-2 h-4 w-4" /></Button></CardContent></Card></div>;

  const createSupplyEvent = async (event: React.FormEvent) => {
    event.preventDefault(); setActionLoading(true); setError(""); setMessage("");
    try { await apiFetch("/api/supply-chain", session.token, { method: "POST", body: JSON.stringify({ batch_id: selectedBatchId, event_type: eventType, location: eventLocation, actor: session.user.username, notes: eventNotes || null }) }); setMessage(`${eventType} event recorded for ${selectedBatchId}.`); setEventLocation(""); setEventNotes(""); await loadBatches(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not record supply-chain event"); }
    finally { setActionLoading(false); }
  };
  const addCertificate = async (event: React.FormEvent) => {
    event.preventDefault(); setActionLoading(true); setError(""); setMessage("");
    try { await apiFetch(`/api/batches/${selectedBatchId}/lab-certificate`, session.token, { method: "POST", body: JSON.stringify(certificate) }); setMessage(`Lab certificate ${certificate.certificate_id} added to ${selectedBatchId}.`); setCertificate((c) => ({ ...c, certificate_id: "", test_result: "", notes: "" })); await loadBatches(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not add lab certificate"); }
    finally { setActionLoading(false); }
  };

  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b bg-background/95 backdrop-blur"><div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 py-2"><Link to="/" className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-honey text-honey-foreground"><Hexagon className="h-5 w-5 fill-current" /></div><div><p className="font-bold tracking-tight">HoneyChain</p><p className="text-xs text-muted-foreground">{meta.subtitle}</p></div></Link><div className="flex items-center gap-2"><div className="hidden text-right sm:block"><p className="text-sm font-semibold">{session.user.username}</p><p className="text-xs capitalize text-muted-foreground">{role}</p></div><Button variant="ghost" size="sm" onClick={logout}><LogOut className="mr-2 h-4 w-4" /> Log out</Button></div></div></header>
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><Badge variant="secondary" className="mb-3"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> Role: {role}</Badge><h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{meta.title}</h1><p className="mt-2 max-w-2xl text-muted-foreground">{meta.description}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void loadBatches()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>{(role === "beekeeper" || role === "admin") && <Button asChild className="bg-honey-dark text-honey-dark-foreground hover:bg-honey-dark/90"><Link to="/dashboard/create-batch"><Plus className="mr-2 h-4 w-4" /> Create Batch</Link></Button>}</div></div>
      {error && <Card className="border-destructive/40"><CardContent className="flex items-center gap-3 pt-6 text-sm text-destructive"><AlertCircle className="h-5 w-5" /><span>{error}</span></CardContent></Card>}
      {message && <Card className="border-leaf/30 bg-leaf-light/30"><CardContent className="flex items-center gap-3 pt-6 text-sm"><CheckCircle2 className="h-5 w-5 text-green-600" /><span>{message}</span></CardContent></Card>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard title="Total Batches" value={batches.length} icon={<Boxes className="h-5 w-5" />} /><StatCard title="Active Batches" value={activeCount} icon={<CheckCircle2 className="h-5 w-5" />} /><StatCard title="Honey Recorded" value={`${totalQuantity.toFixed(1)} kg`} icon={<Hexagon className="h-5 w-5" />} /><StatCard title="Network" value="Sepolia" icon={<ShieldCheck className="h-5 w-5" />} /></div>
      {allowedEvents.length > 0 && <Card><CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-honey-dark" /> Supply-chain action</CardTitle><CardDescription>Record the stage you are authorized to perform. The logged-in username is used as the actor.</CardDescription></CardHeader><CardContent><form onSubmit={createSupplyEvent} className="grid gap-4 md:grid-cols-2"><BatchSelect id="event-batch" value={selectedBatchId} onChange={setSelectedBatchId} batches={batches} /><div className="space-y-2"><Label htmlFor="event-type">Stage</Label><select id="event-type" value={eventType} onChange={(e) => setEventType(e.target.value)} required className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">{allowedEvents.map((item) => <option key={item}>{item}</option>)}</select></div><div className="space-y-2"><Label htmlFor="event-location">Location</Label><Input id="event-location" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Chennai, Tamil Nadu" required /></div><div className="space-y-2"><Label htmlFor="event-notes">Notes</Label><Input id="event-notes" value={eventNotes} onChange={(e) => setEventNotes(e.target.value)} placeholder="Optional note" /></div><Button type="submit" disabled={actionLoading || !selectedBatchId} className="w-full md:w-fit bg-honey-dark text-honey-dark-foreground hover:bg-honey-dark/90">{actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />} Record {eventType || "Event"}</Button></form></CardContent></Card>}
      {role === "lab" && <Card><CardHeader><CardTitle className="flex items-center gap-2"><TestTube2 className="h-5 w-5 text-honey-dark" /> Lab certification</CardTitle><CardDescription>Attach laboratory quality evidence to a selected honey batch.</CardDescription></CardHeader><CardContent><form onSubmit={addCertificate} className="grid gap-4 md:grid-cols-2"><BatchSelect id="cert-batch" value={selectedBatchId} onChange={setSelectedBatchId} batches={batches} /><Field label="Certificate ID" id="certificate_id" value={certificate.certificate_id} placeholder="LAB-2026-001" onChange={(v) => setCertificate((c) => ({ ...c, certificate_id: v }))} required /><Field label="Laboratory name" id="laboratory_name" value={certificate.laboratory_name} placeholder="Honey Quality Lab" onChange={(v) => setCertificate((c) => ({ ...c, laboratory_name: v }))} required /><Field label="Test date" id="test_date" type="date" value={certificate.test_date} onChange={(v) => setCertificate((c) => ({ ...c, test_date: v }))} required /><Field label="Test result" id="test_result" value={certificate.test_result} placeholder="Meets required quality parameters" onChange={(v) => setCertificate((c) => ({ ...c, test_result: v }))} required /><div className="space-y-2"><Label htmlFor="quality_status">Quality status</Label><select id="quality_status" value={certificate.quality_status} onChange={(e) => setCertificate((c) => ({ ...c, quality_status: e.target.value }))} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"><option>Passed</option><option>Failed</option><option>Pending</option></select></div><Field label="Notes" id="certificate_notes" value={certificate.notes} placeholder="Optional certificate notes" onChange={(v) => setCertificate((c) => ({ ...c, notes: v }))} /><Button type="submit" disabled={actionLoading || !selectedBatchId} className="w-full md:w-fit bg-honey-dark text-honey-dark-foreground hover:bg-honey-dark/90"><FileCheck2 className="mr-2 h-4 w-4" /> Add Lab Certificate</Button></form></CardContent></Card>}
      <Card><CardHeader><CardTitle>Honey batches</CardTitle><CardDescription>Authenticated batch records available to your current role.</CardDescription></CardHeader><CardContent>{loading ? <div className="flex min-h-40 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading batches…</div> : batches.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center"><Wheat className="mx-auto h-10 w-10 text-muted-foreground" /><h3 className="mt-4 font-semibold">No batches available</h3><p className="mt-1 text-sm text-muted-foreground">{role === "beekeeper" ? "Create your first honey batch to start the traceability journey." : "Once a batch is available, you can perform your authorized action here."}</p></div> : <div className="grid gap-4 md:grid-cols-2">{batches.map((batch) => <Card key={batch.id} className="overflow-hidden border-muted shadow-sm"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-lg font-bold">{batch.batch_id}</p><p className="text-sm text-muted-foreground">{batch.honey_type} honey</p></div><Badge variant="outline" className="capitalize">{batch.status}</Badge></div><div className="mt-5 grid grid-cols-2 gap-4 text-sm"><Info label="Hive" value={batch.hive_id} /><Info label="Quantity" value={`${batch.quantity_kg} kg`} /><Info label="Harvest" value={batch.harvest_date} /><div><p className="text-xs text-muted-foreground">Location</p><p className="mt-1 flex items-center gap-1 font-medium"><MapPin className="h-3.5 w-3.5" />{batch.location}</p></div></div><Button asChild variant="outline" className="mt-5 w-full"><Link to="/passport/$batchId" params={{ batchId: batch.batch_id }}>Open Honey Passport <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></CardContent></Card>)}</div>}</CardContent></Card>
    </main>
  </div>;
}
function BatchSelect({ id, value, onChange, batches }: { id: string; value: string; onChange: (value: string) => void; batches: HoneyBatch[] }) { return <div className="space-y-2"><Label htmlFor={id}>Honey batch</Label><select id={id} value={value} onChange={(e) => onChange(e.target.value)} required className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"><option value="" disabled>Select a batch</option>{batches.map((b) => <option key={b.batch_id} value={b.batch_id}>{b.batch_id}</option>)}</select></div>; }
function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) { return <Card><CardContent className="flex items-center gap-4 p-5"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-honey/15 text-honey-dark">{icon}</div><div><p className="text-sm text-muted-foreground">{title}</p><p className="mt-1 text-2xl font-bold">{value}</p></div></CardContent></Card>; }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>; }
function Field({ label, id, value, onChange, placeholder, type = "text", required = false }: { label: string; id: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean }) { return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} required={required} /></div>; }
