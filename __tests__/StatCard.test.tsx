import { StatCard } from "@/modules/ui/components/stat-card";
import { describe, expect, it } from "vitest";
import { render, screen } from "./test-utils";

describe("StatCard", () => {
	it("renders the title and value", () => {
		render(<StatCard title="Revenue" value="5000" icon="mdi:cash" />);

		const titleElement = screen.queryByText("Revenue");
		const valueElement = screen.queryByText("5000");

		expect(titleElement).not.toBeNull();
		expect(valueElement).not.toBeNull();
	});

	it("renders the icon", () => {
		render(<StatCard title="Users" value="150" icon="mdi:account" />);

		const iconElement = screen.queryByText("mdi:account");
		expect(iconElement).not.toBeNull();
	});

	it("applies the correct classes", () => {
		render(<StatCard title="Test" value="999" icon="mdi:check" />);

		const titleElement = screen.queryByText("Test");
		const valueElement = screen.queryByText("999");

		expect(titleElement?.classList.contains("title")).toBe(true);
		expect(valueElement?.classList.contains("value")).toBe(true);
	});
});
