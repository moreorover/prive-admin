import { Logo } from "@/components/logo/Logo";
import {
	AppShell,
	AppShellHeader,
	AppShellMain,
	Group,
	NavLink,
	Text,
	Title,
} from "@mantine/core";
import { Activity, ChevronRight } from "lucide-react";

export default function Home() {
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
				<div className="flex justify-center mt-10">
					<Group>
						<NavLink
							href="/signin"
							label="Sign In"
							leftSection={<Activity size="1rem" />}
							rightSection={
								<ChevronRight size="0.8rem" className="mantine-rotate-rtl" />
							}
							active
						/>
					</Group>
				</div>
			</AppShellMain>
		</AppShell>
	);
}
