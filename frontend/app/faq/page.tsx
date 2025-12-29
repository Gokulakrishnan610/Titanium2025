import FAQ from "../components/FAQ/faq";
import Navbar from "../components/NavBar/navbar";
import Footer from "../components/Footer/footer";

export const metadata = {
  title: "FAQ - TITANIUM 2025",
  description: "Frequently Asked Questions about TITANIUM 2025 - International Level Technical Symposium",
};

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-titanium-black">
      <Navbar />
      <FAQ />
      <Footer />
    </main>
  );
}