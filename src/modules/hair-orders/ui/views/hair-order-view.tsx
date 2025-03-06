"use client";

import {
  Button,
  Divider,
  Flex,
  Grid,
  GridCol,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import Surface from "@/modules/ui/components/surface";
import { trpc } from "@/trpc/client";

dayjs.extend(isoWeek);

interface Props {
  hairOrderId: string;
}

export const HairOrderView = ({ hairOrderId }: Props) => {
  return (
    <Stack gap="sm">
      <Surface component={Paper} style={{ backgroundColor: "transparent" }}>
        <Flex
          justify="space-between"
          direction={{ base: "column", sm: "row" }}
          gap={{ base: "sm", sm: 4 }}
        >
          <Stack gap={4}>
            <Title order={3}>Hair Order</Title>
            {/*<Text></Text>*/}
          </Stack>
          <Flex align="center" gap="sm">
            {/*<ActionIcon variant="subtle">*/}
            {/*  <RefreshCw size={16} />*/}
            {/*</ActionIcon>*/}
          </Flex>
        </Flex>
      </Surface>
      <Divider />
      <Grid gutter={{ base: 5, xs: "md", md: "lg" }}>
        <GridCol span={12}>
          <Suspense fallback={<LoaderSkeleton />}>
            <ErrorBoundary fallback={<p>Error</p>}>
              <HairOrdersSuspense hairOrderId={hairOrderId} />
            </ErrorBoundary>
          </Suspense>
        </GridCol>
      </Grid>
    </Stack>
  );
};

function HairOrdersSuspense({ hairOrderId }: Props) {
  const [hairOrder] = trpc.hairOrders.getById.useSuspenseQuery({
    id: hairOrderId,
  });
  return (
    <Grid>
      <GridCol span={{ base: 12, lg: 3 }}>
        <Stack gap="lg">
          <Paper withBorder p="md" radius="md" shadow="sm">
            <Flex direction="column">
              <Text c="dimmed" size="xs">
                Placed At:
              </Text>
              <Text size="sm" w={500}>
                {hairOrder.placedAt
                  ? dayjs(hairOrder.placedAt).format("ddd MMM YYYY")
                  : "SET"}
              </Text>
            </Flex>
            <Flex direction="column">
              <Text c="dimmed" size="xs">
                Arrived At:
              </Text>
              <Text size="sm" w={500}>
                {hairOrder.arrivedAt
                  ? dayjs(hairOrder.arrivedAt).format("ddd MMM YYYY")
                  : "SET"}
              </Text>
            </Flex>
            <Flex direction="column">
              <Text c="dimmed" size="xs">
                Created By:
              </Text>
              <Text size="sm" w={500}>
                {hairOrder.createdBy.name}
              </Text>
            </Flex>
            <Flex direction="column">
              <Text c="dimmed" size="xs">
                Total:
              </Text>
              <Text size="sm" w={500}>
                £ 500
              </Text>
            </Flex>
          </Paper>
        </Stack>
      </GridCol>
      <GridCol span={{ base: 12, lg: 9 }}>
        <Stack gap="sm">
          <Paper withBorder p="md" radius="md" shadow="sm">
            <Group justify="space-between" gap="sm">
              <Title order={4}>Notes</Title>
              <Button>New</Button>
            </Group>
            Table
          </Paper>
          <Paper withBorder p="md" radius="md" shadow="sm">
            <Group justify="space-between" gap="sm">
              <Title order={4}>Transactions</Title>
              <Button>New</Button>
            </Group>
            Table
          </Paper>
          <Paper withBorder p="md" radius="md" shadow="sm">
            <Group justify="space-between" gap="sm">
              <Title order={4}>Hair</Title>
              <Button>New</Button>
            </Group>
            Table
          </Paper>
        </Stack>
      </GridCol>
    </Grid>
  );
}
