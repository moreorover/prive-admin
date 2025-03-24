import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  Center,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Logo } from "@/components/logo/Logo";
import { auth, signIn, signOut } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShellHeader>
        <Group className="h-full px-md">
          <Logo />
        </Group>
      </AppShellHeader>
      <AppShellMain>
        <Title className="text-center mt-20">
          Welcome to{" "}
          <Text
            inherit
            variant="gradient"
            component="span"
            gradient={{ from: "pink", to: "yellow" }}
          >
            PRIVÉ
          </Text>{" "}
          <Text
            inherit
            variant="gradient"
            component="span"
            gradient={{ from: "blue", to: "green" }}
          >
            Admin
          </Text>
        </Title>
        <Text
          className="text-center text-gray-700 dark:text-gray-300 max-w-[500px] mx-auto mt-xl"
          ta="center"
          size="lg"
          maw={580}
          mx="auto"
          mt="xl"
        >
          This is Admin portal.
        </Text>
        <Center>
          <Stack gap={"md"} justify="center">
            {/*<NavLink*/}
            {/*  href="/signin"*/}
            {/*  label="Sign In"*/}
            {/*  leftSection={<Activity size="1rem" />}*/}
            {/*  rightSection={*/}
            {/*    <ChevronRight size="0.8rem" className="mantine-rotate-rtl" />*/}
            {/*  }*/}
            {/*  active*/}
            {/*/>*/}
            <SignIn />
            <SignOut />
            {JSON.stringify(session, null, 2)}
          </Stack>
        </Center>
      </AppShellMain>
    </AppShell>
  );
}

function SignIn() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("keycloak");
      }}
    >
      <button type="submit">Signin with Keycloak</button>
    </form>
  );
}

function SignOut() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
    >
      <button type="submit">SignOut with Keycloak</button>
    </form>
  );
}
