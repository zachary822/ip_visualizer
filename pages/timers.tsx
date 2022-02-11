import React, { useContext, useEffect, useState } from "react";

const timerScript = `
  setInterval(() => {
    postMessage(Date.now());
  }, 1000);
`;

const TimerContext = React.createContext<Worker | null>(null);

const TimerProvider = ({ children }) => {
  const [worker, setWorker] = useState<Worker | null>(null);

  useEffect(() => {
    const blob = new Blob([timerScript], { type: "application/javascript" });

    const w = new Worker(URL.createObjectURL(blob), { name: "timer" });
    setWorker(w);

    return () => {
      w.terminate();
      setWorker(null);
    };
  }, []);

  return (
    <TimerContext.Provider value={worker}>{children}</TimerContext.Provider>
  );
};

const useTimer = () => {
  const worker = useContext(TimerContext);
  const [time, setTime] = useState();

  useEffect(() => {
    if (worker) {
      worker.onmessage = (e) => {
        setTime(e.data);
      };
    }
  }, [worker]);

  return time;
};

const Timer = () => {
  const time = useTimer();

  return <div>do stuff with time: {time}</div>;
};

const Component2 = () => {
  return <div>yay, doesn&apos;t rerender with time.</div>;
};

const Timers = () => {
  return (
    <TimerProvider>
      riveting content
      <Timer />
      <Component2 />
    </TimerProvider>
  );
};

export default Timers;
