import { Loader } from "@mantine/core";

export const LoaderSkeleton = () => {
  return (
    <>
      <Loader className="flex justify-center w-full" color="blue" type="dots" />
    </>
  );
};
