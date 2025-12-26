"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ETicket from "../../../components/ETicket";
import { Loader2 } from "lucide-react";

interface TicketData {
  id: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  checkInType: string;
  orderId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  registrationId: string;
}

export default function TicketPage() {
  const params = useParams();
  const eventId = params?.eventId as string;
  const ticketId = params?.ticketId as string;

  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/events/${eventId}/ticket/${ticketId}/`
        );

        if (response.ok) {
          const data = await response.json();
          setTicketData(data);
        } else {
          throw new Error("Ticket not found");
        }
      } catch {
        setTicketData({
          id: ticketId,
          eventName: "HackTitan 2025",
          eventDate: "February 14, 2025",
          eventTime: "10:00 AM",
          venue: "SRMIST KTR Campus, Tech Park Block",
          checkInType: "General Entry",
          orderId: `TIT${ticketId.substring(0, 8).toUpperCase()}`,
          userName: "Demo User",
          userEmail: "demo@titanium2025.com",
          userPhone: "9876543210",
          registrationId: `REG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        });
      } finally {
        setLoading(false);
      }
    };

    if (eventId && ticketId) {
      fetchTicket();
    }
  }, [eventId, ticketId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-titanium-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-titanium-silver animate-spin mx-auto mb-4" />
          <p className="text-titanium-metallic font-mono">Loading your ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticketData) {
    return (
      <div className="min-h-screen bg-titanium-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-titanium-white font-mono text-xl mb-2">
            Ticket Not Found
          </p>
          <p className="text-titanium-metallic">
            The ticket you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  return <ETicket ticketData={ticketData} />;
}
