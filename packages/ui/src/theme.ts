import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Menu,
  Modal,
  NativeSelect,
  NumberInput,
  Pagination,
  Paper,
  PasswordInput,
  Select,
  Table,
  Tabs,
  TextInput,
  Textarea,
  createTheme,
} from "@mantine/core"

export const theme = createTheme({
  primaryColor: "champagne",
  primaryShade: { light: 6, dark: 4 },
  defaultRadius: "lg",
  cursorType: "pointer",
  focusRing: "auto",
  focusClassName: "prive-focus",
  activeClassName: "prive-active",
  autoContrast: true,
  luminanceThreshold: 0.46,
  fontFamily: '"Manrope", "Avenir Next", sans-serif',
  fontFamilyMonospace: '"IBM Plex Mono", "SFMono-Regular", monospace',
  colors: {
    champagne: [
      "#fbf7ee",
      "#f2e9d8",
      "#e7d2aa",
      "#d8b676",
      "#caa04d",
      "#bd913a",
      "#b58b43",
      "#8f6b2d",
      "#6e5223",
      "#4a3718",
    ],
    lacquer: [
      "#f7f5f2",
      "#ebe7df",
      "#d6ccbf",
      "#bcae9d",
      "#9f8c78",
      "#7c6958",
      "#5f5044",
      "#443832",
      "#2a2420",
      "#11100e",
    ],
    mulberry: [
      "#fbf0f7",
      "#efdae8",
      "#ddb4d0",
      "#c689b2",
      "#aa6596",
      "#884a78",
      "#6e3c61",
      "#58304e",
      "#442338",
      "#2b1725",
    ],
    ledger: [
      "#f2f5f1",
      "#e1e8de",
      "#c2d0be",
      "#9fb39a",
      "#7c9477",
      "#637b5f",
      "#51665b",
      "#3f5148",
      "#303d36",
      "#202823",
    ],
  },
  white: "#fffcf6",
  black: "#11100e",
  radius: {
    xs: "0.375rem",
    sm: "0.625rem",
    md: "0.875rem",
    lg: "1.125rem",
    xl: "1.5rem",
  },
  spacing: {
    xs: "0.5rem",
    sm: "0.75rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2.25rem",
  },
  fontSizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "0.9375rem",
    lg: "1.0625rem",
    xl: "1.25rem",
  },
  shadows: {
    xs: "0 1px 2px color-mix(in srgb, var(--mantine-color-black) 10%, transparent)",
    sm: "0 8px 20px color-mix(in srgb, var(--mantine-color-black) 8%, transparent)",
    md: "0 18px 44px color-mix(in srgb, var(--mantine-color-black) 11%, transparent)",
    lg: "0 26px 70px color-mix(in srgb, var(--mantine-color-black) 14%, transparent)",
    xl: "0 34px 90px color-mix(in srgb, var(--mantine-color-black) 18%, transparent)",
  },
  headings: {
    fontFamily: '"Fraunces", "Iowan Old Style", serif',
    fontWeight: "520",
    textWrap: "balance",
    sizes: {
      h1: { fontSize: "clamp(3rem, 7vw, 6.75rem)", lineHeight: "0.9" },
      h2: { fontSize: "clamp(2rem, 3.2vw, 3.25rem)", lineHeight: "0.98" },
      h3: { fontSize: "1.75rem", lineHeight: "1.05" },
      h4: { fontSize: "1.25rem", lineHeight: "1.15" },
    },
  },
  defaultGradient: {
    from: "champagne.4",
    to: "mulberry.5",
    deg: 135,
  },
  components: {
    ActionIcon: ActionIcon.extend({
      defaultProps: {
        radius: "xl",
        variant: "subtle",
      },
    }),
    Badge: Badge.extend({
      defaultProps: {
        radius: "sm",
        tt: "uppercase",
        fw: 700,
      },
    }),
    Button: Button.extend({
      defaultProps: {
        radius: "xl",
        fw: 700,
      },
    }),
    Card: Card.extend({
      defaultProps: {
        withBorder: true,
        radius: "xl",
        padding: "lg",
        shadow: "sm",
      },
    }),
    Divider: Divider.extend({
      defaultProps: {
        color: "var(--prive-border)",
      },
    }),
    Menu: Menu.extend({
      defaultProps: {
        radius: "lg",
        shadow: "lg",
        transitionProps: { transition: "pop-top-right", duration: 140 },
      },
    }),
    Modal: Modal.extend({
      defaultProps: {
        centered: true,
        radius: "xl",
        overlayProps: {
          backgroundOpacity: 0.36,
          blur: 8,
        },
      },
    }),
    NativeSelect: NativeSelect.extend({
      defaultProps: {
        radius: "lg",
        size: "md",
      },
    }),
    NumberInput: NumberInput.extend({
      defaultProps: {
        radius: "lg",
        size: "md",
      },
    }),
    Pagination: Pagination.extend({
      defaultProps: {
        radius: "xl",
      },
    }),
    Paper: Paper.extend({
      defaultProps: {
        radius: "xl",
        shadow: "sm",
      },
    }),
    PasswordInput: PasswordInput.extend({
      defaultProps: {
        radius: "lg",
        size: "md",
      },
    }),
    Select: Select.extend({
      defaultProps: {
        radius: "lg",
        size: "md",
      },
    }),
    Table: Table.extend({
      defaultProps: {
        highlightOnHover: true,
        horizontalSpacing: "md",
        verticalSpacing: "sm",
      },
    }),
    Tabs: Tabs.extend({
      defaultProps: {
        radius: "xl",
      },
    }),
    Textarea: Textarea.extend({
      defaultProps: {
        radius: "lg",
        size: "md",
      },
    }),
    TextInput: TextInput.extend({
      defaultProps: {
        radius: "lg",
        size: "md",
      },
    }),
  },
})
