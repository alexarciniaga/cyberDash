/**
 * Response Formatter Service
 * Provides standardized response formatting for all API endpoints
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error?: string;
  metadata?: {
    timestamp: string;
    source: string;
    version: string;
    [key: string]: any;
  };
}

export interface CounterResponseData {
  id: string;
  title: string;
  description: string;
  type: "counter";
  value: {
    value: number;
    change: number;
    changePercent: number;
    previous?: number;
  };
  lastUpdated: string;
  source: string;
  metadata?: any;
}

export interface DistributionResponseData {
  id: string;
  title: string;
  description: string;
  type: "distribution";
  distribution: Array<{
    label: string;
    value: number;
    percentage?: number;
    metadata?: any;
  }>;
  total: number;
  lastUpdated: string;
  source: string;
  metadata?: any;
}

export interface TimeseriesResponseData {
  id: string;
  title: string;
  description: string;
  type: "timeseries";
  timeseries: Array<{
    timestamp: string;
    value: number;
    metadata?: any;
  }>;
  interval: string;
  lastUpdated: string;
  source: string;
  metadata?: any;
}

export interface ListResponseData {
  id: string;
  title: string;
  description: string;
  type: "list";
  list: Array<{
    id?: string;
    title: string;
    subtitle?: string;
    value?: string | number;
    badge?: {
      text: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    };
    metadata?: any;
  }>;
  total: number;
  lastUpdated: string;
  source: string;
  metadata?: any;
}

/**
 * Response Formatter Class
 * Centralizes all response formatting logic
 */
export class ResponseFormatter {
  private static readonly API_VERSION = "1.0.0";

  /**
   * Format a successful counter response
   */
  static formatCounterResponse(
    config: {
      id: string;
      title: string;
      description: string;
      source: string;
    },
    data: {
      current: number;
      previous: number;
      change: number;
      changePercent: number;
      metadata?: any;
    },
    additionalMetadata: any = {}
  ): ApiResponse<CounterResponseData> {
    return {
      success: true,
      data: {
        id: config.id,
        title: config.title,
        description: config.description,
        type: "counter",
        value: {
          value: data.current,
          change: data.change,
          changePercent: data.changePercent,
          previous: data.previous,
        },
        lastUpdated: new Date().toISOString(),
        source: config.source,
        metadata: {
          ...data.metadata,
          ...additionalMetadata,
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: config.source,
        version: this.API_VERSION,
      },
    };
  }

  /**
   * Format a successful distribution response
   */
  static formatDistributionResponse(
    config: {
      id: string;
      title: string;
      description: string;
      source: string;
    },
    data: Array<{
      label: string;
      value: number;
      percentage?: number;
      metadata?: any;
    }>,
    additionalMetadata: any = {}
  ): ApiResponse<DistributionResponseData> {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return {
      success: true,
      data: {
        id: config.id,
        title: config.title,
        description: config.description,
        type: "distribution",
        distribution: data,
        total,
        lastUpdated: new Date().toISOString(),
        source: config.source,
        metadata: additionalMetadata,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: config.source,
        version: this.API_VERSION,
      },
    };
  }

  /**
   * Format a successful timeseries response
   */
  static formatTimeseriesResponse(
    config: {
      id: string;
      title: string;
      description: string;
      source: string;
    },
    data: Array<{
      timestamp: string;
      value: number;
      metadata?: any;
    }>,
    interval: string = "day",
    additionalMetadata: any = {}
  ): ApiResponse<TimeseriesResponseData> {
    return {
      success: true,
      data: {
        id: config.id,
        title: config.title,
        description: config.description,
        type: "timeseries",
        timeseries: data,
        interval,
        lastUpdated: new Date().toISOString(),
        source: config.source,
        metadata: additionalMetadata,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: config.source,
        version: this.API_VERSION,
      },
    };
  }

  /**
   * Format a successful list response
   */
  static formatListResponse(
    config: {
      id: string;
      title: string;
      description: string;
      source: string;
    },
    data: Array<{
      id?: string;
      title: string;
      subtitle?: string;
      value?: string | number;
      badge?: {
        text: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      };
      metadata?: any;
    }>,
    additionalMetadata: any = {}
  ): ApiResponse<ListResponseData> {
    return {
      success: true,
      data: {
        id: config.id,
        title: config.title,
        description: config.description,
        type: "list",
        list: data,
        total: data.length,
        lastUpdated: new Date().toISOString(),
        source: config.source,
        metadata: additionalMetadata,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: config.source,
        version: this.API_VERSION,
      },
    };
  }

  /**
   * Format an error response
   */
  static formatErrorResponse(
    message: string,
    error?: any,
    source: string = "unknown"
  ): ApiResponse<null> {
    // Log error for debugging (in production, use proper logging service)
    console.error("API Error:", {
      message,
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      source,
    });

    return {
      success: false,
      data: null,
      error: message,
      metadata: {
        timestamp: new Date().toISOString(),
        source,
        version: this.API_VERSION,
      },
    };
  }

  /**
   * Format validation error response
   */
  static formatValidationErrorResponse(
    validationErrors: Array<{
      field: string;
      message: string;
    }>,
    source: string = "unknown"
  ): ApiResponse<null> {
    const errorMessage = `Validation failed: ${validationErrors
      .map((err) => `${err.field}: ${err.message}`)
      .join(", ")}`;

    return {
      success: false,
      data: null,
      error: errorMessage,
      metadata: {
        timestamp: new Date().toISOString(),
        source,
        version: this.API_VERSION,
        validationErrors,
      },
    };
  }

  /**
   * Transform distribution data to list format
   * Useful for widgets that can display data as either distribution or list
   */
  static transformDistributionToList(
    distributionData: Array<{
      label: string;
      value: number;
      percentage?: number;
      metadata?: any;
    }>,
    options: {
      showPercentage?: boolean;
      showRank?: boolean;
      valueFormatter?: (value: number) => string;
    } = {}
  ): Array<{
    id: string;
    title: string;
    subtitle?: string;
    value: string;
    metadata?: any;
  }> {
    const {
      showPercentage = false,
      showRank = false,
      valueFormatter,
    } = options;

    return distributionData.map((item, index) => {
      const rank = index + 1;
      const formattedValue = valueFormatter
        ? valueFormatter(item.value)
        : item.value.toLocaleString();

      const value =
        showPercentage && item.percentage
          ? `${formattedValue} (${item.percentage}%)`
          : formattedValue;

      const title = showRank ? `${rank}. ${item.label}` : item.label;

      return {
        id: `${item.label}-${index}`,
        title,
        value,
        metadata: {
          ...item.metadata,
          rank,
          originalValue: item.value,
          percentage: item.percentage,
        },
      };
    });
  }

  /**
   * Transform timeseries data for chart consumption
   * Formats data specifically for chart components
   */
  static transformTimeseriesForChart(
    timeseriesData: Array<{
      timestamp: string;
      value: number;
      metadata?: any;
    }>,
    options: {
      dateFormat?: "short" | "long" | "numeric";
      fillGaps?: boolean;
    } = {}
  ): Array<{
    name: string;
    value: number;
    date: string;
    metadata?: any;
  }> {
    const { dateFormat = "short" } = options;

    return timeseriesData.map((point) => {
      const date = new Date(point.timestamp);
      let name: string;

      switch (dateFormat) {
        case "long":
          name = date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          break;
        case "numeric":
          name = date.toLocaleDateString("en-US");
          break;
        default:
          name = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
      }

      return {
        name,
        value: point.value,
        date: point.timestamp,
        metadata: point.metadata,
      };
    });
  }

  /**
   * Create a generic success response
   * For responses that don't fit standard patterns
   */
  static formatGenericResponse<T>(
    data: T,
    source: string = "unknown",
    additionalMetadata: any = {}
  ): ApiResponse<T> {
    return {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        source,
        version: this.API_VERSION,
        ...additionalMetadata,
      },
    };
  }

  /**
   * Validate response data structure
   * Ensures response meets expected format
   */
  static validateResponseStructure(response: any): boolean {
    if (!response || typeof response !== "object") {
      return false;
    }

    const hasRequiredFields =
      typeof response.success === "boolean" &&
      response.data !== undefined &&
      response.metadata &&
      typeof response.metadata === "object";

    return hasRequiredFields;
  }
}
