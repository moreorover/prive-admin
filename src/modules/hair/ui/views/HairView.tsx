"use client";

import {
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

dayjs.extend(isoWeek);

interface Props {
  hairId: string;
}

export const HairView = ({ hairId }: Props) => {
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
          <Flex align="center" gap="sm"></Flex>
        </Flex>
      </Surface>
      <Divider />
      <Grid gutter={{ base: 5, xs: "md", md: "lg" }}>
        <GridCol span={12}>
          <Suspense fallback={<LoaderSkeleton />}>
            <ErrorBoundary fallback={<p>Error</p>}>
              <HairsSuspense hairId={hairId} />
            </ErrorBoundary>
          </Suspense>
        </GridCol>
      </Grid>
    </Stack>
  );
};

function HairsSuspense({ hairId }: Props) {
  const [hair] = trpc.hair.getById.useSuspenseQuery({ hairId });

  return (
    <>
      <Stack gap="lg">
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Text c="gray">{hair.id}</Text>
        </Paper>
      </Stack>
    </>
  );
}
