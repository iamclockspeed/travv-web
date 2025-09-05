import {
  type DataProvider,
  type CreateParams,
  type CreateResult,
  fetchUtils,
} from "react-admin";
import simpleRestProvider from "ra-data-simple-rest";

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

const uploadOperatorsDocuments = async (
  file: File
): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await httpClient(
    `${import.meta.env.VITE_REST_SERVER_URL}/operators/comdocs/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.json.ok) {
    throw new Error("File upload failed");
  }

  return response.json;
};

const dataProvider: DataProvider = {
  ...defaultDataProvider,
  async create(resource: string, params: CreateParams): Promise<CreateResult> {
    if (resource === "operators") {
      const companyDocs = await Promise.all(
        (params.data.companyDocuments || []).map(async (doc: any) => {
          if (doc.url?.rawFile instanceof File) {
            const uploaded = await uploadOperatorsDocuments(doc.url.rawFile);
            return {
              ...doc,
              url: uploaded.url,
            };
          }
          return doc;
        })
      );

      return defaultDataProvider.create(resource, {
        ...params,
        data: {
          ...params.data,
          companyDocuments: companyDocs,
        },
      });
    }

    return defaultDataProvider.create(resource, params);
  },
};

export default dataProvider;
