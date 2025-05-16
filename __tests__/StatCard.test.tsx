import { StatCard } from "@/modules/ui/components/stat-card";
import { describe, expect, it } from "vitest";
import { render, screen } from "./test-utils";

describe("StatCard", () => {
	it("renders the title, value, and icon correctly", () => {
		render(<StatCard title="Revenue" value="5000" icon="mdi:cash" />);

		const titleElement = screen.getByTestId("title");
		const valueElement = screen.getByTestId("value");
		const iconElement = screen.getByTestId("icon");

		expect(titleElement.textContent).toBe("Revenue");
		expect(valueElement.textContent).toBe("5000");
		expect(iconElement.textContent).toBe("mdi:cash");
	});
});
