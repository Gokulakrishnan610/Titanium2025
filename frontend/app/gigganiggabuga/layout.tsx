import type { Metadata } from "next";
import Navbar from "../components/NavBar/navbar";
import SmoothScroll from "../components/SmoothScroll";

export const metadata: Metadata = {
  title: "Events | Titanium 2025",
  description: "Explore all events at Titanium 2025 - India's premier technical symposium",
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <Navbar />
      {children}
    </SmoothScroll>
  );
}
