import { Center, Loader as MantineLoader } from "@mantine/core"

export default function Loader() {
  return (
    <Center pt="md" h="100%">
      <MantineLoader />
    </Center>
  )
}
