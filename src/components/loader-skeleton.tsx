import { Center, Loader } from "@mantine/core";

export const LoaderSkeleton = () => {
	return (
		<>
			<Center>
				<Loader color="brand" type="dots" />
			</Center>
		</>
	);
};
