import { useCallback } from "react";

function useHairFilter(searchParams: {
  color?: string;
  description?: string;
  upc?: string;
  length?: number;
  weight?: number;
}) {
  const createQueryString = useCallback(
    (filters: {
      color?: string;
      description?: string;
      upc?: string;
      length?: number;
      weight?: number;
    }) => {
      const params = new URLSearchParams();
      if (filters.color && filters.color.trim() !== "") {
        params.set("color", filters.color);
      }
      if (filters.description && filters.description.trim() !== "") {
        params.set("description", filters.description);
      }
      if (filters.upc && filters.upc.trim() !== "") {
        params.set("upc", filters.upc);
      }
      if (filters.length && filters.length !== 0) {
        params.set("length", filters.length.toString());
      }
      if (filters.weight && filters.weight !== 0) {
        params.set("weight", filters.weight.toString());
      }

      return params.toString().trim() !== "" ? `?${params.toString()}` : "";
    },
    [searchParams],
  );

  // Create a human-readable label for the active filters
  const activeFilters: string[] = [];
  if (searchParams.color) activeFilters.push(`Color: ${searchParams.color}`);
  if (searchParams.description)
    activeFilters.push(`Description: ${searchParams.description}`);
  if (searchParams.upc) activeFilters.push(`UPC: ${searchParams.upc}`);
  if (searchParams.length)
    activeFilters.push(`Length: ${searchParams.length}cm`);
  if (searchParams.weight)
    activeFilters.push(`Weight: ${searchParams.weight}g`);

  const label =
    activeFilters.length > 0 ? activeFilters.join(", ") : "No filters applied";

  return {
    label,
    createQueryString,
  };
}

export default useHairFilter;
