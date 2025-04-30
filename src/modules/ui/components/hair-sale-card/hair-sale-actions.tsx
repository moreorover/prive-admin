import { Flex } from "@mantine/core";
import type { ReactNode } from "react";

export type Props = {
	children: ReactNode;
};

function HairSaleActions({ children }: Props) {
	return (
		<Flex direction="column" gap="xs">
			{children}
		</Flex>
	);
}

export default HairSaleActions;
