import { createFileRoute, Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  MapPin,
  QrCode,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";

export const Route = createFileRoute("/passport/$batchId")({
  component: HoneyPassportPage,
  head: ({ params }) => ({
    meta: [
      { title: `Honey Passport — ${params.batchId}` },
      {
        name: "description",
        content: `Traceability passport for honey batch ${params.batchId}. Verified from hive to jar on HoneyChain.`,
      },
      { property: "og:title", content: `Honey Passport — ${params.batchId}` },
      {
        property: "og:description",
        content: `Traceability passport for honey batch ${params.batchId}. Verified from hive to jar on HoneyChain.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const MOCK_BATCH = {
  batchId: "HC-2026-0002",
  beekeeper: "Ravi Kumar",
  location: "Coorg, Karnataka",
  hiveId: "HIVE-002",
  honeyType: "Wildflower",
  harvestDate: "2026-09-04",
  quantity: "20 kg",
  status: "Harvested",
};

const STAGES = [
  { id: "harvested", label: "Harvested", icon: "🐝" },
  { id: "extracted", label: "Extracted", icon: "🏭" },
  { id: "processed", label: "Processed", icon: "⚙️" },
  { id: "lab-tested", label: "Lab Tested", icon: "🧪" },
  { id: "bottled", label: "Bottled", icon: "🍯" },
  { id: "distributed", label: "Distributed", icon: "🚚" },
];

const MOCK_BLOCKCHAIN = {
  txHash: "0x8f3a2b1c9d4e5f60718293a4b5c6d7e8f9012345",
  blockNumber: "18,472,931",
  verifiedAt: "2026-09-04T08:30:00Z",
  network: "HoneyChain Mainnet",
};

const MOCK_LAB = {
  labName: "AgriTest Labs, Bengaluru",
  certificateNo: "ATL-HC-2026-0892",
  testDate: "2026-09-05",
  moisture: "17.2%",
  ph: "3.8",
  purity: "99.4%",
  pollen: "Wildflower dominant",
};

const MOCK_HIVE = {
  hiveId: "HIVE-002",
  apiaryName: "Coorg Highland Apiary",
  coordinates: "12.3375° N, 75.8066° E",
  floraSource: "Wildflower meadows, coffee blossoms, eucalyptus",
  harvestMethod: "Sustainable frame extraction, minimal smoke",
  beekeeper: "Ravi Kumar",
  experience: "12 years",
};

function HoneyPassportPage() {
  const { batchId } = Route.useParams();
  const currentStageIndex = STAGES.findIndex(
    (s) => s.id === MOCK_BATCH.status.toLowerCase().replace(/\s+/g, "-"),
  );

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-honey text-honey-foreground">
              <Hexagon className="h-5 w-5 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight">HoneyChain</span>
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

      <main className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
        <section className="mb-10 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-honey/30 bg-honey-light px-3 py-1 text-sm font-medium text-honey-dark">
            <QrCode className="h-4 w-4" />
            <span>Scanned Batch: {batchId}</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Honey Passport
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
            From Hive to Jar — Verified.
          </p>
        </section>

        <section className="mb-10">
          <Card className="overflow-hidden border-honey/20 shadow-lg">
            <CardHeader className="honey-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-2xl">Batch Information</CardTitle>
                  <CardDescription>
                    Complete traceability record for this honey batch
                  </CardDescription>
                </div>
                <Badge className="w-fit bg-honey-dark text-honey-dark-foreground hover:bg-honey-dark/90">
                  {MOCK_BATCH.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem
                icon={<Box className="h-4 w-4" />}
                label="Batch ID"
                value={MOCK_BATCH.batchId}
              />
              <InfoItem
                icon={<User className="h-4 w-4" />}
                label="Beekeeper"
                value={MOCK_BATCH.beekeeper}
              />
              <InfoItem
                icon={<MapPin className="h-4 w-4" />}
                label="Location"
                value={MOCK_BATCH.location}
              />
              <InfoItem
                icon={<Hexagon className="h-4 w-4" />}
                label="Hive ID"
                value={MOCK_BATCH.hiveId}
              />
              <InfoItem
                icon={<Leaf className="h-4 w-4" />}
                label="Honey Type"
                value={MOCK_BATCH.honeyType}
              />
              <InfoItem
                icon={<Calendar className="h-4 w-4" />}
                label="Harvest Date"
                value={MOCK_BATCH.harvestDate}
              />
              <InfoItem
                icon={<Droplets className="h-4 w-4" />}
                label="Quantity"
                value={MOCK_BATCH.quantity}
              />
              <InfoItem
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Current Status"
                value={MOCK_BATCH.status}
              />
            </CardContent>
          </Card>
        </section>

        <section className="mb-10">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            Supply Chain Journey
          </h2>
          <Card className="border-honey/20">
            <CardContent className="p-6">
              <div className="space-y-2">
                {STAGES.map((stage, index) => {
                  const isCompleted = index <= currentStageIndex;
                  const isCurrent = index === currentStageIndex;
                  return (
                    <TimelineItem
                      key={stage.id}
                      stage={stage}
                      isCompleted={isCompleted}
                      isCurrent={isCurrent}
                      isLast={index === STAGES.length - 1}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-10">
          <Card className="border-leaf/20 bg-leaf/5">
            <CardContent className="flex flex-col items-center gap-5 p-8 text-center md:flex-row md:text-left">
              <div className="verified-ring flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-leaf text-leaf-foreground">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Traceability Verified</h2>
                <p className="mt-1 text-muted-foreground">
                  This batch is being tracked at every stage from hive to jar.
                  Every record is immutable and cryptographically signed on the
                  HoneyChain network.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

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
                This passport is anchored to a public blockchain record for
                transparency.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 p-6 pt-0 sm:grid-cols-2">
              <InfoItem
                icon={<Database className="h-4 w-4" />}
                label="Network"
                value={MOCK_BLOCKCHAIN.network}
              />
              <InfoItem
                icon={<Box className="h-4 w-4" />}
                label="Block Number"
                value={MOCK_BLOCKCHAIN.blockNumber}
              />
              <InfoItem
                icon={<Hexagon className="h-4 w-4" />}
                label="Transaction Hash"
                value={MOCK_BLOCKCHAIN.txHash}
                className="sm:col-span-2"
              />
              <InfoItem
                icon={<Calendar className="h-4 w-4" />}
                label="Verified At"
                value={new Date(MOCK_BLOCKCHAIN.verifiedAt).toLocaleString(
                  "en-IN",
                  {
                    dateStyle: "medium",
                    timeStyle: "short",
                  },
                )}
                className="sm:col-span-2"
              />
            </CardContent>
          </Card>
        </section>

        <section className="mb-10">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            Lab Testing Information
          </h2>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-trust" />
                <CardTitle className="text-lg">{MOCK_LAB.labName}</CardTitle>
              </div>
              <CardDescription>
                Certificate No: {MOCK_LAB.certificateNo} · Tested on{" "}
                {MOCK_LAB.testDate}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 p-6 pt-0 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Moisture" value={MOCK_LAB.moisture} />
              <MetricCard label="pH Level" value={MOCK_LAB.ph} />
              <MetricCard label="Purity" value={MOCK_LAB.purity} />
              <MetricCard label="Pollen Source" value={MOCK_LAB.pollen} />
            </CardContent>
          </Card>
        </section>

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
                    value={MOCK_HIVE.hiveId}
                  />
                  <InfoItem
                    icon={<MapPin className="h-4 w-4" />}
                    label="Apiary"
                    value={MOCK_HIVE.apiaryName}
                  />
                  <InfoItem
                    icon={<MapPin className="h-4 w-4" />}
                    label="Coordinates"
                    value={MOCK_HIVE.coordinates}
                  />
                  <InfoItem
                    icon={<Leaf className="h-4 w-4" />}
                    label="Flora Source"
                    value={MOCK_HIVE.floraSource}
                  />
                  <InfoItem
                    icon={<User className="h-4 w-4" />}
                    label="Beekeeper"
                    value={`${MOCK_HIVE.beekeeper} · ${MOCK_HIVE.experience} experience`}
                  />
                  <InfoItem
                    icon={<Settings className="h-4 w-4" />}
                    label="Harvest Method"
                    value={MOCK_HIVE.harvestMethod}
                  />
                </div>
              </CardContent>
              <div className="relative flex min-h-[260px] items-center justify-center bg-honey-light p-6">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-honey text-honey-foreground">
                    <MapPin className="h-8 w-8" />
                  </div>
                  <p className="mt-3 font-semibold text-honey-dark">
                    Coorg, Karnataka
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Western Ghats, India
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t bg-background py-8">
        <div className="container mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
          <p className="font-medium">Powered by HoneyChain</p>
          <p className="mt-1">Smart India Hackathon 2026 · Mock data demo</p>
        </div>
      </footer>
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
      <p className="truncate font-medium text-foreground">{value}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
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
  isCompleted,
  isCurrent,
  isLast,
}: {
  stage: (typeof STAGES)[number];
  isCompleted: boolean;
  isCurrent: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full border-2 text-lg transition-colors",
            isCompleted
              ? "border-leaf bg-leaf text-leaf-foreground"
              : "border-border bg-background text-muted-foreground",
            isCurrent && "ring-2 ring-honey ring-offset-2 ring-offset-background",
          )}
        >
          {isCompleted ? <Check className="h-5 w-5" /> : <span>{stage.icon}</span>}
        </div>
        {!isLast && (
          <div
            className={cn(
              "mt-2 w-0.5 flex-1 rounded-full",
              isCompleted ? "bg-leaf" : "bg-border",
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
          isCurrent && "border-honey/30 bg-honey-light/50",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{stage.icon}</span>
            <h3
              className={cn(
                "font-semibold",
                isCurrent && "text-honey-dark",
              )}
            >
              {stage.label}
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
        {isCurrent && (
          <p className="mt-2 text-sm text-muted-foreground">
            This batch is currently at the {stage.label.toLowerCase()} stage.
          </p>
        )}
      </div>
    </div>
  );
}
