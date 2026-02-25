import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Link from '@mui/material/Link';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import { useDispatch } from 'react-redux';
import AppTheme from './shared-theme/AppTheme.jsx';
import { YisuLogoIcon, WeChatIcon } from './components/CustomIcons.jsx';
import { setToken, setUser } from '../../store/userSlice.js';
import { useApi } from '../../hooks/useApi.js';
import entranceQr from './entrance.png';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '450px',
  },
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function SignUp(props) {
  const api = useApi();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [usernameError, setUsernameError] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [role, setRole] = React.useState('merchant');
  const [submitting, setSubmitting] = React.useState(false);
  const [miniProgramOpen, setMiniProgramOpen] = React.useState(false);

  // 用户名规则：3–20 位，仅允许字母、数字、下划线
  const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

  const validateInputs = () => {
    const usernameEl = document.getElementById('username');
    const passwordEl = document.getElementById('password');

    let isValid = true;

    const username = (usernameEl?.value || '').trim();
    if (!username) {
      setUsernameError(true);
      setUsernameErrorMessage('请输入用户名。');
      isValid = false;
    } else if (!USERNAME_REGEX.test(username)) {
      setUsernameError(true);
      setUsernameErrorMessage('用户名为 3–20 位，仅限字母、数字和下划线。');
      isValid = false;
    } else {
      setUsernameError(false);
      setUsernameErrorMessage('');
    }

    if (!passwordEl?.value || passwordEl.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('密码至少 6 位。');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateInputs()) return;

    const data = new FormData(event.currentTarget);
    const username = (data.get('username') || '').trim();
    const password = data.get('password');

    setSubmitting(true);
    setUsernameError(false);
    setUsernameErrorMessage('');
    setPasswordError(false);
    setPasswordErrorMessage('');
    try {
      const res = await api.post('/api/auth/register', { username, password, role });
      dispatch(setToken(res.data.token));
      dispatch(setUser(res.data.user));
      const me = await api.get('/api/auth/me');
      const userRole = me.data.user?.role;
      if (userRole === 'admin') navigate('/admin/audit');
      else navigate('/admin/merchant/hotel-edit');
    } catch (err) {
      const msg = err?.message || '注册失败';
      if (msg.includes('already exists') || msg.includes('已被')) {
        setUsernameError(true);
        setUsernameErrorMessage(msg);
      } else {
        setPasswordError(true);
        setPasswordErrorMessage(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignUpContainer direction="column" justifyContent="space-between">
        <Card variant="outlined">
          <YisuLogoIcon sx={{ width: 120, height: 120, display: 'block', mx: 'auto' }} />
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            注册
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <FormControl>
              <FormLabel htmlFor="username">用户名</FormLabel>
              <TextField
                autoComplete="username"
                name="username"
                required
                fullWidth
                id="username"
                placeholder="3–20 位字母、数字或下划线"
                variant="outlined"
                error={usernameError}
                helperText={usernameErrorMessage}
                color={usernameError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">密码</FormLabel>
              <TextField
                required
                fullWidth
                name="password"
                placeholder="请输入密码（至少 6 位）"
                type="password"
                id="password"
                autoComplete="new-password"
                variant="outlined"
                error={passwordError}
                helperText={passwordErrorMessage}
                color={passwordError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel id="signup-role-label">角色</FormLabel>
              <Select
                labelId="signup-role-label"
                id="role"
                value={role}
                label="角色"
                onChange={(e) => setRole(e.target.value)}
              >
                <MenuItem value="merchant">商户</MenuItem>
                <MenuItem value="admin">管理员</MenuItem>
              </Select>
            </FormControl>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              onClick={validateInputs}
              disabled={submitting}
            >
              {submitting ? '注册中…' : 'Sign up'}
            </Button>
          </Box>
          <Divider>
            <Typography sx={{ color: 'text.secondary' }}>or</Typography>
          </Divider>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setMiniProgramOpen(true)}
              startIcon={<WeChatIcon />}
            >
              进入微信小程序
            </Button>
            <Typography sx={{ textAlign: 'center' }}>
              已有账号？{' '}
              <Link
                component={RouterLink}
                to="/admin/login"
                variant="body2"
                sx={{ alignSelf: 'center' }}
              >
                登录
              </Link>
            </Typography>
          </Box>
        </Card>
        <Dialog
          open={miniProgramOpen}
          onClose={() => setMiniProgramOpen(false)}
          PaperProps={{
            sx: {
              position: 'fixed',
              right: { xs: 16, sm: 32 },
              top: '50%',
              transform: 'translateY(-50%)',
              m: 0,
              borderRadius: 3,
              p: 2,
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pb: 1,
            }}
          >
            微信小程序二维码
            <IconButton
              aria-label="close"
              onClick={() => setMiniProgramOpen(false)}
              size="small"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 1, display: 'flex', justifyContent: 'center' }}>
            <Box
              component="img"
              src={entranceQr}
              alt="微信小程序二维码"
              sx={{
                width: 200,
                height: 200,
                borderRadius: 2,
                boxShadow: 1,
              }}
            />
          </DialogContent>
        </Dialog>
      </SignUpContainer>
    </AppTheme>
  );
}
