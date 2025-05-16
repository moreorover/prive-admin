import { createTheme } from "@mantine/core";

const theme = createTheme({
	breakpoints: {
		xs: "36em",
		sm: "48em",
		md: "62em",
		lg: "75em",
		xl: "88em",
	},
	colors: {
		brand: [
			"#fff8e1",
			"#ffefcb",
			"#ffdd9a",
			"#ffca64",
			"#ffba38",
			"#ffb01b",
			"#ffa903",
			"#e39500",
			"#cb8400",
			"#b07100",
		],
	},
	primaryColor: "brand",
});

export default theme;
