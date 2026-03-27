import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9",
      light: "#bbdefb",
      dark: "#42a5f5",
      contrastText: "#0d1117",
    },
    secondary: {
      main: "#ce93d8",
      light: "#f3e5f5",
      dark: "#ab47bc",
      contrastText: "#0d1117",
    },
    error: {
      main: "#f48fb1",
      light: "#fce4ec",
      dark: "#e91e63",
      contrastText: "#0d1117",
    },
    background: {
      default: "#0d1117",
      paper: "#161b22",
    },
    text: {
      primary: "#e6edf3",
      secondary: "#8b949e",
      disabled: "#484f58",
    },
    divider: "#30363d",
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #30363d",
          backgroundImage: "none",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          borderColor: "#30363d",
        },
      },
    },
  },
});

export default theme;
