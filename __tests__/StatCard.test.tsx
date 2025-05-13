import { StatCard } from "@/modules/ui/components/stat-card";
import { describe, expect, it } from "vitest";
import { render, screen } from "./test-utils";

describe("StatCard", () => {
	it("renders the title and value content", () => {
		render(<StatCard title="Revenue" value="5000" icon="mdi:cash" />);

		const titleElement = screen.getByTestId("title");
		const valueElement = screen.getByTestId("value");

		expect(titleElement.textContent).toBe("Revenue");
		expect(valueElement.textContent).toBe("5000");
	});

	it("renders the icon", () => {
		render(<StatCard title="Users" value="150" icon="mdi:account" />);

		const iconElement = screen.getByTestId("icon");
		expect(iconElement).toBeDefined();
		expect(iconElement.textContent).toBe("mdi:account");
	});
});
