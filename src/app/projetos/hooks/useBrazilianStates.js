import { useQuery } from "@tanstack/react-query";
import { fetchBrazilianStates } from "../services/projectApi";

export default function useBrazilianStates() {
  return useQuery({
    queryKey: ["geo", "brazil", "states"],
    queryFn: fetchBrazilianStates,
    networkMode: "always",
    staleTime: 1000 * 60 * 60 * 24, // 24h
  });
}
