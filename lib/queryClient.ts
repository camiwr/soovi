import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,               
      staleTime: 60_000,        
      gcTime: 5 * 60_000,      
      refetchOnReconnect: true,
      refetchOnMount: false,
      refetchOnWindowFocus: false, 
    },
    mutations: {
      retry: 0,
    },
  },
});