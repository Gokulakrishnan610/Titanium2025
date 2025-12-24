  import type { Metadata } from "next";
  import { Space_Grotesk, Poppins } from "next/font/google";
  import { Analytics } from "@vercel/analytics/next";
  import { QueryProvider } from "../lib/query/client";
  import WelcomeWrapper from "./components/WelcomeWrapper";
  import "./globals.css";

  export const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    variable: "--font-space-grotesk",
    weight: ["300", "400", "500", "600", "700"],
  });

  export const poppins = Poppins({
    subsets: ["latin"],
    variable: "--font-poppins",
    weight: ["400", "500", "600", "700", "800", "900"],
  });

  export const metadata: Metadata = {
    title: "Radium DevsRec - Event Portal",
    description:
      "Radium DevsRec Portal for DevsRec Event Management. The official event management platform for Rajalakshmi Engineering College's Developer Community.",
    manifest: "https://radium.devsrec.com/manifest.json",
    icons: {
      icon: "https://radium.devsrec.com/radiumLogo.png",
      apple: "https://radium.devsrec.com/radiumLogo.png",
    },
    // Open Graph (Facebook, WhatsApp, Instagram, LinkedIn)
    openGraph: {
      title: "Radium DevsRec - Event Portal",
      description: "Radium DevsRec Portal for DevsRec Event Management. Join workshops, hackathons, and tech events at Rajalakshmi Engineering College!",
      url: "https://radium.devsrec.com",
      siteName: "Radium DevsRec",
      images: [
        {
          url: "https://radium.devsrec.com/radiumLogo.png",
          width: 1200,
          height: 630,
          alt: "Radium DevsRec Logo",
        },
      ],
      locale: "en_US",
      type: "website",
    },
    // Twitter Card (Twitter, WhatsApp)
    twitter: {
      card: "summary_large_image",
      title: "Radium DevsRec - Event Portal",
      description: "Radium DevsRec Portal for DevsRec Event Management. Join workshops, hackathons, and tech events at Rajalakshmi Engineering College!",
      images: ["https://radium.devsrec.com/radiumLogo.png"],
      creator: "@devsrec",
    },
    // Additional meta tags for better social sharing
    other: {
      "og:image:width": "1200",
      "og:image:height": "630",
      "og:image:alt": "Radium DevsRec Logo",
      "twitter:image:alt": "Radium DevsRec Logo",
    },
  };

  export const viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#3b82f6',
  };

  export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <html lang="en">
        <head>
          {/* Additional meta tags for social media sharing */}
          <meta property="og:title" content="Radium DevsRec - Event Portal" />
          <meta property="og:description" content="Radium DevsRec Portal for DevsRec Event Management. Join workshops, hackathons, and tech events at Rajalakshmi Engineering College!" />
          <meta property="og:image" content="https://radium.devsrec.com/radiumLogo.png" />
          <meta property="og:url" content="https://radium.devsrec.com" />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Radium DevsRec" />
          
          {/* Twitter Card meta tags */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Radium DevsRec - Event Portal" />
          <meta name="twitter:description" content="Radium DevsRec Portal for DevsRec Event Management. Join workshops, hackathons, and tech events at Rajalakshmi Engineering College!" />
          <meta name="twitter:image" content="https://radium.devsrec.com/radiumLogo.png" />
          <meta name="twitter:image:alt" content="Radium DevsRec Logo" />
          
          {/* WhatsApp specific meta tags */}
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          
          {/* Instagram and Facebook additional tags */}
          <meta name="msapplication-TileColor" content="#3b82f6" />
        </head>
        <body
          className={`
            ${spaceGrotesk.variable}
            ${poppins.variable}
            antialiased
          `}
        >
          <QueryProvider>
            <WelcomeWrapper>
              {children}
            </WelcomeWrapper>
          </QueryProvider>
          <Analytics />
        </body>
      </html>
    );
  }
