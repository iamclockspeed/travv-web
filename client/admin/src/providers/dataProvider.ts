import {
  type DataProvider,
  type CreateParams,
  type CreateResult,
  type UpdateParams,
  type UpdateResult,
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

const uploadVehiclesDocuments = async (
  file: File
): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await httpClient(
    `${import.meta.env.VITE_REST_SERVER_URL}/vehicles/docs/upload`,
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

const uploadVehiclesImages = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await httpClient(
    `${import.meta.env.VITE_REST_SERVER_URL}/vehicles/images/upload`,
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

const processCompanyDocuments = async (documents: any[]) => {
  return Promise.all(
    (documents || []).map(async (doc: any) => {
      if (doc.url?.rawFile instanceof File) {
        const uploaded = await uploadOperatorsDocuments(doc.url.rawFile);
        return { ...doc, url: uploaded.url };
      }
      return doc;
    })
  );
};

const processVehicleDocuments = async (documents: any[]) => {
  return Promise.all(
    (documents || []).map(async (doc: any) => {
      if (doc.url?.rawFile instanceof File) {
        const uploaded = await uploadVehiclesDocuments(doc.url.rawFile);
        return { ...doc, url: uploaded.url };
      }
      return doc;
    })
  );
};

const processVehicleImages = async (documents: any[]) => {
  return Promise.all(
    (documents || []).map(async (doc: any) => {
      if (doc.url?.rawFile instanceof File) {
        const uploaded = await uploadVehiclesImages(doc.url.rawFile);
        return { ...doc, url: uploaded.url };
      }
      return doc;
    })
  );
};

const dataProvider: DataProvider = {
  ...defaultDataProvider,

  async create(resource: string, params: CreateParams): Promise<CreateResult> {
    if (resource === "operators") {
      const companyDocs = await processCompanyDocuments(
        params.data.companyDocuments
      );
      return defaultDataProvider.create(resource, {
        ...params,
        data: { ...params.data, companyDocuments: companyDocs },
      });
    } else if (resource === "vehicles") {
      const vehicleDocs = await processVehicleDocuments(params.data.documents);
      const vehicleImgs = await processVehicleImages(params.data.images);
      return defaultDataProvider.create(resource, {
        ...params,
        data: { ...params.data, documents: vehicleDocs, images: vehicleImgs },
      });
    }
    return defaultDataProvider.create(resource, params);
  },

  async update(resource: string, params: UpdateParams): Promise<UpdateResult> {
    if (resource === "operators") {
      const companyDocs = await processCompanyDocuments(
        params.data.companyDocuments
      );
      return defaultDataProvider.update(resource, {
        ...params,
        data: { ...params.data, companyDocuments: companyDocs },
      });
    } else if (resource === "vehicles") {
      const vehicleDocs = await processVehicleDocuments(params.data.documents);
      const vehicleImgs = await processVehicleImages(params.data.images);
      return defaultDataProvider.update(resource, {
        ...params,
        data: { ...params.data, documents: vehicleDocs, images: vehicleImgs },
      });
    }
    return defaultDataProvider.update(resource, params);
  },

  getOperatorCounts: async () => {
    const url = `${import.meta.env.VITE_REST_SERVER_URL}/operators/count`;
    const response = await httpClient(url);
    if (!response.json.ok) throw new Error("Network error");
    return response.json;
  },
  getVehicleCounts: async () => {
    const url = `${import.meta.env.VITE_REST_SERVER_URL}/vehicles/count`;
    const response = await httpClient(url);
    if (!response.json.ok) throw new Error("Network error");
    return response.json;
  },
  getDeviceCounts: async () => {
    const url = `${import.meta.env.VITE_REST_SERVER_URL}/devices/count`;
    const response = await httpClient(url);
    if (!response.json.ok) throw new Error("Network error");
    return response.json;
  },
};

export default dataProvider;
