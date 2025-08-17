import simpleRestProvider from "ra-data-simple-rest";

const dataProvider = simpleRestProvider(import.meta.env.VITE_REST_SERVER_URL);

export default dataProvider;
