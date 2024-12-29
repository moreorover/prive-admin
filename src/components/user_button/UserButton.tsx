import {
  Avatar,
  Flex,
  Text,
  UnstyledButton,
  type UnstyledButtonProps,
} from "@mantine/core";
import classes from "./UserButton.module.css";

interface UserButtonProps extends UnstyledButtonProps {
  name: string;
  email: string;
}

export function UserButton({ name, email }: UserButtonProps) {
  return (
    <UnstyledButton className={classes.user}>
      <Flex direction="row" gap={8}>
        <Avatar radius="xl" />

        <div style={{ flex: 1 }}>
          <Text size="sm" w={500}>
            {name}
          </Text>

          <Text c="dimmed" size="xs">
            {email}
          </Text>
        </div>
      </Flex>
    </UnstyledButton>
  );
}
