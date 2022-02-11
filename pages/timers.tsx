import React, { useContext, useEffect, useRef, useState } from "react";

const timerScript = `
  setInterval(() => {
    postMessage(Date.now());
  }, 1000);
`;

const TimerContext = React.createContext({ current: null });

const TimerProvider = ({ children }) => {
  const handlerRef = useRef([]);

  useEffect(() => {
    const blob = new Blob([timerScript], { type: "application/javascript" });

    const w = new Worker(URL.createObjectURL(blob), { name: "timer" });
    w.onmessage = (e) => {
      for (let f of handlerRef.current) {
        f(e);
      }
    };

    return () => {
      w.terminate();
    };
  }, []);

  return (
    <TimerContext.Provider value={handlerRef}>{children}</TimerContext.Provider>
  );
};

const useTimer = () => {
  const handlerRef = useContext(TimerContext);
  const [time, setTime] = useState();

  useEffect(() => {
    const func = (e) => {
      setTime(e.data);
    };

    if (handlerRef.current) {
      handlerRef.current.push(func);
    }

    return () => {
      if (handlerRef.current) {
        handlerRef.current.splice(handlerRef.current.indexOf(func), 1);
      }
    };
  }, []);

  return time;
};

const Timer = () => {
  const time = useTimer();

  return <div>do stuff with time: {time}</div>;
};

const TitleUpdater = () => {
  const time = useTimer();

  useEffect(() => {
    document.title = `${time} ms`;
  }, [time]);

  return null;
};

const Component2 = () => {
  return <div>yay, doesn&apos;t rerender when time updates.</div>;
};

const Timers = () => {
  const [toggle, setToggle] = useState(true);

  return (
    <TimerProvider>
      <TitleUpdater />
      riveting content
      <Timer />
      <button onClick={() => setToggle((toggle) => !toggle)}>toggle</button>
      {toggle && <Timer />}
      <Component2 />
    </TimerProvider>
  );
};

export default Timers;
