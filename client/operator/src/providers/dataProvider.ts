import { type DataProvider, fetchUtils } from "react-admin";
import simpleRestProvider from "ra-data-simple-rest";

export type SupportPayload = {
  user: {
    name: string;
    email: string;
    phone: string;
  };
  category: string;
  message: string;
};

export type FeedbackPayload = {
  user: {
    name: string;
    email: string;
    phone: string;
  };
  rating: number;
  message: string;
};

const httpClient = (
  url: string,
  options: fetchUtils.Options = {}
): Promise<any> => {
  if (!options.headers) {
    options.headers = new Headers({ Accept: "application/json" });
  }
  const token = localStorage.getItem("authToken");
  if (token) {
    (options.headers as Headers).set("Authorization", `Bearer ${token}`);
  }
  return fetchUtils.fetchJson(url, options);
};

const defaultDataProvider = simpleRestProvider(
  import.meta.env.VITE_REST_SERVER_URL,
  httpClient
);

const dataProvider: DataProvider = {
  ...defaultDataProvider,

  getUserInformation: async () => {
    const url = `${import.meta.env.VITE_REST_SERVER_URL}/userInfo`;
    const response = await httpClient(url);

    if (!response.json.ok) throw new Error("Network error");
    return response.json;
  },

  changePassword: async (newPassword: string) => {
    const url = `${import.meta.env.VITE_REST_SERVER_URL}/changePassword`;
    const response = await httpClient(url, {
      method: "PUT",
      body: JSON.stringify({ newPassword }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });
    if (!response.json.ok) throw new Error("Network error");
    return response.json;
  },

  submitFeedback: async (payload: FeedbackPayload) => {
    return defaultDataProvider.create("feedback", { data: payload });
  },

  submitSupport: async (payload: SupportPayload) => {
    return defaultDataProvider.create("support", { data: payload });
  },
};

export default dataProvider;
