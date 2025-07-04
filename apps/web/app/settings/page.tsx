"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Target,
  Activity,
  RefreshCwIcon,
  DatabaseIcon,
  ServerIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  LoaderIcon,
  SettingsIcon,
  ArrowLeftIcon,
  BookOpenIcon,
} from "lucide-react";

interface HealthStatus {
  status: string;
  timestamp: string;
  database: string;
  tables: Record<string, boolean>;
  schema_ready: boolean;
}

interface IngestionResult {
  message: string;
  recordsProcessed?: number;
  recordsAdded?: number;
  recordsUpdated?: number;
  catalogVersion?: string;
  dateReleased?: string;
  totalVulnerabilities?: number;
  duration?: number;
}

interface IngestionState {
  loading: boolean;
  result: IngestionResult | null;
  error: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [healthStatus, setHealthStatus] = React.useState<HealthStatus | null>(
    null
  );
  const [healthLoading, setHealthLoading] = React.useState(false);
  const [cisaState, setCisaState] = React.useState<IngestionState>({
    loading: false,
    result: null,
    error: null,
  });
  const [mitreState, setMitreState] = React.useState<IngestionState>({
    loading: false,
    result: null,
    error: null,
  });
  const [nvdState, setNvdState] = React.useState<IngestionState>({
    loading: false,
    result: null,
    error: null,
  });

  // Fetch health status on component mount
  React.useEffect(() => {
    fetchHealthStatus();
  }, []);

  const fetchHealthStatus = async () => {
    setHealthLoading(true);
    try {
      const response = await fetch("/api/health");
      const data = await response.json();

      if (data.success) {
        setHealthStatus(data.data);
      } else {
        setHealthStatus({
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          database: "error",
          tables: {},
          schema_ready: false,
        });
      }
    } catch (error) {
      console.error("Failed to fetch health status:", error);
      setHealthStatus({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "error",
        tables: {},
        schema_ready: false,
      });
    } finally {
      setHealthLoading(false);
    }
  };

  const runIngestion = async (
    source: "cisa-kev" | "mitre-attack" | "nvd-cve",
    setState: React.Dispatch<React.SetStateAction<IngestionState>>
  ) => {
    setState({ loading: true, result: null, error: null });

    try {
      const response = await fetch(`/api/ingestion/${source}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setState({ loading: false, result: data.data, error: null });
      } else {
        setState({
          loading: false,
          result: null,
          error: data.error || "Ingestion failed",
        });
      }
    } catch (error) {
      setState({
        loading: false,
        result: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case "unhealthy":
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-700 border-green-200"
          >
            Healthy
          </Badge>
        );
      case "unhealthy":
        return <Badge variant="destructive">Unhealthy</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const handleNavigation = (path: string) => {
    setIsNavigating(true);
    router.push(path);
    // Reset loading state after a brief delay to account for navigation
    setTimeout(() => setIsNavigating(false), 2000);
  };

  return (
    <div className="relative">
      {/* Navigation Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 p-8 rounded-lg border bg-card shadow-lg">
            <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <h3 className="font-semibold text-lg">Loading Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we navigate...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto p-6 space-y-8 max-w-6xl">
        {/* Back Button */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation("/")}
            disabled={isNavigating}
            className="text-muted-foreground hover:text-foreground min-w-[140px]"
          >
            {isNavigating ? (
              <>
                <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              <>
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </>
            )}
          </Button>
        </div>

        {/* Page Header */}
        <div className="rounded-lg border bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 dark:bg-primary/20">
                <SettingsIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Server Settings
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                  Manage data ingestion, monitor server health, and view system
                  statistics
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                window.open(
                  "https://github.com/alexarciniaga/cyberDash/tree/main/docs",
                  "_blank"
                )
              }
              disabled={isNavigating}
              className="gap-2"
            >
              <BookOpenIcon className="h-4 w-4" />
              Documentation
            </Button>
          </div>
        </div>

        {/* Server Health Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/50">
                  <ServerIcon className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Server Health
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Current server status and database connectivity
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchHealthStatus}
                disabled={healthLoading}
                className="min-w-[100px]"
              >
                {healthLoading ? (
                  <>
                    <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCwIcon className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {healthStatus ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(healthStatus.status)}
                    <span className="font-medium">Overall Status</span>
                  </div>
                  {getStatusBadge(healthStatus.status)}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DatabaseIcon className="h-4 w-4" />
                    <span className="font-medium">Database</span>
                  </div>
                  {healthStatus.database === "connected" ? (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 border-green-200"
                    >
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Disconnected</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Schema Ready</span>
                  {healthStatus.schema_ready ? (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 border-green-200"
                    >
                      Ready
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not Ready</Badge>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  Last checked:{" "}
                  {new Date(healthStatus.timestamp).toLocaleString()}
                </div>

                {Object.keys(healthStatus.tables).length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Database Tables</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(healthStatus.tables).map(
                        ([table, exists]) => (
                          <div
                            key={table}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="font-mono">{table}</span>
                            {exists ? (
                              <CheckCircleIcon className="h-3 w-3 text-green-600" />
                            ) : (
                              <XCircleIcon className="h-3 w-3 text-red-600" />
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <LoaderIcon className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Loading health status...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Ingestion Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/50">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Data Ingestion
                </CardTitle>
                <CardDescription className="mt-1">
                  Trigger manual data ingestion from external sources
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* CISA KEV Ingestion */}
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">CISA KEV</h3>
                    <p className="text-sm text-muted-foreground">
                      Known Exploited Vulnerabilities
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {cisaState.result && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 border-green-200"
                    >
                      Last run successful
                    </Badge>
                  )}
                  {cisaState.error && (
                    <Badge variant="destructive">Failed</Badge>
                  )}
                  <Button
                    onClick={() => runIngestion("cisa-kev", setCisaState)}
                    disabled={cisaState.loading}
                    className="min-w-[120px]"
                  >
                    {cisaState.loading ? (
                      <>
                        <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                        Running...
                      </>
                    ) : (
                      "Run Ingestion"
                    )}
                  </Button>
                </div>
              </div>

              {cisaState.result && (
                <div className="bg-green-50 dark:bg-green-950/50 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-3 flex-1">
                      <div>
                        <h4 className="font-medium text-green-900 dark:text-green-100">
                          Ingestion Completed Successfully
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          {cisaState.result.message}
                        </p>
                      </div>

                      {(cisaState.result.recordsProcessed ||
                        cisaState.result.recordsAdded ||
                        cisaState.result.duration) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {cisaState.result.recordsProcessed && (
                            <div className="bg-white/50 dark:bg-black/20 rounded-md p-3">
                              <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                                Records Processed
                              </div>
                              <div className="text-lg font-semibold text-green-900 dark:text-green-100">
                                {cisaState.result.recordsProcessed.toLocaleString()}
                              </div>
                            </div>
                          )}
                          {cisaState.result.recordsAdded && (
                            <div className="bg-white/50 dark:bg-black/20 rounded-md p-3">
                              <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                                Records Added
                              </div>
                              <div className="text-lg font-semibold text-green-900 dark:text-green-100">
                                {cisaState.result.recordsAdded.toLocaleString()}
                              </div>
                            </div>
                          )}
                          {cisaState.result.duration && (
                            <div className="bg-white/50 dark:bg-black/20 rounded-md p-3">
                              <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                                Duration
                              </div>
                              <div className="text-lg font-semibold text-green-900 dark:text-green-100">
                                {formatDuration(cisaState.result.duration)}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {cisaState.error && (
                <div className="bg-red-50 dark:bg-red-950/50 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-3">
                    <XCircleIcon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-red-900 dark:text-red-100">
                        Ingestion Failed
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {cisaState.error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MITRE ATT&CK Ingestion */}
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/50">
                    <Target className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">MITRE ATT&CK</h3>
                    <p className="text-sm text-muted-foreground">
                      Adversarial Tactics, Techniques & Common Knowledge
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {mitreState.result && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 border-green-200"
                    >
                      Last run successful
                    </Badge>
                  )}
                  {mitreState.error && (
                    <Badge variant="destructive">Failed</Badge>
                  )}
                  <Button
                    onClick={() => runIngestion("mitre-attack", setMitreState)}
                    disabled={mitreState.loading}
                    className="min-w-[120px]"
                  >
                    {mitreState.loading ? (
                      <>
                        <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                        Running...
                      </>
                    ) : (
                      "Run Ingestion"
                    )}
                  </Button>
                </div>
              </div>

              {mitreState.result && (
                <div className="bg-green-50 dark:bg-green-950/50 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-3 flex-1">
                      <div>
                        <h4 className="font-medium text-green-900 dark:text-green-100">
                          Ingestion Completed Successfully
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          {mitreState.result.message}
                        </p>
                      </div>

                      {(mitreState.result.recordsProcessed ||
                        mitreState.result.recordsAdded ||
                        mitreState.result.duration) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {mitreState.result.recordsProcessed && (
                            <div className="bg-white/50 dark:bg-black/20 rounded-md p-3">
                              <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                                Records Processed
                              </div>
                              <div className="text-lg font-semibold text-green-900 dark:text-green-100">
                                {mitreState.result.recordsProcessed.toLocaleString()}
                              </div>
                            </div>
                          )}
                          {mitreState.result.recordsAdded && (
                            <div className="bg-white/50 dark:bg-black/20 rounded-md p-3">
                              <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                                Records Added
                              </div>
                              <div className="text-lg font-semibold text-green-900 dark:text-green-100">
                                {mitreState.result.recordsAdded.toLocaleString()}
                              </div>
                            </div>
                          )}
                          {mitreState.result.duration && (
                            <div className="bg-white/50 dark:bg-black/20 rounded-md p-3">
                              <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                                Duration
                              </div>
                              <div className="text-lg font-semibold text-green-900 dark:text-green-100">
                                {formatDuration(mitreState.result.duration)}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {mitreState.error && (
                <div className="bg-red-50 dark:bg-red-950/50 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-3">
                    <XCircleIcon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-red-900 dark:text-red-100">
                        Ingestion Failed
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {mitreState.error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* NVD CVE Ingestion */}
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/50">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">NVD CVE</h3>
                    <p className="text-sm text-muted-foreground">
                      National Vulnerability Database - Common Vulnerabilities
                      and Exposures
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {nvdState.result && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 border-green-200"
                    >
                      Last run successful
                    </Badge>
                  )}
                  {nvdState.error && (
                    <Badge variant="destructive">Failed</Badge>
                  )}
                  <Button
                    onClick={() => runIngestion("nvd-cve", setNvdState)}
                    disabled={nvdState.loading}
                    className="min-w-[120px]"
                  >
                    {nvdState.loading ? (
                      <>
                        <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                        Running...
                      </>
                    ) : (
                      "Run Ingestion"
                    )}
                  </Button>
                </div>
              </div>

              {nvdState.result && (
                <div className="bg-green-50 dark:bg-green-950/50 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-3 flex-1">
                      <div>
                        <h4 className="font-medium text-green-900 dark:text-green-100">
                          Ingestion Completed Successfully
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          {nvdState.result.message}
                        </p>
                      </div>

                      {(nvdState.result.recordsProcessed ||
                        nvdState.result.recordsAdded ||
                        nvdState.result.duration) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {nvdState.result.recordsProcessed && (
                            <div className="bg-white/50 dark:bg-black/20 rounded-md p-3">
                              <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                                Records Processed
                              </div>
                              <div className="text-lg font-semibold text-green-900 dark:text-green-100">
                                {nvdState.result.recordsProcessed.toLocaleString()}
                              </div>
                            </div>
                          )}
                          {nvdState.result.recordsAdded && (
                            <div className="bg-white/50 dark:bg-black/20 rounded-md p-3">
                              <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                                Records Added
                              </div>
                              <div className="text-lg font-semibold text-green-900 dark:text-green-100">
                                {nvdState.result.recordsAdded.toLocaleString()}
                              </div>
                            </div>
                          )}
                          {nvdState.result.duration && (
                            <div className="bg-white/50 dark:bg-black/20 rounded-md p-3">
                              <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                                Duration
                              </div>
                              <div className="text-lg font-semibold text-green-900 dark:text-green-100">
                                {formatDuration(nvdState.result.duration)}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {nvdState.error && (
                <div className="bg-red-50 dark:bg-red-950/50 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-3">
                    <XCircleIcon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-red-900 dark:text-red-100">
                        Ingestion Failed
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {nvdState.error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50">
                <RefreshCwIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Quick Actions
                </CardTitle>
                <CardDescription className="mt-1">
                  Commonly used administrative functions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  runIngestion("cisa-kev", setCisaState);
                  runIngestion("mitre-attack", setMitreState);
                  runIngestion("nvd-cve", setNvdState);
                }}
                disabled={
                  cisaState.loading || mitreState.loading || nvdState.loading
                }
                className="h-auto p-4 flex-col items-start gap-2"
              >
                <div className="flex items-center gap-2 w-full">
                  <RefreshCwIcon className="h-5 w-5 text-orange-600" />
                  <span className="font-medium">Run All Ingestions</span>
                </div>
                <span className="text-sm text-muted-foreground text-left">
                  Execute CISA KEV, MITRE ATT&CK, and NVD CVE ingestions
                </span>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={fetchHealthStatus}
                disabled={healthLoading}
                className="h-auto p-4 flex-col items-start gap-2"
              >
                <div className="flex items-center gap-2 w-full">
                  <DatabaseIcon className="h-5 w-5 text-slate-600" />
                  <span className="font-medium">Check System Health</span>
                </div>
                <span className="text-sm text-muted-foreground text-left">
                  Verify database connectivity and table status
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
