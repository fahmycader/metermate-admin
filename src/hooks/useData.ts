import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { webSocketService } from '@/services/websocket';
import { jobsAPI, usersAPI } from '@/lib/api';

// Mileage Report Hook
export function useMileageReport(dateRange: string = 'week') {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['mileageReport', dateRange],
    queryFn: () => jobsAPI.getMileageReport({ dateRange }),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    const unsubscribe = webSocketService.subscribe('mileageUpdate', (data) => {
      queryClient.invalidateQueries({ queryKey: ['mileageReport'] });
    });

    return unsubscribe;
  }, [queryClient]);

  return query;
}

// Users Hook
export function useMeterUsers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['meterUsers'],
    queryFn: () => usersAPI.getMeterUsers(),
    refetchInterval: 60000, // Refetch every minute
  });

  useEffect(() => {
    const unsubscribe = webSocketService.subscribe('userUpdate', (data) => {
      queryClient.invalidateQueries({ queryKey: ['meterUsers'] });
    });

    return unsubscribe;
  }, [queryClient]);

  return query;
}

// Jobs Hook
export function useJobs(params?: any) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['jobs', params],
    queryFn: () => jobsAPI.getJobs(params),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    const unsubscribe = webSocketService.subscribe('jobUpdate', (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    });

    return unsubscribe;
  }, [queryClient]);

  return query;
}

// Wage Report Hook
export function useWageReport(params?: any) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['wageReport', params],
    queryFn: () => jobsAPI.getWageReport(params),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    const unsubscribe = webSocketService.subscribe('wageUpdate', (data) => {
      queryClient.invalidateQueries({ queryKey: ['wageReport'] });
    });

    return unsubscribe;
  }, [queryClient]);

  return query;
}

// Wage Calculation Hook
export function useWageCalculation() {
  const mileageQuery = useMileageReport('all');
  const usersQuery = useMeterUsers();

  return {
    mileageData: mileageQuery.data,
    users: usersQuery.data,
    isLoading: mileageQuery.isLoading || usersQuery.isLoading,
    error: mileageQuery.error || usersQuery.error,
    refetch: () => {
      mileageQuery.refetch();
      usersQuery.refetch();
    },
  };
}

// Refresh Data Mutation
export function useRefreshData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['mileageReport'] }),
        queryClient.invalidateQueries({ queryKey: ['meterUsers'] }),
        queryClient.invalidateQueries({ queryKey: ['jobs'] }),
      ]);
    },
  });
}
