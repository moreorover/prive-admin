import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { type Contact, createColumns } from "./columns";

interface ContactTableProps {
  data: {
    contacts: Contact[];
    pagination: {
      page: number;
      pageSize: number;
      totalPages: number;
    };
  };
  handlePaginationChange: (page: number, pageSize: number) => void;
  handleSortingChange: (sorting: SortingState) => void;
  handleFilterChange: (filters: ColumnFiltersState) => void;
  onEditContact?: (contact: Contact) => void;
  onDeleteContact?: (contact: Contact) => void;
}

export function ContactTable({
  data,
  handlePaginationChange,
  handleSortingChange,
  handleFilterChange,
  onEditContact,
  onDeleteContact,
}: ContactTableProps) {
  // Create columns with action handlers
  const tableColumns = createColumns({
    onEdit: onEditContact,
    onDelete: onDeleteContact,
  });

  return (
    <DataTable
      columns={tableColumns}
      data={data.contacts}
      filterKeys={["name", "phoneNumber"]}
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
