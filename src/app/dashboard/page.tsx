import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const dashboardPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("login");
  }
  return (
    <>
      <div>this is the dashboard page</div>
    </>
  );
};
export default dashboardPage;
