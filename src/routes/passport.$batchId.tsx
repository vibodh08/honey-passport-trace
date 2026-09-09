import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";

const API_BASE_URL = "https://honeychain-backend-gurw.onrender.com";

class NotFoundError extends Error {
  constructor() {
    super("Honey batch not found");
    this.name = "NotFoundError";
  }
}

interface SupplyChainEvent {
  event_id?: number | undefined;
  stage: string;
  timestamp?: string | undefined;
  location?: string | undefined;
  actor?: string | undefined;
  details?: string | undefined;
  label?: string | undefined;
}

interface BlockchainData {
  verified?: boolean | undefined;
  batch_id?: string | undefined;
  metadata_hash?: string | undefined;
  registered_by?: string | undefined;
  blockchain_timestamp?: number | undefined;
  network?: string | undefined;
  contract_address?: string | undefined;
}

interface LabCertificate {
  id?: number;
  batch_id?: string;
  certificate_id: string;
  laboratory_name: string;
  test_date: string;
  test_result: string;
  quality_status: string;
  notes?: string | null;
  created_at?: string;
}

interface BackendPassport {
  batch_id: string;
  beekeeper: string;
  origin: string;
  hive_id: string;
  honey_type: string;
  harvest_date: string;
  quantity_kg: number;
  status: string;
  metadata_hash?: string | null;
}

interface PassportResponse {
  passport: BackendPassport;
  supply_chain?: Array<{
    event_id?: number;
    stage: string;
    location?: string;
    actor?: string;
    timestamp?: string;
    notes?: string;
  }>;
  lab_certificate?: LabCertificate | null;
  blockchain?: BlockchainData | null;
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
  metadataHash?: string | undefined;
  events: SupplyChainEvent[];
  blockchain?:
    | {
        verified?: boolean | undefined;
        batchId?: string | undefined;
        metadataHash?: string | undefined;
        registeredBy?: string | undefined;
        blockchainTimestamp?: number | undefined;
        network?: string | undefined;
        contractAddress?: string | undefined;
      }
    | undefined;
  lab?:
    | {
        labName: string;
        certificateNo: string;
        testDate: string;
        testResult: string;
        qualityStatus: string;
        notes?: string | null;
      }
    | undefined;
}

const STAGES = [
  {
    id: "harvested",
    label: "Harvested",
    description: "Honey harvested from the registered hive.",
  },
  {
    id: "extracted",
    label: "Extracted",
    description: "Honey extracted from the harvested material.",
  },
  {
    id: "processed",
    label: "Processed",
    description: "Honey processed before quality certification.",
  },
  {
    id: "lab-tested",
    label: "Lab Tested",
    description: "Honey sample tested by a laboratory.",
  },
  {
    id: "bottled",
    label: "Bottled",
    description: "Honey packaged into consumer bottles.",
  },
  {
    id: "distributed",
    label: "Distributed",
    description: "Batch released into distribution.",
  },
] as const;

const normalizeStage = (stage: string): string => {
  return stage
    .toLowerCase()
    .trim()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
};

const formatDate = (value?: string): string => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value?: string): string => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const truncateHash = (value?: string): string => {
  if (!value) {
    return "Not available";
  }

  if (value.length <= 24) {
    return value;
  }

  return value.slice(0, 12) + "..." + value.slice(-12);
};

const fetchBlockchainVerification = async (
  batchId: string,
): Promise<BlockchainData | null> => {
  try {
    const encodedBatchId = encodeURIComponent(batchId);

    const response = await fetch(
      API_BASE_URL +
        "/api/blockchain/verify/" +
        encodedBatchId,
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as BlockchainData;
  } catch {
    return null;
  }
};

const fetchLabCertificate = async (
  batchId: string,
): Promise<LabCertificate | null> => {
  try {
    const encodedBatchId = encodeURIComponent(batchId);

    const response = await fetch(
      API_BASE_URL +
        "/api/batches/" +
        encodedBatchId +
        "/lab-certificate",
    );

    if (!response.ok) {
      return null;
    }

    const result = (await response.json()) as {
      certificate?: LabCertificate | null;
    };

    return result.certificate ?? null;
  } catch {
    return null;
  }
};

const fetchPassport = async (
  batchId: string,
): Promise<PassportData> => {
  const encodedBatchId = encodeURIComponent(batchId);

  const response = await fetch(
    API_BASE_URL +
      "/api/passport/" +
      encodedBatchId,
  );

  if (response.status === 404) {
    throw new NotFoundError();
  }

  if (!response.ok) {
    throw new Error(
      "The verification backend returned an error (" +
        response.status +
        ").",
    );
  }

  const result = (await response.json()) as PassportResponse;

  if (!result.passport) {
    throw new Error(
      "Invalid passport data received from the backend.",
    );
  }

  const passport = result.passport;

  const [blockchainResult, labResult] =
    await Promise.allSettled([
      fetchBlockchainVerification(batchId),
      fetchLabCertificate(batchId),
    ]);

  const blockchain =
    blockchainResult.status === "fulfilled"
      ? blockchainResult.value
      : null;

  const labCertificate =
    labResult.status === "fulfilled"
      ? labResult.value
      : null;

  const passportLab = result.lab_certificate ?? null;

  const finalLabCertificate =
    labCertificate ?? passportLab;

  const events: SupplyChainEvent[] = (
    result.supply_chain ?? []
  ).map(
    (event): SupplyChainEvent => ({
      event_id: event.event_id,
      stage: event.stage,
      timestamp: event.timestamp,
      location: event.location,
      actor: event.actor,
      details: event.notes,
      label: event.stage,
    }),
  );

  return {
    batchId: passport.batch_id,
    beekeeper: passport.beekeeper,
    location: passport.origin,
    hiveId: passport.hive_id,
    honeyType: passport.honey_type,
    harvestDate: passport.harvest_date,
    quantity: String(passport.quantity_kg) + " kg",
    status: passport.status,
    metadataHash: passport.metadata_hash ?? undefined,

    events,

    blockchain: blockchain
      ? {
          verified: blockchain.verified ?? false,
          batchId: blockchain.batch_id ?? undefined,
          metadataHash:
            blockchain.metadata_hash ?? undefined,
          registeredBy:
            blockchain.registered_by ?? undefined,
          blockchainTimestamp:
            blockchain.blockchain_timestamp ?? undefined,
          network: blockchain.network ?? undefined,
          contractAddress:
            blockchain.contract_address ?? undefined,
        }
      : undefined,

    lab: finalLabCertificate
      ? {
          labName:
            finalLabCertificate.laboratory_name,
          certificateNo:
            finalLabCertificate.certificate_id,
          testDate:
            finalLabCertificate.test_date,
          testResult:
            finalLabCertificate.test_result,
          qualityStatus:
            finalLabCertificate.quality_status,
          notes:
            finalLabCertificate.notes ?? null,
        }
      : undefined,
  };
};

const passportQueryOptions = (batchId: string) => ({
  queryKey: ["passport", batchId],
  queryFn: () => fetchPassport(batchId),
});

function PageHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          to="/"
          className="text-xl font-bold tracking-tight"
        >
          HoneyChain
        </Link>

        <div className="text-sm text-muted-foreground">
          Honey Passport
        </div>
      </div>
    </header>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized = status.toLowerCase();

  const isVerified =
    normalized.includes("verified") ||
    normalized.includes("distributed");

  return (
    <span
      className={
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold " +
        (isVerified
          ? "border-green-500/30 bg-green-500/10 text-green-700"
          : "border-yellow-500/30 bg-yellow-500/10 text-yellow-700")
      }
    >
      {status || "Created"}
    </span>
  );
}

function InfoCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">
        {title}
      </p>

      <p className="mt-2 break-words text-lg font-semibold">
        {value}
      </p>

      {description ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function Timeline({
  events,
}: {
  events: SupplyChainEvent[];
}) {
  const eventMap = useMemo(() => {
    const map = new Map<string, SupplyChainEvent>();

    for (const event of events) {
      map.set(normalizeStage(event.stage), event);
    }

    return map;
  }, [events]);

  const currentStageIndex = useMemo(() => {
    let lastIndex = -1;

    for (let index = 0; index < STAGES.length; index += 1) {
      const stage = STAGES[index];

      if (!stage) {
        continue;
      }

      if (eventMap.has(stage.id)) {
        lastIndex = index;
      }
    }

    return lastIndex;
  }, [eventMap]);

  return (
    <div className="space-y-4">
      {STAGES.map((stage, index) => {
        const event = eventMap.get(stage.id);
        const isCompleted = Boolean(event);
        const isCurrent =
          isCompleted && index === currentStageIndex;

        return (
          <div
            key={stage.id}
            className="relative rounded-xl border bg-card p-5"
          >
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold">
                {isCompleted ? "✓" : String(index + 1)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">
                      {stage.label}
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {stage.description}
                    </p>
                  </div>

                  {isCurrent ? (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      Current stage
                    </span>
                  ) : null}
                </div>

                {event ? (
                  <div className="mt-4 space-y-2 border-t pt-4 text-sm">
                    {event.location ? (
                      <p>
                        <span className="font-medium">
                          Location:
                        </span>{" "}
                        {event.location}
                      </p>
                    ) : null}

                    {event.actor ? (
                      <p>
                        <span className="font-medium">
                          Recorded by:
                        </span>{" "}
                        {event.actor}
                      </p>
                    ) : null}

                    {event.details ? (
                      <p>
                        <span className="font-medium">
                          Notes:
                        </span>{" "}
                        {event.details}
                      </p>
                    ) : null}

                    {event.timestamp ? (
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(event.timestamp)}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    This stage has not been recorded yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BlockchainSection({
  blockchain,
}: {
  blockchain: PassportData["blockchain"];
}) {
  if (!blockchain) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">
          Blockchain Verification
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Blockchain verification information is currently unavailable.
        </p>
      </div>
    );
  }

  const explorerUrl =
    blockchain.contractAddress
      ? "https://sepolia.etherscan.io/address/" +
        blockchain.contractAddress
      : null;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            Blockchain Verification
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            The batch metadata is anchored to the Sepolia blockchain.
          </p>
        </div>

        <span
          className={
            "rounded-full px-3 py-1 text-xs font-semibold " +
            (blockchain.verified
              ? "bg-green-500/10 text-green-700"
              : "bg-red-500/10 text-red-700")
          }
        >
          {blockchain.verified
            ? "Verified"
            : "Not verified"}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <InfoCard
          title="Batch ID"
          value={blockchain.batchId ?? "Not available"}
        />

        <InfoCard
          title="Network"
          value={blockchain.network ?? "Sepolia"}
        />

        <InfoCard
          title="Registered By"
          value={
            blockchain.registeredBy ??
            "Not available"
          }
        />

        <InfoCard
          title="Blockchain Timestamp"
          value={
            blockchain.blockchainTimestamp
              ? formatDateTime(
                  new Date(
                    blockchain.blockchainTimestamp * 1000,
                  ).toISOString(),
                )
              : "Not available"
          }
        />
      </div>

      <div className="mt-4 rounded-lg bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground">
          Metadata hash
        </p>

        <p className="mt-2 break-all font-mono text-xs">
          {blockchain.metadataHash ??
            "Not available"}
        </p>
      </div>

      {explorerUrl ? (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          View contract on Sepolia Etherscan
        </a>
      ) : null}
    </div>
  );
}

function LabSection({
  lab,
}: {
  lab: PassportData["lab"];
}) {
  if (!lab) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Laboratory Testing
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          No laboratory certificate has been attached to this batch.
        </p>
      </div>
    );
  }

  const passed =
    lab.qualityStatus.toLowerCase().includes("verified") ||
    lab.qualityStatus.toLowerCase().includes("pass") ||
    lab.testResult.toLowerCase().includes("pass");

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            Laboratory Testing
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Quality information associated with this honey batch.
          </p>
        </div>

        <span
          className={
            "rounded-full px-3 py-1 text-xs font-semibold " +
            (passed
              ? "bg-green-500/10 text-green-700"
              : "bg-yellow-500/10 text-yellow-700")
          }
        >
          {lab.qualityStatus}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <InfoCard
          title="Laboratory"
          value={lab.labName}
        />

        <InfoCard
          title="Certificate Number"
          value={lab.certificateNo}
        />

        <InfoCard
          title="Test Date"
          value={formatDate(lab.testDate)}
        />

        <InfoCard
          title="Test Result"
          value={lab.testResult}
        />
      </div>

      {lab.notes ? (
        <div className="mt-4 rounded-lg bg-muted/50 p-4">
          <p className="text-xs text-muted-foreground">
            Laboratory notes
          </p>

          <p className="mt-1 text-sm">
            {lab.notes}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function PassportPage() {
  const { batchId } = Route.useParams();

  const query = useQuery(
    passportQueryOptions(batchId),
  );

  const passportUrl =
    typeof window !== "undefined"
      ? window.location.origin +
        "/passport/" +
        encodeURIComponent(batchId)
      : "https://honeychain-frontend.vercel.app/passport/" +
        encodeURIComponent(batchId);

  const qrUrl =
    "https://quickchart.io/qr?size=240&text=" +
    encodeURIComponent(passportUrl);

  if (query.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader />

        <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl border bg-card p-10 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />

            <h1 className="mt-6 text-xl font-semibold">
              Loading Honey Passport
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Retrieving traceability and verification information.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (query.error instanceof NotFoundError) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader />

        <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
            <h1 className="text-2xl font-bold">
              Honey batch not found
            </h1>

            <p className="mt-3 text-muted-foreground">
              We could not locate a passport record for batch{" "}
              <span className="font-mono font-medium">
                {batchId}
              </span>
              .
            </p>

            <Link
              to="/"
              className="mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Return home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (query.error) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader />

        <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-10 text-center">
            <h1 className="text-2xl font-bold">
              Unable to load Honey Passport
            </h1>

            <p className="mt-3 text-sm text-muted-foreground">
              Something went wrong while contacting the verification backend.
            </p>

            <button
              type="button"
              onClick={() => query.refetch()}
              className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  const data = query.data;

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">
            HONEY PASSPORT
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {data.batchId}
              </h1>

              <p className="mt-2 text-muted-foreground">
                Transparent farm-to-bottle traceability.
              </p>
            </div>

            <StatusBadge status={data.status} />
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Batch Information
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoCard
                title="Beekeeper"
                value={data.beekeeper}
              />

              <InfoCard
                title="Origin"
                value={data.location}
              />

              <InfoCard
                title="Hive ID"
                value={data.hiveId}
              />

              <InfoCard
                title="Honey Type"
                value={data.honeyType}
              />

              <InfoCard
                title="Harvest Date"
                value={formatDate(data.harvestDate)}
              />

              <InfoCard
                title="Quantity"
                value={data.quantity}
              />
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
            <h2 className="text-lg font-semibold">
              Scan to Verify
            </h2>

            <p className="mt-2 text-xs text-muted-foreground">
              Scan this QR code to open the Honey Passport.
            </p>

            <div className="mx-auto mt-5 flex w-fit rounded-xl border bg-white p-3">
              <img
                src={qrUrl}
                alt={
                  "QR code for Honey Passport " +
                  data.batchId
                }
                width={220}
                height={220}
                className="h-[220px] w-[220px]"
              />
            </div>

            <p className="mt-4 break-all font-mono text-xs text-muted-foreground">
              {data.batchId}
            </p>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-2xl font-bold">
              Supply Chain Traceability
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Every recorded stage of this honey batch.
            </p>
          </div>

          <Timeline events={data.events} />
        </section>

        <section className="mt-8">
          <BlockchainSection
            blockchain={data.blockchain}
          />
        </section>

        <section className="mt-8">
          <LabSection lab={data.lab} />
        </section>

        <section className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Originating Hive
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <InfoCard
              title="Hive ID"
              value={data.hiveId}
            />

            <InfoCard
              title="Beekeeper"
              value={data.beekeeper}
            />

            <InfoCard
              title="Location"
              value={data.location}
            />
          </div>
        </section>

        <section className="mt-8 rounded-2xl border bg-muted/30 p-6">
          <h2 className="text-lg font-semibold">
            Traceability Integrity
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            HoneyChain uses a cryptographic metadata hash to detect
            changes to registered batch information. The blockchain
            provides a tamper-evident record of the registered hash.
            Blockchain verification does not by itself prove honey
            purity; laboratory testing provides the supporting quality
            evidence.
          </p>

          {data.metadataHash ? (
            <div className="mt-5 rounded-lg border bg-background p-4">
              <p className="text-xs text-muted-foreground">
                Registered metadata hash
              </p>

              <p className="mt-2 break-all font-mono text-xs">
                {data.metadataHash}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                Short form:{" "}
                {truncateHash(data.metadataHash)}
              </p>
            </div>
          ) : null}
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-muted-foreground sm:px-6">
          HoneyChain — Blockchain-based honey traceability
        </div>
      </footer>
    </div>
  );
}

export const Route = createFileRoute(
  "/passport/$batchId",
)({
  component: PassportPage,
});