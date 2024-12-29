import { Grid, GridCol } from "@mantine/core";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PageContainer } from "@/components/page_container/PageContainer";
import { redirect } from "next/navigation";
import { getCustomers } from "@/data-access/customer";
import CustomersTable from "./CustomersTable";

export default async function DashboardContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  const customers = await getCustomers();
  return (
    <PageContainer title="Customers">
      <Grid>
        <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
          <CustomersTable customers={customers} />
        </GridCol>
      </Grid>
    </PageContainer>
  );
}
