import type { ReactNode } from "react";
import { Layout } from "react-admin";
import CustomMenu from "./menu";
import CustomAppBar from "./app-bar";

interface CustomLayoutProps {
  children: ReactNode;
}

const CustomLayout = ({ children }: CustomLayoutProps) => (
  <Layout menu={CustomMenu} appBar={CustomAppBar}>
    {children}
  </Layout>
);

export default CustomLayout;
