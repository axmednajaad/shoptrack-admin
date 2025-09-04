import TenantSetupForm from "@/components/auth/TenantSetupForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup Business | ShopTrack Admin",
  description: "Setup your business information to get started with ShopTrack",
};

export default function SetupTenant() {
  return <TenantSetupForm />;
}
