"use client";

import PopupForm from "@/components/popup-form";
import { useParams } from "next/navigation";

export default function EditPopupPage() {
  const params = useParams();
  const popupId = params?.id as string;
  
  return <PopupForm popupId={popupId} />;
} 