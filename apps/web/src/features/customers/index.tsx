import { useQuery } from "@tanstack/react-query";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/use-toast";
import type { Customer } from "@/features/customers/customer-table/columns";
import { CustomerTable } from "@/features/customers/customer-table/indext";
import {
  type CustomersFilters,
  Route,
} from "@/routes/_authenticated/dashboard/customers";
import { trpc } from "@/utils/trpc";

export default function CustomerPage() {
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { toast } = useToast();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const filters: CustomersFilters = {
    page: search.page,
    pageSize: search.pageSize,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    name: search.name,
    phoneNumber: search.phoneNumber,
  };

  const customersQuery = useQuery(trpc.customer.getAll.queryOptions(filters));
  const customers = customersQuery.data;

  // Handle pagination change
  const handlePaginationChange = (page: number, pageSize: number) => {
    navigate({
      search: (prev) => ({
        ...prev,
        page: page + 1, // TanStack Table uses 0-based indexing, but our API expects 1-based
        pageSize: pageSize,
      }),
    });
  };

  // Handle sorting change
  const handleSortingChange = (updatedSorting: SortingState) => {
    setSorting(updatedSorting);

    if (updatedSorting.length > 0) {
      navigate({
        search: (prev) => ({
          ...prev,
          sortBy: updatedSorting[0].id,
          sortOrder: updatedSorting[0].desc ? "desc" : "asc",
        }),
      });
    } else {
      navigate({
        search: (prev) => ({
          ...prev,
          sortBy: undefined,
          sortOrder: undefined,
        }),
      });
    }
  };

  // Handle filter change
  const handleFilterChange = (updatedFilters: ColumnFiltersState) => {
    setColumnFilters(updatedFilters);

    const nameFilter = updatedFilters.find((filter) => filter.id === "name");
    const phoneNumberFilter = updatedFilters.find(
      (filter) => filter.id === "phoneNumber",
    );

    navigate({
      search: (prev) => ({
        ...prev,
        name: nameFilter?.value as string | undefined,
        phoneNumber: phoneNumberFilter?.value as string | undefined,
        page: undefined, // Reset to first page on filter change
        pageSize: prev.pageSize === 10 ? undefined : prev.pageSize,
      }),
    });
  };

  // Handle edit customer
  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsAddCustomerOpen(true);
  };

  // Handle delete customer
  const handleDeleteCustomer = (customer: Customer) => {
    toast({
      title: "Customer deleted",
      description: `${customer.name} has been deleted.`,
    });
  };

  return (
    <div>
      <div>
        <div className="flex flex-row items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl">Customers</h1>
            <p className="text-gray-500 text-sm">
              Manage your customers inventory with advanced filtering and
              sorting.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingCustomer(null);
              setIsAddCustomerOpen(true);
            }}
          >
            Add Customer
          </Button>
        </div>
        <div>
          <CustomerTable
            data={{
              customers: customers.customers,
              pagination: customers.pagination,
            }}
            handlePaginationChange={handlePaginationChange}
            handleSortingChange={handleSortingChange}
            handleFilterChange={handleFilterChange}
            onEditCustomer={handleEditCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        </div>
      </div>
      {/*<CustomerForm*/}
      {/*  open={isAddCustomerOpen}*/}
      {/*  onOpenChange={setIsAddCustomerOpen}*/}
      {/*  initialData={editingCustomer || undefined}*/}
      {/*  onSuccess={(customer: Customer) => {*/}
      {/*    toast({*/}
      {/*      title: editingCustomer ? "Customer updated" : "Customer added",*/}
      {/*      description: `${customer.name} has been ${editingCustomer ? "updated" : "added"}.`,*/}
      {/*    });*/}
      {/*  }}*/}
      {/*/>*/}
    </div>
  );
}
