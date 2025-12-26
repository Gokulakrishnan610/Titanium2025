'use client'
import IsometricRoom from "../components/IsometricRoom/IsometricRoom";
import CountdownTimer from "../components/CountdownTimer/CountdownTimer";
import CurvedLoop from '../../components/CurvedLoop';

const page = () => {
  const targetDate = new Date(2026, 0, 10, 0, 0, 0); // (0 = January)

  return (
    <>
      <style>{`
        .timer-container {
          position: fixed;
          top: 2rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
        }
        @media (max-width: 768px) {
          .timer-container {
            top: 12rem;
          }
        }
        @media (max-width: 480px) {
          .timer-container {
            top: 16rem;
          }
        }
        .commingSoon-container {
          position: fixed;
          bottom: -2.5rem;
          left: 0;
          width: 100%;
          height: 150px;
          z-index: 100;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          pointer-events: none; /* Let clicks pass through if not on text */
        }
        .commingSoon-container .curved-loop-jacket {
          min-height: auto !important;
          height: 100%;
          pointer-events: auto;
        }
        .commingSoon-container .curved-loop-svg {
          font-size: 2rem !important;
        }
        @media (max-width: 768px) {
          .commingSoon-container {
            bottom: 4rem;
            height: 120px;
          }
          .commingSoon-container .curved-loop-svg {
            font-size: 5rem !important;
          }
        }
        @media (max-width: 480px) {
          .commingSoon-container {
            bottom: 2rem;
            height: 100px;
          }
          .commingSoon-container .curved-loop-svg {
            font-size: 4.5rem !important;
          }
        }
      `}</style>
      <div className="timer-container">
        <CountdownTimer targetDate={targetDate} />
      </div>
      <IsometricRoom />
      <div className="commingSoon-container">
        <CurvedLoop
          marqueeText="Comming ✦ Soon ✦"
          speed={1}
          curveAmount={0}
          direction="right"
          interactive={true}
          className="custom-text-style"
        />
      </div>
    </>
  )
}

export default page

