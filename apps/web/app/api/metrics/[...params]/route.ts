import { NextRequest, NextResponse } from "next/server";
import { MetricService } from "@/lib/services/metric-service";
import { getMetricConfig, isValidMetric } from "@/lib/services/metric-configs";

/**
 * Dynamic Metric API Route
 * Replaces 16 individual metric endpoint files
 * Handles: /api/metrics/[source]/[metricId]
 * Examples:
 *   - /api/metrics/cisa/total-count
 *   - /api/metrics/nvd/critical-count
 *   - /api/metrics/mitre/technique-count
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ params: string[] }> }
) {
  try {
    // Parse URL parameters
    const { params: urlParams } = await params;
    const [source, metricId] = urlParams;

    if (!source || !metricId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid URL format. Expected: /api/metrics/[source]/[metricId]",
          data: null,
        },
        { status: 400 }
      );
    }

    // Validate metric exists
    if (!isValidMetric(source, metricId)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unknown metric: ${source}/${metricId}`,
          data: null,
          availableMetrics: Object.keys(
            require("@/lib/services/metric-configs").METRIC_CONFIGS
          ),
        },
        { status: 404 }
      );
    }

    // Get metric configuration
    const config = getMetricConfig(source, metricId)!;

    // Parse date range from query parameters
    const { searchParams } = new URL(request.url);
    const dateRange = MetricService.parseDateRange(searchParams);

    let responseData: any = {};

    // Route to appropriate service method based on metric type
    switch (config.type) {
      case "counter": {
        const result = await MetricService.executeCountQuery(
          config.table,
          config.conditions!,
          dateRange
        );

        responseData = {
          value: {
            label: config.title,
            value: result.value,
            change: result.change,
            changePercent: result.changePercent,
          },
          metadata: {
            ...result.metadata,
            dateRange: {
              from: dateRange.from.toISOString(),
              to: dateRange.to.toISOString(),
            },
          },
        };
        break;
      }

      case "simple-counter": {
        const result = await MetricService.executeSimpleCountQuery(
          config.table,
          config.conditions!
        );

        responseData = {
          value: {
            label: config.title,
            value: result.value,
            change: result.change,
            changePercent: result.changePercent,
          },
          metadata: {
            ...result.metadata,
          },
        };
        break;
      }

      case "distribution": {
        const result = await MetricService.executeDistributionQuery(
          config.table,
          config.conditions!,
          dateRange
        );

        // Get top item for value display
        const topItem = result[0];

        responseData = {
          value: {
            label: topItem?.label || "No data",
            value: topItem?.value || 0,
          },
          distribution: result,
          list: result.map((item, index) => ({
            id: `${config.id}-${index}`,
            title: item.label,
            subtitle: `${item.value} ${getCountLabel(config.id)}`,
            description: getItemDescription(item, config.id),
            value: item.value,
            metadata: item.metadata,
          })),
          metadata: {
            totalItems: result.length,
            totalCount: result.reduce((sum, item) => sum + item.value, 0),
            topItemShare: topItem
              ? Math.round(
                  (topItem.value /
                    result.reduce((sum, item) => sum + item.value, 0)) *
                    100
                )
              : 0,
            dateRange: {
              from: dateRange.from.toISOString(),
              to: dateRange.to.toISOString(),
            },
          },
        };
        break;
      }

      case "timeseries": {
        // Determine appropriate interval based on date range
        const daysDiff = Math.ceil(
          (dateRange.to.getTime() - dateRange.from.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const interval =
          daysDiff > 90 ? "month" : daysDiff > 30 ? "week" : "day";

        const result = await MetricService.executeTimeseriesQuery(
          config.table,
          config.conditions!,
          dateRange,
          interval
        );

        responseData = {
          value: {
            label: "Total",
            value: result.reduce((sum, point) => sum + point.value, 0),
          },
          timeseries: result,
          chart: {
            type: "line",
            data: result.map((point) => ({
              x: point.date,
              y: point.value,
            })),
            interval,
          },
          metadata: {
            totalPoints: result.length,
            interval,
            dateRange: {
              from: dateRange.from.toISOString(),
              to: dateRange.to.toISOString(),
            },
          },
        };
        break;
      }

      default:
        return NextResponse.json(
          MetricService.formatError(`Unsupported metric type: ${config.type}`),
          { status: 400 }
        );
    }

    // Return response directly (already formatted)
    return NextResponse.json({
      success: true,
      data: responseData,
      metadata: {
        timestamp: new Date().toISOString(),
        source: config.metadata?.source || "unknown",
        version: "1.0.0",
      },
    });
  } catch (error) {
    console.error("Dynamic metric API error:", error);

    return NextResponse.json(
      MetricService.formatError("Failed to fetch metric data", error),
      { status: 500 }
    );
  }
}

/**
 * Helper function to get appropriate count label for different metrics
 */
function getCountLabel(metricId: string): string {
  if (metricId.includes("vulnerability") || metricId.includes("cve")) {
    return "vulnerabilities";
  }
  if (metricId.includes("technique")) {
    return "techniques";
  }
  if (metricId.includes("vendor")) {
    return "vulnerabilities";
  }
  if (metricId.includes("product")) {
    return "vulnerabilities";
  }
  return "items";
}

/**
 * Helper function to generate item descriptions for list display
 */
function getItemDescription(item: any, metricId: string): string {
  if (item.metadata?.latestDate) {
    return `Latest: ${new Date(item.metadata.latestDate).toLocaleDateString()}`;
  }
  if (item.metadata?.rank) {
    return `Rank #${item.metadata.rank}`;
  }
  return "";
}
