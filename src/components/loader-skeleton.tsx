import { Center, Loader } from "@mantine/core";

export const LoaderSkeleton = () => {
	return (
		<>
			<Center>
				<Loader color="blue" type="dots" />
			</Center>
		</>
	);
};
