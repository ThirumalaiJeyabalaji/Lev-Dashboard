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
        gap: 0,
        speed: 0,
        voltage: 300,
        current: 36,
        acceleration: 0,
        distance: 0,
        runtime: 0,
        podStatus: "Auto Disabled",
        levGaps: { first: 5.1, second: 5.2, third: 5.15, fourth: 5.25 },
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
        const interval = setInterval(() => {
            const now = Date.now();
            const elapsedSeconds = (now - lastUpdateTimeRef.current) / 1000;
            lastUpdateTimeRef.current = now;

            // Simulated inputs - START
            const gap = 0.1 + Math.random() * 5 * 0.01;
            const speed = 10 + Math.random() * 10; 
            const voltage = 300 + Math.random() * 0.5;
            const current = 36 + Math.random() * 4;
            // Simulated inputs - END
            

            setData((prev) => {
                if (!hasStarted.current && Math.abs(current) >= 35) {
                    hasStarted.current = true;
                }
                if (!hasStarted.current) return prev;

                const position = updatePosition(current, prev.distance);
                const acceleration = (speed - lastSpeedRef.current) / elapsedSeconds;
                const distance = prev.distance + (speed / 3.6) * elapsedSeconds;

                lastSpeedRef.current = speed;

                let runtime = runtimeRef.current;
                let podStatus = "Auto Disabled";
                if (speed > 0.1) {
                    runtime += elapsedSeconds;
                    podStatus = "Levitating";
                } else {
                    podStatus = "Auto Disabled";
                }

                if (speed < 0.1) {
                    if (!zeroSpeedStartTimeRef.current) {
                        zeroSpeedStartTimeRef.current = now;
                    } else if ( now - zeroSpeedStartTimeRef.current > 20000 && !autoDisabledRef.current ) {
                        podStatus = "Auto Disabled (Zero Speed)";
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

                const levGaps = {
                    first: 5.0 + Math.random() * 2,
                    second: 5.0 + Math.random() * 2,
                    third: 5.0 + Math.random() * 2,
                    fourth: 5.0 + Math.random() * 2,
                };

                return {
                    ...prev,
                    gap,
                    speed,
                    voltage,
                    current,
                    acceleration,
                    distance,
                    runtime: Math.floor(runtime),
                    podStatus,
                    levGaps,
                    progressFraction,
                };
            });
        }, 200);

        return () => clearInterval(interval);
    }, []);

    return data;
}