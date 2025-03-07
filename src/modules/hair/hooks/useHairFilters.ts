import { useCallback } from "react";
import { useSearchParams } from "next/navigation";

function useHairFilter() {
  const searchParams = useSearchParams();
  const colorParam = searchParams.get("color");
  const descriptionParam = searchParams.get("description");
  const upcParam = searchParams.get("upc");
  const lengthParam = searchParams.get("length");
  const weightParam = searchParams.get("weight");

  const color = colorParam ? colorParam : "";
  const description = descriptionParam ? descriptionParam : "";
  const upc = upcParam ? upcParam : "";
  const length = lengthParam ? parseInt(lengthParam) : 0;
  const weight = weightParam ? parseInt(weightParam) : 0;

  const createQueryString = useCallback(
    (filters: {
      color?: string;
      description?: string;
      upc?: string;
      length?: number;
      weight?: number;
    }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (filters.color && filters.color.trim() !== "") {
        params.set("color", filters.color);
      } else {
        params.delete("color");
      }
      if (filters.description && filters.description.trim() !== "") {
        params.set("description", filters.description);
      } else {
        params.delete("description");
      }
      if (filters.upc && filters.upc.trim() !== "") {
        params.set("upc", filters.upc);
      } else {
        params.delete("upc");
      }
      if (filters.length && filters.length !== 0) {
        params.set("length", filters.length.toString());
      } else {
        params.delete("length");
      }
      if (filters.weight && filters.weight !== 0) {
        params.set("weight", filters.weight.toString());
      } else {
        params.delete("weight");
      }

      return params.toString().trim() !== "" ? `?${params.toString()}` : "";
    },
    [searchParams],
  );

  // Create a human-readable label for the active filters
  const activeFilters: string[] = [];
  if (color) activeFilters.push(`Color: ${color}`);
  if (description) activeFilters.push(`Description: ${description}`);
  if (upc) activeFilters.push(`UPC: ${upc}`);
  if (length) activeFilters.push(`Length: ${length}cm`);
  if (weight) activeFilters.push(`Weight: ${weight}g`);

  const label =
    activeFilters.length > 0 ? activeFilters.join(", ") : "No filters applied";

  return {
    color,
    description,
    upc,
    length,
    weight,
    label,
    createQueryString,
  };
}

export default useHairFilter;
