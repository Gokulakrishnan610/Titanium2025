"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params?.eventId as string;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      window.location.href = "/events";
    }
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-titanium-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-titanium-silver animate-spin" />
      </div>
    );
  }

  return null;
}
