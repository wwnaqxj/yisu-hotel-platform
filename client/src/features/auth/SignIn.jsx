import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CssBaseline from "@mui/material/CssBaseline";
import FormControlLabel from "@mui/material/FormControlLabel";
import Divider from "@mui/material/Divider";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import Link from "@mui/material/Link";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import MuiCard from "@mui/material/Card";
import { styled } from "@mui/material/styles";
import { useDispatch } from "react-redux";
import ForgotPassword from "./components/ForgotPassword.jsx";
import AppTheme from "./shared-theme/AppTheme";
import ColorModeSelect from "./shared-theme/ColorModeSelect";
import { YisuLogoIcon, WeChatIcon } from "./components/CustomIcons";
import { setToken, setUser } from "../../store/userSlice.js";
import { useApi } from "../../hooks/useApi.js";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  [theme.breakpoints.up("sm")]: {
    maxWidth: "450px",
  },
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  ...theme.applyStyles("dark", {
    boxShadow:
      "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: "calc((1 - var(--template-frame-height, 0)) * 100dvh)",
  minHeight: "100%",
  padding: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(4),
  },
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    zIndex: -1,
    inset: 0,
    backgroundImage:
      "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
    backgroundRepeat: "no-repeat",
    ...theme.applyStyles("dark", {
      backgroundImage:
        "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
    }),
  },
}));

export default function SignIn(props) {
  const api = useApi();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [usernameError, setUsernameError] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState("");
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (usernameError || passwordError) return;
    const data = new FormData(event.currentTarget);
    const username = (data.get("username") || "").trim();
    const password = data.get("password");
    if (!username || !password) {
      setPasswordError(true);
      setPasswordErrorMessage("请输入用户名和密码。");
      return;
    }

    setSubmitting(true);
    setPasswordError(false);
    setPasswordErrorMessage("");
    try {
      const res = await api.post("/api/auth/login", { username, password });
      dispatch(setToken(res.data.token));
      dispatch(setUser(res.data.user));
      const me = await api.get("/api/auth/me");
      const role = me.data.user?.role;
      if (role === "admin") navigate("/admin/audit");
      else navigate("/admin/merchant/hotel-edit");
    } catch (err) {
      const msg = err?.message || "登录失败";
      setPasswordError(true);
      setPasswordErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // 用户名规则：3–20 位，仅允许字母、数字、下划线
  const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

  const validateInputs = () => {
    const usernameEl = document.getElementById("username");
    const password = document.getElementById("password");

    let isValid = true;

    const username = (usernameEl?.value || "").trim();
    if (!username) {
      setUsernameError(true);
      setUsernameErrorMessage("请输入用户名。");
      isValid = false;
    } else if (!USERNAME_REGEX.test(username)) {
      setUsernameError(true);
      setUsernameErrorMessage("用户名为 3–20 位，仅限字母、数字和下划线。");
      isValid = false;
    } else {
      setUsernameError(false);
      setUsernameErrorMessage("");
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage("密码至少 6 位。");
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage("");
    }

    return isValid;
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" justifyContent="space-between">
        <ColorModeSelect
          sx={{ position: "fixed", top: "1rem", right: "1rem" }}
        />
        <Card variant="outlined">
          <YisuLogoIcon sx={{ width: 120, height: 120, display: 'block', mx: 'auto' }} />
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
          >
            登录
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: 2,
            }}
          >
            <FormControl>
              <FormLabel htmlFor="username">用户名</FormLabel>
              <TextField
                error={usernameError}
                helperText={usernameErrorMessage}
                id="username"
                type="text"
                name="username"
                placeholder="请输入用户名"
                autoComplete="username"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={usernameError ? "error" : "primary"}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">密码</FormLabel>
              <TextField
                error={passwordError}
                helperText={passwordErrorMessage}
                name="password"
                placeholder="请输入密码"
                type="password"
                id="password"
                autoComplete="current-password"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={passwordError ? "error" : "primary"}
              />
            </FormControl>
            {/* <FormControlLabel
              control={<Checkbox value="remember" color="primary" />} 
              label="记住我"  
            /> */}
            <ForgotPassword open={open} handleClose={handleClose} />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              onClick={validateInputs}
              disabled={submitting}
            >
              {submitting ? "登录中…" : "Sign in"}
            </Button>
            {/* <Link
              component="button"
              type="button"
              onClick={handleClickOpen}
              variant="body2"
              sx={{ alignSelf: "center" }}
            >
              忘记密码?
            </Link> */}
          </Box>
          <Divider>or</Divider>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => alert("Sign in with Wechat")}
              startIcon={<WeChatIcon />}
            >
              通过微信登录
            </Button>

            <Typography sx={{ textAlign: "center" }}>
              没有账号？{" "}
              <Link
                component={RouterLink}
                to="/admin/register"
                variant="body2"
                sx={{ alignSelf: "center" }}
              >
                注册
              </Link>
            </Typography>
          </Box>
        </Card>
      </SignInContainer>
    </AppTheme>
  );
}
