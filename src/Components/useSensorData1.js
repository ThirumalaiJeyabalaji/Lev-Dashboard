import {useState, useEffect, useRef } from "react";

const totalDistance = 400;

export function usePodTracker() {

    const tillLastSegmentAbsDist = useRef(0);
    const tillLastSegmentDist = useRef(0);
    const direction = useRef(1);
    const currentDistance = useRef(0);
    const lowCurrentStartTime = useRef(null);
    const isIntermediateStop = useRef(false);

    function updatePosition(current, sensorDistance) {
        if (Math.abs(current) < 35) {
        if (!lowCurrentStartTime.current) {
            lowCurrentStartTime.current = Date.now();
        } else if (Date.now() - lowCurrentStartTime.current > 10000) {
            if (!isIntermediateStop.current) {
            tillLastSegmentAbsDist.current = sensorDistance;
            tillLastSegmentDist.current = currentDistance.current;
            direction.current *= -1;
            isIntermediateStop.current = true;
            }
        }
        } else {
        lowCurrentStartTime.current = null;
        isIntermediateStop.current = false;
        }

        currentDistance.current =
        tillLastSegmentDist.current +
        direction.current * (sensorDistance - tillLastSegmentAbsDist.current);

        return currentDistance.current;
    }

    return { updatePosition };
}

export function useSensorDataWithTracking() {
  const [data, setData] = useState({
    gap1: 0,
    gap2: 0,
    gap3: 0,
    gap4: 0,
    speed: 0,
    voltage: 0,
    current: 0,
    acceleration: 0,
    distance: 0,
    runtime: 0,
    // podStatus: "Auto Disabled",
    levGaps: { first: 0, second: 0, third: 0, fourth: 0 },
    progressFraction: 0,
  });

  const lastSpeedRef = useRef(0);
  const lastUpdateTimeRef = useRef(Date.now());
  const runtimeRef = useRef(0);
  const { updatePosition } = usePodTracker();
  const hasStarted = useRef(false);
  const zeroSpeedStartTimeRef = useRef(null);
  const autoDisabledRef = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:5000/latest-sensor");
        if (!response.ok) throw new Error("Network response was not ok");
        const sensorData = await response.json();

        // console.log("Fetched sensor data:", sensorData);

        const now = Date.now();
        const elapsedSeconds = (now - lastUpdateTimeRef.current) / 1000;
        lastUpdateTimeRef.current = now;

        if (!hasStarted.current && Math.abs(sensorData.current) >= 35) {
          hasStarted.current = true;
        }
        if (!hasStarted.current) return; // skip updating if not started

        const speed = sensorData.speed ?? 0;
        const acceleration = (speed - lastSpeedRef.current) / elapsedSeconds;
        const distance = data.distance + (speed / 3.6) * elapsedSeconds; // km/h to m/s

        const position = distance

        lastSpeedRef.current = speed;

        let runtime = runtimeRef.current;
        // let podStatus = "Auto Disabled";
        if (speed > 0.1) {
          runtime += elapsedSeconds;
          // podStatus = "Levitating";
        } else {
          // podStatus = "Auto Disabled";
        }

        if (speed < 0.1) {
          if (!zeroSpeedStartTimeRef.current) {
            zeroSpeedStartTimeRef.current = now;
          } else if (now - zeroSpeedStartTimeRef.current > 20000 && !autoDisabledRef.current) {
            // podStatus = "Auto Disabled (Zero Speed)";
            autoDisabledRef.current = true;
            runtime = 0;
          }
        } else {
          zeroSpeedStartTimeRef.current = null;
          autoDisabledRef.current = false;
        }

        runtimeRef.current = runtime;

        let progressFraction = position / totalDistance;
        progressFraction = Math.max(0, Math.min(1, progressFraction));

        // Update levGaps from gap1..gap4 from API data
        const levGaps = {
          first: sensorData.gap1 ?? 0,
          second: sensorData.gap2 ?? 0,
          third: sensorData.gap3 ?? 0,
          fourth: sensorData.gap4 ?? 0,
        };

        setData({
          gap1: sensorData.gap1 ?? 0,
          gap2: sensorData.gap2 ?? 0,
          gap3: sensorData.gap3 ?? 0,
          gap4: sensorData.gap4 ?? 0,
          speed,
          voltage: sensorData.voltage ?? 0,
          current: sensorData.current ?? 0,
          acceleration,
          distance,
          runtime: Math.floor(runtime),
          // podStatus,
          levGaps,
          progressFraction,
        });
      } catch (error) {
        console.error("Failed to fetch sensor data:", error);
      }
    };

    // Fetch every 100ms
    const intervalId = setInterval(fetchData, 100);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [updatePosition, data.distance]);

  return data;
}