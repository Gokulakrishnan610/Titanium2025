
export type HoverEffect = "tilt" | "lift" | "exploded" | "holographic";
export type BackgroundStyle = "grid" | "particles" | "noise" | "solid";
export type LoadingStyle = "skeleton" | "spinner" | "logo";

export const eventsConfig = {

  hoverEffect: "tilt" as HoverEffect,

  backgroundStyle: "grid" as BackgroundStyle,

  loadingStyle: "skeleton" as LoadingStyle,


  glowColor: "#C0C0C0",


  animations: {
    cardRevealDuration: 0.6,
    
    cardStaggerDelay: 0.1,
    
    hoverDuration: 0.4,
    
    borderScanSpeed: 3,
  },

 
  scroll: {
    smoothScroll: true,
    
    showProgressBar: true,
    
    snapScroll: true,
  },


  card: {
    width: "min(500px, 90vw)",
    
    gap: 32,
    
    animatedBorders: true,
    
    showCategory: true,
    
    showPrize: true,
  },


  filters: {
    enableSearch: true,
    
    enableCategoryFilter: true,
    
    filtersExpandedByDefault: false,
  },

  api: {
    baseUrl: "http://localhost:8000/api",

    useBackend: true,
    
    silentFallback: true,
  },


  payment: {
    razorpayKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY || "rzp_test_demo",
    
    enablePayment: true,
  },
};

export default eventsConfig;
