"use client";

import {
  Button,
  Divider,
  Flex,
  Grid,
  GridCol,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { trpc } from "@/trpc/client";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import Surface from "@/modules/ui/components/surface";
import { useRouter } from "next/navigation";
import HairTable from "@/modules/hair/ui/components/hair-table";
import useHairFilter from "@/modules/hair/hooks/useHairFilters";
import { HairFilterDrawer } from "@/modules/hair/ui/components/hair-filter-drawer";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";

dayjs.extend(isoWeek);

interface Props {
  searchParams: {
    color?: string;
    description?: string;
    upc?: string;
    length?: number;
    weight?: number;
    weightReceived?: number;
  };
}

export const HairsView = ({ searchParams }: Props) => {
  const utils = trpc.useUtils();
  const router = useRouter();
  const { label, createQueryString } = useHairFilter(searchParams);
  const createBlankHair = trpc.hair.createBlankHair.useMutation({
    onSuccess: async (data) => {
      utils.hair.getAll.invalidate();
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Blank Hair created.",
      });
      router.push(`/dashboard/hair/${data.id}`);
    },
    onError: async () => {
      notifications.show({
        color: "red",
        title: "Error!",
        message: "Failed to create Blank Hair.",
      });
    },
  });

  const openConfirmModal = () =>
    modals.openConfirmModal({
      title: "Create Blank Hair?",
      centered: true,
      children: (
        <Text size="sm">Are you sure you want to create blank hair?</Text>
      ),
      labels: { confirm: "Create", cancel: "Cancel" },
      confirmProps: { color: "green" },
      onCancel: () => {},
      onConfirm: () => createBlankHair.mutate(),
    });

  return (
    <Stack gap="sm">
      <Surface component={Paper} style={{ backgroundColor: "transparent" }}>
        <Flex
          justify="space-between"
          direction={{ base: "column", sm: "row" }}
          gap={{ base: "sm", sm: 4 }}
        >
          <Stack gap={4}>
            <Title order={3}>Hair</Title>
            {/*<Text></Text>*/}
          </Stack>
          <Flex align="center" gap="sm">
            <HairFilterDrawer
              filters={searchParams}
              label={label}
              onSelected={(data) =>
                router.push(`/dashboard/hair${createQueryString(data)}`)
              }
            />
            <Button
              onClick={() => {
                openConfirmModal();
              }}
            >
              New
            </Button>
          </Flex>
        </Flex>
      </Surface>
      <Divider />
      <Grid gutter={{ base: 5, xs: "md", md: "lg" }}>
        <GridCol span={12}>
          <Suspense fallback={<LoaderSkeleton />}>
            <ErrorBoundary fallback={<p>Error</p>}>
              <HairsSuspense searchParams={searchParams} />
            </ErrorBoundary>
          </Suspense>
        </GridCol>
      </Grid>
    </Stack>
  );
};

function HairsSuspense({ searchParams }: Props) {
  const [hair] = trpc.hair.getAll.useSuspenseQuery({ ...searchParams });

  return (
    <>
      <Stack gap="lg">
        <Paper withBorder p="md" radius="md" shadow="sm">
          {hair.length > 0 ? (
            <HairTable hair={hair} />
          ) : (
            <Text c="gray">No hair found for this week.</Text>
          )}
        </Paper>
      </Stack>
    </>
  );
}
