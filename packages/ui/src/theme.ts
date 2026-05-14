import { Card, createTheme } from "@mantine/core"

export const theme = createTheme({
  defaultRadius: "md",
  cursorType: "pointer",
  headings: {
    fontWeight: "600",
  },
  components: {
    Card: Card.extend({
      defaultProps: {
        withBorder: true,
        radius: "md",
        padding: "lg",
        shadow: "none",
      },
    }),
  },
})
