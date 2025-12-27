import ScrollMask from "./components/ScrollEffect/scrollMask";
import Navbar from "./components/NavBar/navbar";
import About from "./components/About/about";
import Speakers from "./components/Speakers/speakers";
import RadialEvents from "./components/RadialEvents/radialevents";
import PlenarySessions from "./components/PlenarySession/plenary";
import DisplayZones from "./components/DisplayZones/DisplayZones";
import ExperienceZone from "./components/ExperienceZone/ExperienceZone";
import Workshops from "./components/Workshops/workshops";
import Schedule from "./components/Schedule/schedule";
import Footer from "./components/Footer/footer";
import SmoothScroll from "./components/SmoothScroll";
// import Sponsors from "./components/Sponsors/sponsors";
// import PlenarySessionsV2 from "./components/PlenarySessionV2/plenaryV2";

export default function Home() {
  return (
    <SmoothScroll>
      <ScrollMask />
      <Navbar />
      <About />
      <Speakers />
      <RadialEvents />
      <PlenarySessions />
      {/* <PlenarySessionsV2/> */}
      <DisplayZones />
      <ExperienceZone />
      <Workshops />
      <Schedule />
      {/*<Sponsors/>*/}
      <Footer />
    </SmoothScroll>
  );
}
