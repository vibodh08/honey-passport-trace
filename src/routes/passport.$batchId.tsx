import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Box,
  Calendar,
  Check,
  Database,
  Droplets,
  FlaskConical,
  Hexagon,
  Leaf,
  Loader2,
  MapPin,
  QrCode,
  Settings,
  ShieldCheck,
  User,
  AlertCircle,
} from "lucide-react";

/*
 * HoneyChain Backend
 *
 * This is the public Render backend.
 */
const API_BASE_URL = "https://honeychain-backend-gurw.onrender.com";

interface SupplyChainEvent {
  event_id?: number;
  stage: string;
  label?: string;
  icon?: string;
  timestamp?: string;
  location?: string;
  actor?: string;
  details?: string;
}

interface PassportData {
  batchId: string;
  beekeeper: string;
  location: string;
  hiveId: string;
  honeyType: string;
  harvestDate: string;
  quantity: string;
  status: string;
  events?: SupplyChainEvent[];

  blockchain?: {
    verified?: boolean;
    batchId?: string;
    metadataHash?: string;
    registeredBy?: string;
    blockchainTimestamp?: number;
    network?: string;
    contractAddress?: string;
  };

  lab?: {
    labName?: string;
    certificateNo?: string;
    testDate?: string;
    moisture?: string;
    ph?: string;
    purity?: string;
    pollen?: string;
  };

  hive?: {
    hiveId?: string;
    apiaryName?: string;
    coordinates?: string;
    floraSource?: string;
    harvestMethod?: string;
    beekeeper?: string;
    experience?: string;
  };
}

class NotFoundError extends Error {
  constructor() {
    super("Honey batch not found.");
  }
}

/*
 * Fetch Honey Passport data from the live FastAPI backend.
 *
 * Backend response format:
 *
 * {
 *   "passport": {...},
 *   "supply_chain": [...]
 * }
 *
 * The frontend converts that response into the format
 * expected by the existing Honey Passport UI.
 */
const fetchBlockchainVerification = async (batchId: string) => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/blockchain/verify/${encodeURIComponent(batchId)}`,
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

const fetchPassport = async (batchId: string): Promise<PassportData> => {
  const res = await fetch(
    `${API_BASE_URL}/api/passport/${encodeURIComponent(batchId)}`,
  );

  if (res.status === 404) {
    throw new NotFoundError();
  }

  if (!res.ok) {
    throw new Error(
      `The verification backend returned an error (${res.status}).`,
    );
  }

  const result = await res.json();

  if (!result.passport) {
    throw new Error("Invalid passport data received from the backend.");
  }

  const passport = result.passport;
  const blockchain = await fetchBlockchainVerification(batchId);

  return {
    batchId: passport.batch_id,
    beekeeper: passport.beekeeper,
    location: passport.origin,
    hiveId: passport.hive_id,
    honeyType: passport.honey_type,
    harvestDate: passport.harvest_date,
    quantity: `${passport.quantity_kg} kg`,
    status: passport.status,

    blockchain: blockchain
      ? {
          verified: blockchain.verified,
          batchId: blockchain.batch_id,
          metadataHash: blockchain.metadata_hash,
          registeredBy: blockchain.registered_by,
          blockchainTimestamp: blockchain.blockchain_timestamp,
          network: blockchain.network,
          contractAddress: blockchain.contract_address,
        }
      : undefined,

    events: (result.supply_chain ?? []).map(
      (event: {
        event_id: number;
        stage: string;
        location?: string;
        actor?: string;
        timestamp?: string;
        notes?: string;
      }) => ({
        event_id: event.event_id,
        stage: event.stage,
        timestamp: event.timestamp,
        location: event.location,
        actor: event.actor,
        details: event.notes,
        label: event.stage,
      }),
    ),
  };
};

const passportQueryOptions = (batchId: string) => ({
  queryKey: ["passport", batchId],
  queryFn: () => fetchPassport(batchId),
});

const STAGES = [
  { id: "harvested", label: "Harvested", icon: "🐝" },
  { id: "extracted", label: "Extracted", icon: "🏭" },
  { id: "processed", label: "Processed", icon: "⚙️" },
  { id: "lab-tested", label: "Lab Tested", icon: "🧪" },
  { id: "bottled", label: "Bottled", icon: "🍯" },
  { id: "distributed", label: "Distributed", icon: "🚚" },
];

function normalizeStage(stage: string): string {
  return stage
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export const Route = createFileRoute("/passport/$batchId")({
  component: HoneyPassportPage,

  head: ({ params }) => ({
    meta: [
      {
        title: `Honey Passport — ${params.batchId}`,
      },
      {
        name: "description",
        content: `Traceability passport for honey batch ${params.batchId}. Verified from hive to jar on HoneyChain.`,
      },
      {
        property: "og:title",
        content: `Honey Passport — ${params.batchId}`,
      },
      {
        property: "og:description",
        content: `Traceability passport for honey batch ${params.batchId}. Verified from hive to jar on HoneyChain.`,
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary",
      },
    ],
  }),
});

function HoneyPassportPage() {
  const { batchId } = Route.useParams();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery(passportQueryOptions(batchId));

  if (isLoading) {
    return <LoadingView batchId={batchId} />;
  }

  if (error) {
    if (error instanceof NotFoundError) {
      return <NotFoundView batchId={batchId} />;
    }

    return (
      <ErrorView
        batchId={batchId}
        error={error as Error}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data) {
    return (
      <ErrorView
        batchId={batchId}
        error={new Error("No passport data was returned.")}
        onRetry={() => refetch()}
      />
    );
  }

  return <PassportContent batchId={batchId} data={data} />;
}

function LoadingView({ batchId }: { batchId: string }) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <PassportHeader batchId={batchId} />

      <main className="container mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-honey-light">
          <Loader2 className="h-10 w-10 animate-spin text-honey-dark" />
        </div>

        <h2 className="mt-6 text-2xl font-bold">
          Verifying batch...
        </h2>

        <p className="mt-2 max-w-md text-muted-foreground">
          Fetching the HoneyChain passport record for{" "}
          <span className="font-medium text-foreground">
            {batchId}
          </span>
          .
        </p>
      </main>

      <PassportFooter />
    </div>
  );
}

function NotFoundView({ batchId }: { batchId: string }) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <PassportHeader batchId={batchId} />

      <main className="container mx-auto max-w-5xl px-4 py-16">
        <Card className="mx-auto max-w-xl border-honey/20 text-center">
          <CardContent className="flex flex-col items-center p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>

            <h2 className="mt-6 text-2xl font-bold">
              Honey batch not found.
            </h2>

            <p className="mt-2 text-muted-foreground">
              We could not locate a passport record for batch{" "}
              <span className="font-medium text-foreground">
                {batchId}
              </span>
              .
              Please check the QR code or batch ID and try again.
            </p>

            <Button
              asChild
              className="mt-6 bg-honey-dark text-honey-dark-foreground hover:bg-honey-dark/90"
            >
              <Link to="/">Return home</Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      <PassportFooter />
    </div>
  );
}

function ErrorView({
  batchId,
  error,
  onRetry,
}: {
  batchId: string;
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <PassportHeader batchId={batchId} />

      <main className="container mx-auto max-w-5xl px-4 py-16">
        <Card className="mx-auto max-w-xl border-destructive/20 text-center">
          <CardContent className="flex flex-col items-center p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>

            <h2 className="mt-6 text-2xl font-bold">
              Could not verify batch
            </h2>

            <p className="mt-2 text-muted-foreground">
              {error.message ||
                "Something went wrong while contacting the verification backend."}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={onRetry}
                className="bg-honey-dark text-honey-dark-foreground hover:bg-honey-dark/90"
              >
                Try again
              </Button>

              <Button asChild variant="outline">
                <Link to="/">Return home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <PassportFooter />
    </div>
  );
}

function PassportHeader({ batchId }: { batchId: string }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-honey text-honey-foreground">
            <Hexagon className="h-5 w-5 fill-current" />
          </div>

          <span className="text-xl font-bold tracking-tight">
            HoneyChain
          </span>
        </Link>

        <Badge
          variant="outline"
          className="border-trust/30 bg-trust-light text-trust"
        >
          <ShieldCheck className="mr-1 h-3 w-3" />
          Verified
        </Badge>
      </div>
    </header>
  );
}

function PassportFooter() {
  return (
    <footer className="border-t bg-background py-8">
      <div className="container mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
        <p className="font-medium">
          Powered by HoneyChain
        </p>

        <p className="mt-1">
          Smart India Hackathon 2026
        </p>
      </div>
    </footer>
  );
}

function PassportContent({
  batchId,
  data,
}: {
  batchId: string;
  data: PassportData;
}) {
  const sortedEvents = useMemo(() => {
    return [...(data.events ?? [])].sort((a, b) => {
      if (!a.timestamp || !b.timestamp) {
        return 0;
      }

      return (
        new Date(a.timestamp).getTime() -
        new Date(b.timestamp).getTime()
      );
    });
  }, [data.events]);

  const currentStatusId = useMemo(() => {
    if (sortedEvents.length > 0) {
      return normalizeStage(
        sortedEvents[sortedEvents.length - 1].stage,
      );
    }

    return normalizeStage(data.status ?? "");
  }, [data.status, sortedEvents]);

  const currentStageIndex = STAGES.findIndex(
    (s) => s.id === currentStatusId,
  );

  const eventMap = useMemo(() => {
    const map = new Map<string, SupplyChainEvent>();

    for (const event of data.events ?? []) {
      map.set(normalizeStage(event.stage), event);
    }

    return map;
  }, [data.events]);

  const blockchain = data.blockchain;
  const lab = data.lab;
  const hive = data.hive;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <PassportHeader batchId={batchId} />

      <main className="container mx-auto max-w-5xl px-4 py-8 md:py-12">

        {/* PAGE HEADER */}
        <section className="mb-10 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-honey/30 bg-honey-light px-3 py-1 text-sm font-medium text-honey-dark">
            <QrCode className="h-4 w-4" />
            <span>
              Scanned Batch: {batchId}
            </span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Honey Passport
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
            From Hive to Jar — Verified.
          </p>
        </section>

        {/* BATCH INFORMATION */}
        <section className="mb-10">
          <Card className="overflow-hidden border-honey/20 shadow-lg">
            <CardHeader className="honey-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    Batch Information
                  </CardTitle>

                  <CardDescription>
                    Complete traceability record for this honey batch
                  </CardDescription>
                </div>

                <Badge className="w-fit bg-honey-dark text-honey-dark-foreground hover:bg-honey-dark/90">
                  {data.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">

              <InfoItem
                icon={<Box className="h-4 w-4" />}
                label="Batch ID"
                value={data.batchId}
              />

              <InfoItem
                icon={<User className="h-4 w-4" />}
                label="Beekeeper"
                value={data.beekeeper}
              />

              <InfoItem
                icon={<MapPin className="h-4 w-4" />}
                label="Location"
                value={data.location}
              />

              <InfoItem
                icon={<Hexagon className="h-4 w-4" />}
                label="Hive ID"
                value={data.hiveId}
              />

              <InfoItem
                icon={<Leaf className="h-4 w-4" />}
                label="Honey Type"
                value={data.honeyType}
              />

              <InfoItem
                icon={<Calendar className="h-4 w-4" />}
                label="Harvest Date"
                value={data.harvestDate}
              />

              <InfoItem
                icon={<Droplets className="h-4 w-4" />}
                label="Quantity"
                value={data.quantity}
              />

              <InfoItem
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Current Status"
                value={data.status}
              />

            </CardContent>
          </Card>
        </section>

        {/* QR VERIFICATION */}
<section className="mb-10">
  <Card className="border-honey/20 shadow-lg">
    <CardHeader className="text-center">
      <CardTitle className="flex items-center justify-center gap-2 text-xl">
        <QrCode className="h-5 w-5 text-honey-dark" />
        Verify This Honey
      </CardTitle>

      <CardDescription>
        Scan the QR code to open this Honey Passport.
      </CardDescription>
    </CardHeader>

    <CardContent className="flex flex-col items-center p-6">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <img
          src={`${API_BASE_URL}/api/qr/${encodeURIComponent(batchId)}`}
          alt={`QR code for honey batch ${batchId}`}
          className="h-52 w-52"
        />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Batch:{" "}
        <span className="font-medium text-foreground">
          {batchId}
        </span>
      </p>
    </CardContent>
  </Card>
</section>

        {/* SUPPLY CHAIN */}
        <section className="mb-10">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            Supply Chain Journey
          </h2>

          <Card className="border-honey/20">
            <CardContent className="p-6">
              <div className="space-y-2">

                {STAGES.map((stage, index) => {
                  const event = eventMap.get(stage.id);

                  const isCompleted = Boolean(event);

                  const isCurrent =
                    Boolean(event) && index === currentStageIndex;

                  return (
                    <TimelineItem
                      key={stage.id}
                      stage={stage}
                      event={event}
                      isCompleted={isCompleted}
                      isCurrent={isCurrent}
                      isLast={
                        index === STAGES.length - 1
                      }
                    />
                  );
                })}

              </div>
            </CardContent>
          </Card>
        </section>

        {/* TRACEABILITY */}
        <section className="mb-10">
          <Card className="border-leaf/20 bg-leaf/5">
            <CardContent className="flex flex-col items-center gap-5 p-8 text-center md:flex-row md:text-left">

              <div className="verified-ring flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-leaf text-leaf-foreground">
                <ShieldCheck className="h-8 w-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Traceability Verified
                </h2>

                <p className="mt-1 text-muted-foreground">
                  This batch is tracked through recorded supply-chain events from
                  hive to jar. Every recorded event can be independently verified
                  through the HoneyChain traceability system.
                </p>
              </div>

            </CardContent>
          </Card>
        </section>

        {/* BLOCKCHAIN */}
        <section className="mb-10">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            Blockchain Verification
          </h2>

          <Card className="border-trust/20 trust-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5 text-trust" />
                On-Chain Record
              </CardTitle>

              <CardDescription>
                This passport will be anchored to a public blockchain record
                for transparency.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-6 p-6 pt-0 sm:grid-cols-2">

              <InfoItem
                icon={<Database className="h-4 w-4" />}
                label="Network"
                value={
                  blockchain?.network ??
                  "Sepolia Testnet"
                }
              />

              <InfoItem
                icon={<Box className="h-4 w-4" />}
                label="Status"
                value={
                  blockchain?.verified ? "Verified" : "Not registered"
                }
              />

              <InfoItem
                icon={<Hexagon className="h-4 w-4" />}
                label="Metadata Hash"
                value={
                  blockchain?.metadataHash ?? "—"
                }
                className="sm:col-span-2"
              />

              <InfoItem
                icon={<Calendar className="h-4 w-4" />}
                label="Registered By"
                value={blockchain?.registeredBy ?? "—"}
                className="sm:col-span-2"
              />

              <InfoItem
                icon={<Hexagon className="h-4 w-4" />}
                label="Contract Address"
                value={blockchain?.contractAddress ?? "—"}
                className="sm:col-span-2"
              />

              <InfoItem
                icon={<Calendar className="h-4 w-4" />}
                label="Blockchain Timestamp"
                value={
                  blockchain?.blockchainTimestamp
                    ? new Date(blockchain.blockchainTimestamp * 1000).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "—"
                }
                className="sm:col-span-2"
              />

            </CardContent>
          </Card>
        </section>

        {/* LAB TESTING */}
        <section className="mb-10">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            Lab Testing Information
          </h2>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-trust" />

                <CardTitle className="text-lg">
                  {lab?.labName ??
                    "Lab Report Pending"}
                </CardTitle>
              </div>

              {lab && (
                <CardDescription>
                  Certificate No:{" "}
                  {lab.certificateNo ?? "—"} · Tested on{" "}
                  {lab.testDate ?? "—"}
                </CardDescription>
              )}
            </CardHeader>

            {lab ? (
              <CardContent className="grid gap-4 p-6 pt-0 sm:grid-cols-2 lg:grid-cols-4">

                <MetricCard
                  label="Moisture"
                  value={lab.moisture ?? "—"}
                />

                <MetricCard
                  label="pH Level"
                  value={lab.ph ?? "—"}
                />

                <MetricCard
                  label="Purity"
                  value={lab.purity ?? "—"}
                />

                <MetricCard
                  label="Pollen Source"
                  value={lab.pollen ?? "—"}
                />

              </CardContent>
            ) : (
              <CardContent className="p-6 pt-0 text-sm text-muted-foreground">
                Lab testing details will appear here once the batch has been
                tested.
              </CardContent>
            )}
          </Card>
        </section>

        {/* HIVE INFORMATION */}
        <section className="mb-10">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            Originating Hive Information
          </h2>

          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-2">

              <CardContent className="p-6">
                <div className="space-y-4">

                  <InfoItem
                    icon={<Hexagon className="h-4 w-4" />}
                    label="Hive ID"
                    value={
                      hive?.hiveId ??
                      data.hiveId
                    }
                  />

                  <InfoItem
                    icon={<MapPin className="h-4 w-4" />}
                    label="Apiary"
                    value={
                      hive?.apiaryName ?? "—"
                    }
                  />

                  <InfoItem
                    icon={<MapPin className="h-4 w-4" />}
                    label="Coordinates"
                    value={
                      hive?.coordinates ?? "—"
                    }
                  />

                  <InfoItem
                    icon={<Leaf className="h-4 w-4" />}
                    label="Flora Source"
                    value={
                      hive?.floraSource ?? "—"
                    }
                  />

                  <InfoItem
                    icon={<User className="h-4 w-4" />}
                    label="Beekeeper"
                    value={
                      hive?.beekeeper
                        ? `${hive.beekeeper}${
                            hive.experience
                              ? ` · ${hive.experience} experience`
                              : ""
                          }`
                        : data.beekeeper
                    }
                  />

                  <InfoItem
                    icon={<Settings className="h-4 w-4" />}
                    label="Harvest Method"
                    value={
                      hive?.harvestMethod ?? "—"
                    }
                  />

                </div>
              </CardContent>

              <div className="relative flex min-h-[260px] items-center justify-center bg-honey-light p-6">

                <div className="text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-honey text-honey-foreground">
                    <MapPin className="h-8 w-8" />
                  </div>

                  <p className="mt-3 font-semibold text-honey-dark">
                    {data.location}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Verified Origin
                  </p>

                </div>

              </div>

            </div>
          </Card>
        </section>

      </main>

      <PassportFooter />
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 space-y-1", className)}>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>

      <p className="truncate font-medium text-foreground">
        {value}
      </p>

    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">

      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-foreground">
        {value}
      </p>

      <Badge
        variant="outline"
        className="mt-2 border-leaf/30 bg-leaf/10 text-leaf"
      >
        <Check className="mr-1 h-3 w-3" />
        Pass
      </Badge>

    </div>
  );
}

function TimelineItem({
  stage,
  event,
  isCompleted,
  isCurrent,
  isLast,
}: {
  stage: (typeof STAGES)[number];
  event?: SupplyChainEvent;
  isCompleted: boolean;
  isCurrent: boolean;
  isLast: boolean;
}) {
  const displayLabel =
    event?.label ?? stage.label;

  const displayIcon =
    event?.icon ?? stage.icon;

  const eventTime = event?.timestamp
    ? new Date(event.timestamp).toLocaleString(
        "en-IN",
        {
          dateStyle: "medium",
          timeStyle: "short",
        },
      )
    : null;

  return (
    <div className="flex gap-4">

      <div className="flex flex-col items-center">

        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full border-2 text-lg transition-colors",

            isCompleted
              ? "border-leaf bg-leaf text-leaf-foreground"
              : "border-border bg-background text-muted-foreground",

            isCurrent &&
              "ring-2 ring-honey ring-offset-2 ring-offset-background",
          )}
        >
          {isCompleted ? (
            <Check className="h-5 w-5" />
          ) : (
            <span>{displayIcon}</span>
          )}
        </div>

        {!isLast && (
          <div
            className={cn(
              "mt-2 w-0.5 flex-1 rounded-full",

              isCompleted
                ? "bg-leaf"
                : "bg-border",
            )}
          />
        )}

      </div>

      <div
        className={cn(
          "mb-6 flex-1 rounded-xl border p-4",

          isCompleted
            ? "border-leaf/20 bg-leaf/5"
            : "border-border bg-card",

          isCurrent &&
            "border-honey/30 bg-honey-light/50",
        )}
      >

        <div className="flex items-center justify-between gap-2">

          <div className="flex items-center gap-2">

            <span className="text-lg">
              {displayIcon}
            </span>

            <h3
              className={cn(
                "font-semibold",
                isCurrent &&
                  "text-honey-dark",
              )}
            >
              {displayLabel}
            </h3>

          </div>

          {isCompleted && !isCurrent && (
            <Badge
              variant="outline"
              className="border-leaf/30 bg-leaf/10 text-leaf"
            >
              <Check className="mr-1 h-3 w-3" />
              Done
            </Badge>
          )}

          {isCurrent && (
            <Badge className="bg-honey-dark text-honey-dark-foreground">
              Current
            </Badge>
          )}

        </div>

        {(isCurrent ||
          eventTime ||
          event?.details ||
          event?.location ||
          event?.actor) && (
          <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {event?.details ? (
              <p>{event.details}</p>
            ) : isCurrent ? (
              <p>
                This batch is currently at the{" "}
                {displayLabel.toLowerCase()} stage.
              </p>
            ) : null}

            {event?.location && (
              <p>
                <span className="font-medium text-foreground">
                  Location:
                </span>{" "}
                {event.location}
              </p>
            )}

            {event?.actor && (
              <p>
                <span className="font-medium text-foreground">
                  Recorded by:
                </span>{" "}
                {event.actor}
              </p>
            )}

            {eventTime && (
              <p className="text-xs text-muted-foreground/80">
                {eventTime}
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}