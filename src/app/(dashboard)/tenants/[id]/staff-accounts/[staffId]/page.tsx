"use client";

import { use } from "react";
import StaffAccountFormPage from "../staff-account-form-page";

export default function EditStaffAccountPage({
  params,
}: {
  params: Promise<{ id: string; staffId: string }>;
}) {
  const { id, staffId } = use(params);

  return <StaffAccountFormPage outletId={id} staffId={staffId} />;
}
