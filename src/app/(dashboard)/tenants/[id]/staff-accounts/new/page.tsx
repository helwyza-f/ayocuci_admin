"use client";

import { use } from "react";
import StaffAccountFormPage from "../staff-account-form-page";

export default function NewStaffAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <StaffAccountFormPage outletId={id} />;
}
