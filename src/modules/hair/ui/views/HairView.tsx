"use client";

import {
  ActionIcon,
  Button,
  CopyButton,
  Divider,
  Flex,
  Grid,
  GridCol,
  Group,
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
import { ReusableTextDrawer } from "@/modules/ui/components/text-input-drawer";
import { z } from "zod";
import { notifications } from "@mantine/notifications";
import { ReusableNumberDrawer } from "@/modules/ui/components/number-input-drawer";

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
  const utils = trpc.useUtils();
  const [hair] = trpc.hair.getById.useSuspenseQuery({ hairId });

  const updateHairMutation = trpc.hair.update.useMutation({
    onSuccess: () => {
      utils.hair.getById.invalidate({ hairId });
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Hair updated.",
      });
    },
    onError: (e) => {
      console.log({ e });
      notifications.show({
        color: "red",
        title: "Error!",
        message: "Failed to update Hair.",
      });
    },
  });

  const updateHair = (data: {
    length?: number;
    description?: string;
    color?: string;
  }) => updateHairMutation.mutate({ hair: { id: hairId, ...data } });

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
                    <Flex direction="column">
                      <Text c="dimmed" size="xs">
                        Color:
                      </Text>
                      <Flex direction="row" justify="space-between">
                        <Text size="sm">{hair.color}</Text>
                        <ReusableTextDrawer
                          title={"Update Color"}
                          initialValues={{ color: hair.color }}
                          schema={z.object({ color: z.string() })}
                          onSubmit={(data) => {
                            updateHair(data);
                          }}
                        />
                      </Flex>
                    </Flex>
                  </Flex>
                  <Flex direction="column">
                    <Flex direction="column">
                      <Text c="dimmed" size="xs">
                        Description:
                      </Text>
                      <Flex direction="row" justify="space-between">
                        <Text size="sm">{hair.description}</Text>
                        <ReusableTextDrawer
                          title={"Update Description"}
                          initialValues={{ description: hair.description }}
                          schema={z.object({ description: z.string() })}
                          onSubmit={(data) => {
                            updateHair(data);
                          }}
                        />
                      </Flex>
                    </Flex>
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
                  {!hair.upc.startsWith("p+") && (
                    <Flex direction="column">
                      <Text c="dimmed" size="xs">
                        Received Weight:
                      </Text>
                      <Text size="sm" w={500}>
                        {hair.weightReceived} g
                      </Text>
                    </Flex>
                  )}
                  <Flex direction="column">
                    <Text c="dimmed" size="xs">
                      Weight in Stock:
                    </Text>
                    <Text size="sm" w={500}>
                      {hair.weight} g
                    </Text>
                  </Flex>
                  <Flex direction="column">
                    <Flex direction="column">
                      <Text c="dimmed" size="xs">
                        Length:
                      </Text>
                      <Flex direction="row" justify="space-between">
                        <Text size="sm">{hair.length} cm</Text>
                        <ReusableNumberDrawer
                          title={"Update Length"}
                          initialValues={{ length: hair.length }}
                          schema={z.object({ length: z.number().positive() })}
                          onSubmit={(data) => {
                            updateHair(data);
                          }}
                        />
                      </Flex>
                    </Flex>
                  </Flex>
                  {hair.hairOrderId && (
                    <Flex direction="column">
                      <Text c="dimmed" size="xs">
                        Order:
                      </Text>
                      <Text size="sm" w={500}>
                        {hair.hairOrderId}
                      </Text>
                    </Flex>
                  )}
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
