import { create } from "zustand";

import axiosInstance from "../lib/axios-instance";

import { AxiosError } from "axios";
import { envConf } from "~/lib/envConf";

interface IUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
}
interface AuthState {
  isAuthenticated: boolean;
  error: string;
  setError: (val: string) => void;
  user: IUser | null;
  setUser: (val: IUser) => void;
  loadingUser: boolean;
  setIsAuthenticated: (val: boolean) => void;
  login: ({ authProvider }: { authProvider: string }) => void;
  logout: () => void;
  fetchProfile: () => void;
}

const useUserStore = create<AuthState>((set) => ({
  loadingUser: false,
  isAuthenticated: false,
  user: null,
  error: "",
  setError: (val) => {
    set({ error: val });
  },
  setIsAuthenticated: (val) => {
    set({ isAuthenticated: val });
  },
  setUser: (user) => {
    set({ user });
  },
  /**
   * This function is used to login in database
   * @param authProvider - github
   */
  login: async ({ authProvider }: { authProvider: string }) => {
    set({ loadingUser: true });

    try {
      // Popup dimensions
      const width = 500;
      const height = 600;

      // Calculate center position
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        `${envConf.VITE_API_URL}/api/v1/auth/${authProvider}`,
        "oauth",
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no`
      );

      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          set({ loadingUser: false });
          window.location.reload();
        }
      }, 1000);
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message || "Login failed";
      } else {
      }
    } finally {
      set({ loadingUser: false });
    }
  },
  async logout() {
    try {
      const { data: result } = await axiosInstance("/auth/logout");

      if (result.success) {
        // console.log(result);
        set({ isAuthenticated: false, error: "Not Auth", user: null });
      }
    } catch (error) {}
  },
  async fetchProfile() {
    set({ loadingUser: true });
    try {
      const { data: result } = await axiosInstance("/auth/profile");
      if (result.success) {
        set({ loadingUser: true, isAuthenticated: true, user: result.data });
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        set({ error: error.response?.data.message });
      } else
        ({
          error: "Not able to sync with server",
        });
    } finally {
      set({ loadingUser: true });
    }
  },
}));

export { useUserStore };
