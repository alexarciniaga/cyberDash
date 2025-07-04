import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/lib/types";

// Types for API responses
interface DashboardResponse {
  success: boolean;
  data: DashboardLayout;
  error?: string;
}

interface DashboardListResponse {
  success: boolean;
  data: DashboardLayout[];
  error?: string;
}

// Hook to fetch all dashboards
export function useDashboards() {
  return useQuery<DashboardLayout[]>({
    queryKey: ["dashboards"],
    queryFn: async () => {
      const response = await fetch("/api/dashboards");
      const result: DashboardListResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch dashboards");
      }

      return result.data;
    },
    refetchOnWindowFocus: false,
  });
}

// Hook to fetch a specific dashboard
export function useDashboard(id: string) {
  return useQuery<DashboardLayout>({
    queryKey: ["dashboard", id],
    queryFn: async () => {
      const response = await fetch(`/api/dashboards/${id}`);
      const result: DashboardResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch dashboard");
      }

      return result.data;
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
}

// Hook to create a new dashboard
export function useCreateDashboard() {
  const queryClient = useQueryClient();

  return useMutation<
    DashboardLayout,
    Error,
    Omit<DashboardLayout, "id" | "createdAt" | "updatedAt">
  >({
    mutationFn: async (dashboardData) => {
      const response = await fetch("/api/dashboards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dashboardData),
      });

      const result: DashboardResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create dashboard");
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidate and refetch dashboards list
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
    },
  });
}

// Hook to update a dashboard
export function useUpdateDashboard() {
  const queryClient = useQueryClient();

  return useMutation<
    DashboardLayout,
    Error,
    { id: string; data: Partial<DashboardLayout> }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/dashboards/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result: DashboardResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update dashboard");
      }

      return result.data;
    },
    onSuccess: (data) => {
      // Update the specific dashboard in cache
      queryClient.setQueryData(["dashboard", data.id], data);
      // Invalidate dashboards list to refresh order/default status
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
    },
  });
}

// Hook to delete a dashboard
export function useDeleteDashboard() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const response = await fetch(`/api/dashboards/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to delete dashboard");
      }
    },
    onSuccess: (_, deletedId) => {
      // Remove the dashboard from cache
      queryClient.removeQueries({ queryKey: ["dashboard", deletedId] });

      // Optimistically update the dashboards list cache by removing the deleted dashboard
      queryClient.setQueryData<DashboardLayout[]>(
        ["dashboards"],
        (oldDashboards) => {
          if (!oldDashboards) return oldDashboards;
          return oldDashboards.filter(
            (dashboard) => dashboard.id !== deletedId
          );
        }
      );

      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
    },
  });
}

// Hook to get the default dashboard
export function useDefaultDashboard() {
  const { data: dashboards, isLoading, error } = useDashboards();

  const defaultDashboard = dashboards?.find((dashboard) => dashboard.isDefault);

  return {
    data: defaultDashboard,
    isLoading,
    error,
  };
}
