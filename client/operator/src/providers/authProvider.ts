import type { AuthProvider } from "react-admin";

const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const response = await fetch(
      import.meta.env.VITE_REST_SERVER_URL + "/login",
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
        headers: { "Content-Type": "application/json" },
      }
    );
    if (response.status < 200 || response.status >= 300) {
      throw new Error("Login failed");
    }
    const { token } = await response.json();
    localStorage.setItem("authToken", token);
  },

  logout: () => {
    localStorage.removeItem("authToken");
    return Promise.resolve();
  },

  checkAuth: () => {
    return localStorage.getItem("authToken")
      ? Promise.resolve()
      : Promise.reject();
  },

  checkError: (error) => {
    if (error.status === 401 || error.status === 403) {
      localStorage.removeItem("authToken");
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getPermissions: () => {
    // Example: you can decode token here and return permissions
    return Promise.resolve();
  },
};

export default authProvider;
