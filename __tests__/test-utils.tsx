import { MantineProvider } from "@mantine/core";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

vi.mock("@iconify/react", () => {
	return {
		Icon: ({ icon }: { icon: string }) => <span>{icon}</span>,
	};
});

const customRender = (ui: ReactNode, options = {}) => {
	return render(
		<MantineProvider defaultColorScheme={"light"}>{ui}</MantineProvider>,
		options,
	);
};

export * from "@testing-library/react";
export { customRender as render };
