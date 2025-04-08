import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Dashboard from "@/components/pages/Dashboard";

const dashboardPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  console.log("session", session);
  if (!session) {
    redirect("login");
  }
  return (
    <>
      <Dashboard />
    </>
  );
};
export default dashboardPage;
