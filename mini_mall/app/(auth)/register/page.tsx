import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "注册",
};

/** 注册页 */
export default function RegisterPage() {
  return (
    <main className="flex flex-1 items-center justify-center py-16">
      <RegisterForm />
    </main>
  );
}
