"use client";

import { useRef } from "react";
import QRCodeSVG from "react-qr-code";
import { motion } from "framer-motion";
import { Download, Mail, Smartphone, Printer, Calendar, MapPin, User, Hash } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ETicketProps {
  ticketData: {
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
  };
}

export default function ETicket({ ticketData }: ETicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null);

  const handleDownloadPNG = async () => {
    if (!ticketRef.current) return;

    const canvas = await html2canvas(ticketRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    const link = document.createElement("a");
    link.download = `Titanium2025-Ticket-${ticketData.orderId}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleDownloadPDF = async () => {
    if (!ticketRef.current) return;

    const canvas = await html2canvas(ticketRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`Titanium2025-Ticket-${ticketData.orderId}.pdf`);
  };

  const handleEmailTicket = async () => {
    try {
      await fetch("/api/email-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: ticketData.userEmail,
          ticketId: ticketData.id,
        }),
      });
      alert("Ticket sent to your email!");
    } catch {
      alert("Ticket will be sent shortly!");
    }
  };

  const handleAddToWallet = () => {
    alert("Wallet integration coming soon!");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-titanium-black flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <motion.svg
              className="w-12 h-12 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </motion.svg>
          </div>
          <h1 className="text-3xl font-mono font-bold text-titanium-white mb-2">
            Registration Successful!
          </h1>
          <p className="text-titanium-metallic">
            Your e-ticket has been generated
          </p>
        </motion.div>

        <motion.div
          ref={ticketRef}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none"
          id="ticket"
        >
          <div className="bg-gradient-to-r from-titanium-silver via-titanium-metallic to-titanium-silver p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-titanium-black/70 font-mono uppercase tracking-wider">
                  Your E-Ticket
                </p>
                <h2 className="text-2xl font-bold text-titanium-black mt-1">
                  Titanium 2025
                </h2>
              </div>
              <div className="w-16 h-16 bg-titanium-black rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-titanium-silver">T</span>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-titanium-black mb-4">
                {ticketData.eventName}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 font-mono uppercase mb-1">
                  Date
                </p>
                <p className="text-base font-semibold text-titanium-black flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {ticketData.eventDate}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-mono uppercase mb-1">
                  Time
                </p>
                <p className="text-base font-semibold text-titanium-black">
                  {ticketData.eventTime}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-mono uppercase mb-1">
                  Check-In Type
                </p>
                <p className="text-base font-semibold text-titanium-black">
                  {ticketData.checkInType}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-mono uppercase mb-1">
                  Order ID
                </p>
                <p className="text-base font-semibold text-titanium-black font-mono flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  {ticketData.orderId}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-xs text-gray-500 font-mono uppercase mb-1">
                  Venue
                </p>
                <p className="text-base font-semibold text-titanium-black flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {ticketData.venue}
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="border-t-2 border-dashed border-gray-300" />
              <div className="absolute -left-10 top-0 -translate-y-1/2 w-6 h-6 bg-titanium-black rounded-full" />
              <div className="absolute -right-10 top-0 -translate-y-1/2 w-6 h-6 bg-titanium-black rounded-full" />
            </div>

            <div className="flex flex-col items-center justify-center py-6">
              <div className="bg-white p-4 rounded-lg border-4 border-gray-200">
                <QRCodeSVG
                  value={JSON.stringify({
                    ticketId: ticketData.id,
                    eventName: ticketData.eventName,
                    orderId: ticketData.orderId,
                    userId: ticketData.registrationId,
                  })}
                  size={180}
                  level="H"
                />
              </div>
              <p className="text-xs text-gray-500 mt-3 font-mono">
                Scan this code at the venue for entry
              </p>
            </div>
          </div>

          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-titanium-silver rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-titanium-black" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-titanium-black">
                    {ticketData.userName}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    {ticketData.registrationId}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Valid for</p>
                <p className="text-sm font-semibold text-titanium-black">1 Person</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden"
        >
          <button
            onClick={handleDownloadPNG}
            className="flex flex-col items-center gap-2 p-4 bg-titanium-rich border border-titanium-silver/30 hover:border-titanium-silver rounded-lg text-titanium-white transition-all group"
          >
            <Download className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono">Download PNG</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex flex-col items-center gap-2 p-4 bg-titanium-rich border border-titanium-silver/30 hover:border-titanium-silver rounded-lg text-titanium-white transition-all group"
          >
            <Download className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono">Download PDF</span>
          </button>

          <button
            onClick={handleEmailTicket}
            className="flex flex-col items-center gap-2 p-4 bg-titanium-rich border border-titanium-silver/30 hover:border-titanium-silver rounded-lg text-titanium-white transition-all group"
          >
            <Mail className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono">Email Ticket</span>
          </button>

          <button
            onClick={handleAddToWallet}
            className="flex flex-col items-center gap-2 p-4 bg-titanium-rich border border-titanium-silver/30 hover:border-titanium-silver rounded-lg text-titanium-white transition-all group"
          >
            <Smartphone className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono">Add to Wallet</span>
          </button>
        </motion.div>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={handlePrint}
          className="w-full py-4 bg-titanium-silver text-titanium-black font-mono font-bold rounded-lg hover:bg-titanium-bright transition-colors flex items-center justify-center gap-2 print:hidden"
        >
          <Printer className="w-5 h-5" />
          Print Ticket
        </motion.button>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="p-4 bg-titanium-rich/50 border border-titanium-silver/20 rounded-lg print:hidden"
        >
          <p className="text-xs text-titanium-metallic text-center">
            📱 Please carry a printed or digital copy of this ticket to the venue.
            The QR code will be scanned for entry validation.
          </p>
        </motion.div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          @page {
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
