import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { ArrowLeft, Hexagon, LogIn, UserPlus } from "lucide-react";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const roles = [
  { value: "beekeeper", label: "Beekeeper / Harvester" },
  { value: "processor", label: "Processor" },
  { value: "lab", label: "Laboratory" },
  { value: "distributor", label: "Distributor" },
];

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "HoneyChain — Login & Sign Up" },
      {
        name: "description",
        content: "Sign in to manage honey batches and supply-chain records.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("beekeeper");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "signup") {
        const response = await fetch(`${API_BASE_URL}/api/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, role }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.detail || "Unable to create account");
        }

        setMessage("Account created successfully. You can now log in.");
        setMode("login");
        setPassword("");
        return;
      }

      const form = new URLSearchParams();
      form.set("username", username);
      form.set("password", password);

      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || "Invalid username or password");
      }

      localStorage.setItem("honeychain_access_token", data.access_token);
      localStorage.setItem(
        "honeychain_user",
        JSON.stringify({ username: data.username, role: data.role })
      );

      await navigate({ to: "/dashboard" });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-honey text-honey-foreground">
              <Hexagon className="h-5 w-5 fill-current" />
            </span>
            <span className="text-xl">HoneyChain</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 px-4 py-12 lg:grid-cols-2">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-honey-light px-3 py-1.5 text-sm font-medium text-honey-foreground">
              <Hexagon className="h-4 w-4 fill-current" />
              Hive-to-Jar Traceability
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight">
              Manage every honey batch with confidence.
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              HoneyChain connects beekeepers, processors, laboratories and
              distributors through one traceable supply-chain platform.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <InfoCard title="Beekeeper" text="Create and track your honey batches." />
              <InfoCard title="Processor" text="Record extraction and processing stages." />
              <InfoCard title="Laboratory" text="Attach trusted quality certificates." />
              <InfoCard title="Distributor" text="Record the journey to the customer." />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border bg-card p-6 shadow-xl sm:p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "login"
                  ? "Sign in to your HoneyChain workspace."
                  : "Join HoneyChain as a supply-chain participant."}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setMessage("");
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  mode === "login"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LogIn className="mr-2 inline h-4 w-4" />
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setMessage("");
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  mode === "signup"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserPlus className="mr-2 inline h-4 w-4" />
                Sign up
              </button>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Username</span>
                <input
                  required
                  minLength={3}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter username"
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">Password</span>
                <input
                  required
                  minLength={6}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
                />
              </label>

              {mode === "signup" && (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Your role</span>
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    {roles.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-lg border border-leaf/30 bg-leaf-light px-3 py-2.5 text-sm text-foreground">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-lg bg-honey-dark px-4 text-sm font-semibold text-honey-dark-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Login to HoneyChain"
                    : "Create HoneyChain Account"}
              </button>
            </form>

            <div className="mt-6 border-t pt-5 text-center text-sm text-muted-foreground">
              Customer? You don't need an account. Scan a bottle's QR code to
              open its public Honey Passport.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
