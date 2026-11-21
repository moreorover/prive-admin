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
    ink: "#202522",
    canvas: "#f4f5f2",
    surface: "#ffffff",
    accent: "#486b62",
    accentStrong: "#2f5149",
    champagne: "#486b62",
    obsidian: "#202522",
    bone: "#f4f5f2",
    boneWarm: "#ffffff",
    mulberry: "#b24a4a",
    ledger: "#2f7659",
    mist: "#dce2dd",
  },
  light: {
    pageGlowPrimary: "transparent",
    pageGlowSecondary: "transparent",
    ledgerLineX: "rgba(32, 37, 34, 0.035)",
    ledgerLineY: "rgba(32, 37, 34, 0.025)",
    surface: "#ffffff",
    surfaceStrong: "#eef1ed",
    surfaceMuted: "#f8f9f7",
    surfaceRaised: "#ffffff",
    surfaceShadow: "rgba(32, 37, 34, 0.1)",
    buttonShadow: "transparent",
    controlBg: "#ffffff",
    controlBgHover: "#f8f9f7",
    border: "#dce2dd",
    borderStrong: "#c5cec7",
    focus: "#486b62",
    selection: "#dcefe8",
    accent: "#486b62",
    success: "#2f7659",
    successSurface: "#eaf5ef",
    warning: "#9a6818",
    warningSurface: "#fff4dd",
    danger: "#b24a4a",
    dangerSurface: "#fcedec",
    info: "#3e6e9b",
    infoSurface: "#eaf2fa",
    body: "#f4f5f2",
    text: "#202522",
    dimmed: "#66706a",
  },
  dark: {
    pageGlowPrimary: "transparent",
    pageGlowSecondary: "transparent",
    ledgerLineX: "rgba(242, 245, 241, 0.035)",
    ledgerLineY: "rgba(242, 245, 241, 0.025)",
    surface: "#202722",
    surfaceStrong: "#2c3730",
    surfaceMuted: "#252e28",
    surfaceRaised: "#202722",
    surfaceShadow: "rgba(0, 0, 0, 0.32)",
    buttonShadow: "transparent",
    controlBg: "#202722",
    controlBgHover: "#2c3730",
    border: "#3b473f",
    borderStrong: "#536158",
    focus: "#9cc6b8",
    selection: "#315047",
    accent: "#9cc6b8",
    success: "#8ed0ae",
    successSurface: "#1e3529",
    warning: "#f0bf68",
    warningSurface: "#3d301b",
    danger: "#f09a98",
    dangerSurface: "#3e2425",
    info: "#9bc5eb",
    infoSurface: "#213344",
    body: "#171c19",
    text: "#f2f5f1",
    dimmed: "#b5c0b9",
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
      "#f1f7f4",
      "#dcefe8",
      "#c4dfd4",
      "#a9cfc0",
      "#8fbfaf",
      "#72a292",
      "#5b8b7d",
      "#486b62",
      "#385950",
      "#2f5149",
    ],
    lacquer: [
      "#f8f9f7",
      "#eef1ed",
      "#dce2dd",
      "#c5cec7",
      "#aab6ae",
      "#8b948f",
      "#66706a",
      "#4e5a53",
      "#354039",
      "#202522",
    ],
    mulberry: [
      "#fcedec",
      "#f7d8d7",
      "#f0bdbc",
      "#e5a09f",
      "#d58180",
      "#c46363",
      "#b24a4a",
      "#963c3c",
      "#783434",
      "#5e2b2b",
    ],
    ledger: [
      "#eaf5ef",
      "#d3ebdc",
      "#b5ddc4",
      "#96cfaa",
      "#75bd91",
      "#55a978",
      "#2f7659",
      "#286049",
      "#214d3b",
      "#1e3529",
    ],
  },
  white: "#ffffff",
  black: "#202522",
  radius: {
    xs: "0.25rem",
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
  },
  spacing: {
    xxs: "0.25rem",
    xs: "0.5rem",
    sm: "0.75rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
    "3xl": "4.5rem",
  },
  fontSizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "0.9375rem",
    lg: "1.0625rem",
    xl: "1.25rem",
  },
  shadows: {
    xs: "0 1px 2px color-mix(in srgb, var(--mantine-color-black) 8%, transparent)",
    sm: "0 4px 14px color-mix(in srgb, var(--mantine-color-black) 8%, transparent)",
    md: "0 12px 28px color-mix(in srgb, var(--mantine-color-black) 10%, transparent)",
    lg: "0 20px 48px color-mix(in srgb, var(--mantine-color-black) 12%, transparent)",
    xl: "0 28px 64px color-mix(in srgb, var(--mantine-color-black) 14%, transparent)",
  },
  headings: {
    fontFamily: '"Fraunces", "Iowan Old Style", serif',
    fontWeight: "520",
    textWrap: "balance",
    sizes: {
      h1: { fontSize: "clamp(2.25rem, 4vw, 4rem)", lineHeight: "1.02" },
      h2: { fontSize: "clamp(1.75rem, 3vw, 2.5rem)", lineHeight: "1.08" },
      h3: { fontSize: "1.5rem", lineHeight: "1.2" },
      h4: { fontSize: "1.25rem", lineHeight: "1.2" },
    },
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
        radius: "xl",
        tt: "none",
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
        radius: "lg",
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
        shadow: "sm",
        transitionProps: { transition: "fade", duration: 180 },
      },
    }),
    Modal: Modal.extend({
      defaultProps: {
        centered: true,
        radius: "lg",
        overlayProps: {
          backgroundOpacity: 0.42,
          blur: 4,
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
        radius: "lg",
        shadow: "xs",
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
        verticalSpacing: "sm",
      },
    }),
    Tabs: Tabs.extend({
      defaultProps: {
        radius: "sm",
      },
    }),
    Textarea: Textarea.extend({
      defaultProps: {
        radius: "md",
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
