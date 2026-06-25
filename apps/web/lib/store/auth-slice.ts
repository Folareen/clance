import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { api, type User } from "@/lib/api";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
};

export const loadUser = createAsyncThunk("auth/loadUser", async () => {
  return api.me();
});

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }) => {
    const { user } = await api.login({ email, password });
    return user;
  }
);

export const signup = createAsyncThunk(
  "auth/signup",
  async (data: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => {
    const { user } = await api.signup(data);
    return user;
  }
);

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (id_token: string) => {
    const { user } = await api.googleAuth(id_token);
    return user;
  }
);

export const codeLogin = createAsyncThunk(
  "auth/codeLogin",
  async ({ email, code }: { email: string; code: string }) => {
    const { user } = await api.verifyCode(email, code);
    return user;
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await api.logout();
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.status = "authenticated";
    },
    markUnauthenticated(state) {
      state.user = null;
      state.status = "unauthenticated";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(loadUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.status = "authenticated";
      })
      .addCase(loadUser.rejected, (state) => {
        state.user = null;
        state.status = "unauthenticated";
      })
      .addCase(login.pending, (state) => {
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.status = "authenticated";
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.error = action.error.message ?? "Login failed";
      })
      .addCase(signup.pending, (state) => {
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.status = "authenticated";
        state.error = null;
      })
      .addCase(signup.rejected, (state, action) => {
        state.error = action.error.message ?? "Signup failed";
      })
      .addCase(googleLogin.pending, (state) => {
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.status = "authenticated";
        state.error = null;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.error = action.error.message ?? "Google login failed";
      })
      .addCase(codeLogin.pending, (state) => {
        state.error = null;
      })
      .addCase(codeLogin.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.status = "authenticated";
        state.error = null;
      })
      .addCase(codeLogin.rejected, (state, action) => {
        state.error = action.error.message ?? "Code verification failed";
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = "unauthenticated";
        state.error = null;
      });
  },
});

export const { clearError, setUser, markUnauthenticated } = authSlice.actions;
export default authSlice.reducer;
