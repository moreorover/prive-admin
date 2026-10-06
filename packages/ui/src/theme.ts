import {
  ActionIcon,
  Badge,
  Button,
  Card,
  type CSSVariablesResolver,
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

const priveTokens = {
  shared: {
    obsidian: "#11100e",
    bone: "#f4efe6",
    boneWarm: "#fffcf6",
    champagne: "#b58b43",
    mulberry: "#442338",
    ledger: "#51665b",
    mist: "#d8d2c8",
  },
  light: {
    pageGlowPrimary: "rgba(255, 249, 236, 0.95)",
    pageGlowSecondary: "rgba(68, 35, 56, 0.12)",
    ledgerLineX: "rgba(91, 73, 49, 0.055)",
    ledgerLineY: "rgba(91, 73, 49, 0.045)",
    surface: "rgba(255, 252, 246, 0.9)",
    surfaceStrong: "rgba(255, 252, 246, 0.96)",
    surfaceMuted: "rgba(255, 252, 246, 0.72)",
    surfaceRaised: "rgba(255, 252, 246, 0.94)",
    surfaceShadow: "rgba(74, 55, 24, 0.1)",
    buttonShadow: "rgba(111, 77, 24, 0.16)",
    controlBg: "rgba(255, 252, 246, 0.76)",
    controlBgHover: "rgba(255, 252, 246, 0.96)",
    border: "rgba(91, 73, 49, 0.16)",
    borderStrong: "rgba(91, 73, 49, 0.28)",
    focus: "rgba(181, 139, 67, 0.38)",
    selection: "rgba(181, 139, 67, 0.24)",
    body: "#f4efe6",
    text: "#211c16",
    dimmed: "#786b5b",
  },
  dark: {
    pageGlowPrimary: "rgba(181, 139, 67, 0.1)",
    pageGlowSecondary: "rgba(68, 35, 56, 0.34)",
    ledgerLineX: "rgba(244, 239, 230, 0.035)",
    ledgerLineY: "rgba(244, 239, 230, 0.026)",
    surface: "rgba(31, 28, 25, 0.94)",
    surfaceStrong: "rgba(39, 35, 31, 0.98)",
    surfaceMuted: "rgba(42, 37, 32, 0.86)",
    surfaceRaised: "rgba(28, 25, 22, 0.98)",
    surfaceShadow: "rgba(0, 0, 0, 0.42)",
    buttonShadow: "rgba(0, 0, 0, 0.3)",
    controlBg: "rgba(39, 35, 31, 0.92)",
    controlBgHover: "rgba(54, 48, 42, 0.98)",
    border: "rgba(244, 239, 230, 0.16)",
    borderStrong: "rgba(244, 239, 230, 0.28)",
    focus: "rgba(216, 183, 117, 0.44)",
    selection: "rgba(181, 139, 67, 0.34)",
    body: "#11100e",
    text: "#f8efe3",
    dimmed: "#bfb4a6",
  },
} as const

export const theme = createTheme({
  primaryColor: "champagne",
  primaryShade: { light: 6, dark: 4 },
  defaultRadius: "md",
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
    xs: "0.25rem",
    sm: "0.375rem",
    md: "0.625rem",
    lg: "0.875rem",
    xl: "1.125rem",
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
  other: {
    prive: priveTokens,
  },
  components: {
    ActionIcon: ActionIcon.extend({
      defaultProps: {
        radius: "md",
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
        radius: "md",
        fw: 700,
      },
    }),
    Card: Card.extend({
      defaultProps: {
        withBorder: true,
        radius: "md",
        padding: "lg",
        shadow: "xs",
      },
    }),
    Divider: Divider.extend({
      defaultProps: {
        color: "var(--prive-border)",
      },
    }),
    Menu: Menu.extend({
      defaultProps: {
        radius: "md",
        shadow: "lg",
        transitionProps: { transition: "pop-top-right", duration: 140 },
      },
    }),
    Modal: Modal.extend({
      defaultProps: {
        centered: true,
        radius: "lg",
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
        radius: "md",
      },
    }),
    Paper: Paper.extend({
      defaultProps: {
        radius: "md",
        shadow: "sm",
      },
    }),
    PasswordInput: PasswordInput.extend({
      defaultProps: {
        radius: "md",
        size: "md",
      },
    }),
    Select: Select.extend({
      defaultProps: {
        radius: "md",
        size: "md",
      },
    }),
    Table: Table.extend({
      defaultProps: {
        highlightOnHover: true,
        horizontalSpacing: "md",
        verticalSpacing: "xs",
      },
    }),
    Tabs: Tabs.extend({
      defaultProps: {
        radius: "sm",
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
        radius: "md",
        size: "md",
      },
    }),
  },
})

export const cssVariablesResolver: CSSVariablesResolver = (mantineTheme) => {
  const tokens = mantineTheme.other.prive as typeof priveTokens
  const sharedVariables = Object.fromEntries(
    Object.entries(tokens.shared).map(([name, value]) => [
      `--prive-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
      value,
    ]),
  )
  const colorSchemeVariables = (scheme: "light" | "dark") => {
    const schemeTokens = tokens[scheme]
    return Object.fromEntries(
      Object.entries(schemeTokens).map(([name, value]) => [
        `--prive-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
        value,
      ]),
    )
  }

  return {
    variables: sharedVariables,
    light: {
      ...colorSchemeVariables("light"),
      "--prive-surface-alpha": "color-mix(in srgb, var(--mantine-color-body) 88%, transparent)",
      "--mantine-color-body": tokens.light.body,
      "--mantine-color-text": tokens.light.text,
      "--mantine-color-dimmed": tokens.light.dimmed,
    },
    dark: {
      ...colorSchemeVariables("dark"),
      "--prive-surface-alpha": "color-mix(in srgb, var(--mantine-color-body) 88%, transparent)",
      "--mantine-color-body": tokens.dark.body,
      "--mantine-color-text": tokens.dark.text,
      "--mantine-color-dimmed": tokens.dark.dimmed,
    },
  }
}
