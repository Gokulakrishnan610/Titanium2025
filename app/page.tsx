import ScrollMask from "./components/ScrollEffect/scrollMask";
import Navbar from "./components/NavBar/navbar";
import About from "./components/About/about";
import Speakers from "./components/Speakers/speakers";
import Events from "./components/Events/events";
import Workshops from "./components/Workshops/workshops";
import Schedule from "./components/Schedule/schedule";
import Sponsors from "./components/Sponsors/sponsors";
import Footer from "./components/Footer/footer";
import SmoothScroll from "./components/SmoothScroll";

export default function Home() {
  return (
    <SmoothScroll>
      <ScrollMask />
      <Navbar/>
      <About/>
      <Speakers/>
      <Events/>
      <Workshops/>
      <Schedule/>
      <Sponsors/>
      <Footer/>
    </SmoothScroll>
  );
}
