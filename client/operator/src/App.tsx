import { Admin, Resource, ListGuesser } from "react-admin";
import authProvider from "./providers/authProvider";
import dataProvider from "./providers/dataProvider";

const App = () => (
  <Admin authProvider={authProvider} dataProvider={dataProvider}>
    <Resource name="posts" list={ListGuesser} />
  </Admin>
);

export default App;
