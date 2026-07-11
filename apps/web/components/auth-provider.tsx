"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  login as loginThunk,
  signup as signupThunk,
  googleLogin as googleLoginThunk,
  codeLogin as codeLoginThunk,
  logout as logoutThunk,
  loadUser,
} from "@/lib/store/auth-slice";

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, status, error } = useAppSelector((s) => s.auth);

  const login = useCallback(
    async (email: string, password: string, redirectTo?: string) => {
      const result = await dispatch(loginThunk({ email, password }));
      if (loginThunk.fulfilled.match(result)) {
        router.push(redirectTo || "/app");
      } else {
        throw new Error(result.error.message ?? "Login failed");
      }
    },
    [dispatch, router]
  );

  const signup = useCallback(
    async (
      data: {
        email: string;
        password: string;
        first_name?: string;
        last_name?: string;
      },
      redirectTo?: string
    ) => {
      const result = await dispatch(signupThunk(data));
      if (signupThunk.fulfilled.match(result)) {
        router.push(redirectTo || "/app");
      } else {
        throw new Error(result.error.message ?? "Signup failed");
      }
    },
    [dispatch, router]
  );

  const googleLogin = useCallback(
    async (idToken: string, redirectTo?: string) => {
      const result = await dispatch(googleLoginThunk(idToken));
      if (googleLoginThunk.fulfilled.match(result)) {
        router.push(redirectTo || "/app");
      } else {
        throw new Error(result.error.message ?? "Google login failed");
      }
    },
    [dispatch, router]
  );

  const codeLogin = useCallback(
    async (email: string, code: string, redirectTo?: string) => {
      const result = await dispatch(codeLoginThunk({ email, code }));
      if (codeLoginThunk.fulfilled.match(result)) {
        router.push(redirectTo || "/app");
      } else {
        throw new Error(result.error.message ?? "Code verification failed");
      }
    },
    [dispatch, router]
  );

  const logoutFn = useCallback(async () => {
    await dispatch(logoutThunk());
    router.push("/login");
  }, [dispatch, router]);

  const refreshUser = useCallback(async () => {
    await dispatch(loadUser());
  }, [dispatch]);

  const resolvedStatus =
    status === "idle" || status === "loading" ? "loading" : status;

  return {
    user,
    status: resolvedStatus as "loading" | "authenticated" | "unauthenticated",
    error,
    login,
    signup,
    googleLogin,
    codeLogin,
    logout: logoutFn,
    refreshUser,
  };
}
