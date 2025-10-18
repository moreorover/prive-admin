import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { type Customer, createColumns } from "./columns";

interface CustomerTableProps {
  data: {
    customers: Customer[];
    pagination: {
      page: number;
      pageSize: number;
      totalPages: number;
    };
  };
  handlePaginationChange: (page: number, pageSize: number) => void;
  handleSortingChange: (sorting: SortingState) => void;
  handleFilterChange: (filters: ColumnFiltersState) => void;
  onEditCustomer?: (customer: Customer) => void;
  onDeleteCustomer?: (customer: Customer) => void;
}

export function CustomerTable({
  data,
  handlePaginationChange,
  handleSortingChange,
  handleFilterChange,
  onEditCustomer,
  onDeleteCustomer,
}: CustomerTableProps) {
  // Create columns with action handlers
  const tableColumns = createColumns({
    onEdit: onEditCustomer,
    onDelete: onDeleteCustomer,
  });

  return (
    <DataTable
      columns={tableColumns}
      data={data.customers}
      searchKey="name"
      onPaginationChange={handlePaginationChange}
      onSortingChange={handleSortingChange}
      onFilterChange={handleFilterChange}
      serverSide={true}
      pagination={{
        pageIndex: data.pagination.page,
        pageSize: data.pagination.pageSize,
        pageCount: data.pagination.totalPages,
      }}
    />
  );
}
