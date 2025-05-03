"use client";

import { useAdminSession } from "@/lib/admin-auth";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminStatusClient({ serverAdminStatus }: { serverAdminStatus: boolean }) {
  const { adminUser, loading } = useAdminSession();
  const [clientStatus, setClientStatus] = useState<boolean>(false);

  useEffect(() => {
    // Update client status when admin session changes
    if (!loading) {
      setClientStatus(!!adminUser);
    }
  }, [adminUser, loading]);

  // If either client or server says the user is admin, show admin controls
  const isAdmin = serverAdminStatus || clientStatus;

  return (
    <>
      <div className="text-xs text-gray-500 mb-2">
        Admin status: {isAdmin ? 'Yes' : 'No'} 
        {loading && ' (loading...)'}
      </div>
      
      {/* We'll render only the status indicator here, the button will be rendered by the parent component */}
      {/* where it can be properly positioned */}
      <div className="hidden">isAdmin={isAdmin.toString()}</div>
    </>
  );
} 