import SignInForm from "@/components/auth/SignInForm";
import AuthRedirect from "@/components/auth/AuthRedirect";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | ShopTrack Admin",
  description: "Sign in to your ShopTrack Admin account",
};

export default function SignIn() {
  return (
    <AuthRedirect redirectAuthenticatedTo="role-based">
      <SignInForm />
    </AuthRedirect>
  );
}
