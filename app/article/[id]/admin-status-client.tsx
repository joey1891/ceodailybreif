"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminStatusClient({ serverAdminStatus }: { serverAdminStatus: boolean }) {
  // 클라이언트 측 세션 확인 로직 제거, 서버에서 전달받은 상태만 사용
  const isAdmin = serverAdminStatus;

  return (
    <>
      {/* <div className="text-xs text-gray-500 mb-2">
        Admin status: {isAdmin ? 'Yes' : 'No'} 
      </div> */}
      
      {/* We'll render only the status indicator here, the button will be rendered by the parent component */}
      {/* where it can be properly positioned */}
      <div className="hidden">isAdmin={isAdmin.toString()}</div>
    </>
  );
}
