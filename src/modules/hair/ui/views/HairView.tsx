"use client";

import {
  ActionIcon,
  CopyButton,
  Divider,
  Flex,
  Grid,
  GridCol,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { trpc } from "@/trpc/client";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import Surface from "@/modules/ui/components/surface";
import { Check, Copy } from "lucide-react";

dayjs.extend(isoWeek);

interface Props {
  hairId: string;
}

export const HairView = ({ hairId }: Props) => {
  return (
    <Suspense fallback={<LoaderSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <HairSuspense hairId={hairId} />
      </ErrorBoundary>
    </Suspense>
  );
};

function HairSuspense({ hairId }: Props) {
  const [hair] = trpc.hair.getById.useSuspenseQuery({ hairId });

  return (
    <>
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
        <Grid>
          <GridCol span={{ base: 12, lg: 3 }}>
            <Stack gap="lg">
              <Paper withBorder p="md" radius="md" shadow="sm">
                <Stack gap="sm">
                  <Flex direction="column">
                    <Text c="dimmed" size="xs">
                      Color:
                    </Text>
                    <Text size="sm" w={500}>
                      {hair.color}
                    </Text>
                  </Flex>
                  <Flex direction="column">
                    <Text c="dimmed" size="xs">
                      Description:
                    </Text>
                    <Text size="sm" w={500}>
                      {hair.description}
                    </Text>
                  </Flex>
                  <Flex direction="column">
                    <Text c="dimmed" size="xs">
                      UPC:
                    </Text>
                    <Flex>
                      <Text size="sm" w={500}>
                        {hair.upc}
                      </Text>
                      <CopyButton value={hair.upc} timeout={2000}>
                        {({ copied, copy }) => (
                          <Tooltip
                            label={copied ? "Copied" : "Copy"}
                            withArrow
                            position="right"
                          >
                            <ActionIcon
                              color={copied ? "teal" : "gray"}
                              variant="subtle"
                              onClick={copy}
                            >
                              {copied ? (
                                <Check size={16} />
                              ) : (
                                <Copy size={16} />
                              )}
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </CopyButton>
                    </Flex>
                  </Flex>
                  <Flex direction="column">
                    <Text c="dimmed" size="xs">
                      Weight:
                    </Text>
                    <Text size="sm" w={500}>
                      {hair.weight} g
                    </Text>
                  </Flex>
                  <Flex direction="column">
                    <Text c="dimmed" size="xs">
                      Length:
                    </Text>
                    <Text size="sm" w={500}>
                      {hair.length} cm
                    </Text>
                  </Flex>
                  <Flex direction="column">
                    <Text c="dimmed" size="xs">
                      Order:
                    </Text>
                    <Text size="sm" w={500}>
                      {hair.hairOrderId}
                    </Text>
                  </Flex>
                </Stack>
              </Paper>
            </Stack>
          </GridCol>
          <GridCol span={{ base: 12, lg: 9 }}>
            <Paper withBorder p="md" radius="md" shadow="sm">
              <Text c="gray">{hair.id}</Text>
            </Paper>
          </GridCol>
        </Grid>
      </Stack>
    </>
  );
}
