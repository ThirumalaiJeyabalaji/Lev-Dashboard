import React, { useState, useEffect } from 'react';
import axios from "axios";
import tutrlogo from "../tutr.png";

export function GaugeBox({
    title,
    value,
    unit,
    status,
    statusColorClass
}) {
    return (
        <div className='gauge-box'>
            <div className='gauge-title'>{title}</div>
            <div className='gauge-glow' />
            <div className='gauge-divider' />
            <div className='gauge-circle-bg' />
            <div className='gauge-value-container'>
                <span className='gauge-value'>{value}</span>
                <span className='gauge-unit'>{unit}</span>
            </div>
            <div className={`gauge-status ${statusColorClass}`}>{status}</div>
        </div>
    );
}

export function GaugeSVG({
    title,
    value,
    unit,
    statusColorClass
}) {
    return (
        <div className={`gauge-svg-box ${statusColorClass}`}>
            <svg className='gauge-svg' width="174" height="216" viewBox='0 0 174 216' fill='none'>
                <g>
                    <text x="86.5" y="28" className={`gauge-svg-title ${statusColorClass}`}>{title}</text>
                </g>
                <g>
                    <text x='87' y='128' className={`gauge-svg-value ${statusColorClass}`}>
                        {value}
                    </text>
                </g>
                <g>
                    <text x='87' y='154' className={`gauge-svg-unit ${statusColorClass}`}>{unit}</text>
                </g>
                <path 
                    d="M72.2428 53.5903C73.8866 53.223 75.5567 52.9148 77.2513 52.6692L78.0978 52.5525C113.92 47.8245 146.987 72.7713 152.184 108.636L152.3 109.482C153.153 115.945 153.04 122.317 152.071 128.453L149.285 109.22C149.277 109.167 149.27 109.113 149.262 109.059C144.259 74.526 112.208 50.5874 77.6747 55.5909C73.6958 56.1674 69.858 57.1042 66.1886 58.3613L72.2428 53.5903ZM63.1521 176.744C73.1625 180.781 84.3417 182.306 95.7941 180.646C123.073 176.694 143.741 155.864 148.754 130.265L149.858 137.887C142.562 161.127 122.658 179.399 97.0623 183.44L96.2174 183.568C77.2576 186.315 59.013 180.727 45.1935 169.576L63.1521 176.744ZM21.1683 126.755C17.0981 95.9172 35.0197 67.1226 62.9655 56.391L47.6796 68.4388L47.681 68.4416C30.5221 81.957 20.8496 104.009 24.2067 127.178C26.4665 142.775 34.2439 156.21 45.2752 165.795L38.0864 162.926C29.3433 153.45 23.2735 141.325 21.285 127.602L21.1683 126.755Z" 
                    className={`gauge-svg-path ${statusColorClass}`}
                />
            </svg>
        </div>
    );
}

export function LevitationGaps({ gaps }) {
    const gapNames = ["first", "second", "third", "fourth"];
    return (
        <div className='lev-gaps-container'>
            {gapNames.map((name) => {
                const gapValue = gaps[name];
                const gapStatus = getStatus('gap', gapValue);
                return (
                    <div 
                        key={name}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "6px",
                        }}
                    >
                        <div className='lev-gap-label'>
                            {name.charAt(0).toUpperCase() + name.slice(1)}
                        </div>
                        <div className={`icon-box ${gapStatus.className}`}>
                            <span className='corner top-left'></span>
                            <span className='corner top-right'></span>
                            <span className='corner bottom-left'></span>
                            <span className='corner bottom-right'></span>
                            <span className='icon-content'>{gaps[name].toFixed(2)}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function getStatus(parameter, value) {
    if (parameter == 'current') {
        if (value > 360) {
            return {status: "HIGH", className: "status-red"};
        } else {
            return {status: "NORMAL", className: "status-green"};
        }
    } else if (parameter == 'voltage') {
        if (value < 250) {
            return {status: "LOW", className: "status-red"};
        } else if (value > 350) {
            return {status: "HIGH", className: "status-red"};
        } else {
            return {status: "NORMAL", className: "status-green"};
        }
    } else if (parameter == 'speed') {
        if (value > 100) {
            return {status: "HIGH", className: "status-red"};
        } else {
            return {status: "NORMAL", className: "status-white"};
        } 
    } else if (parameter == 'gap') {
        if (value > 10) {
            return {status: "HIGH", className: "status-red"};
        } else if (value < 1) {
            return {status: "LOW", className: "status-red"};
        } else {
            return {status: "NORMAL", className: "status-white"};
        }
    }
}

export default function DashboardOverlay({
    sensorData,
    onResetCamera,
    theme,
    onToggleTheme,
    dashboardMode,
    onToggleMode
}) {
    const [weatherTemp, setWeatherTemp] = useState(null);
    const [weatherIcon, setWeatherIcon] = useState(null);

    const voltageStatus = getStatus('voltage', sensorData.voltage);
    const currentStatus = getStatus('current', sensorData.current);
    const speedStatus = getStatus('speed', sensorData.speed)
    const gapStatus = getStatus('gap', sensorData.gap)

    const fetchWeather = async () => {
        try {
        const response = await axios.get(
            `https://api.weatherapi.com/v1/current.json?key=26a04caf6ae6494a8f3101852250606&q=Chennai&aqi=no`
        );
        setWeatherTemp(response.data.current.temp_c);
        setWeatherIcon(response.data.current.condition.icon);
        } catch (error) {
        console.error("Error fetching weather:", error);
        }
    };

    useEffect(() => {
        fetchWeather();
        const weatherInterval = setInterval(fetchWeather, 180000);

        return () => {
            clearInterval(weatherInterval);
        };
    }, []);

    return (
        <div className={`dashboard-overlay ${theme === "light" ? "light-mode" : ""}`}>
            <div className='left-top-panel'>
                <div className='gauge-row'>
                    <GaugeBox
                        title='Voltage'
                        value={sensorData.voltage.toFixed(1)}
                        unit='V'
                        status={voltageStatus.status}
                        statusColorClass={voltageStatus.className}
                    />
                    <GaugeBox 
                        title="Current"
                        value={sensorData.current.toFixed(1)}
                        unit="A"
                        status={currentStatus.status}
                        statusColorClass={currentStatus.className}
                    />
                </div>
            </div>

            <div className='top-right-logo'>
                <div className='logo'>
                    <img src={tutrlogo} alt="TUTR Logo" />
                </div>
            </div>

            <div className="right-panel">
                <div className='gauge-col'>
                    <GaugeSVG 
                        title="Speed"
                        value={sensorData.speed.toFixed(0)}
                        unit="km/h"
                        statusColorClass={speedStatus.className}
                    />
                    <GaugeSVG 
                        title="Acceleration"
                        value={sensorData.acceleration.toFixed(1)}
                        unit="m/s²"
                        statusColorClass={"status-white"}
                    />
                </div>
                
            </div>

            {dashboardMode === "levitation" && (

                <div className='left-panel'>
                    <LevitationGaps gaps={sensorData.levGaps} />
                </div>
            )}

            <div className="bottom-panel">
                <div className="distance-container">
                <div className="distance-label">Distance:</div>
                <div className="distance-value">{Math.round(sensorData.distance)}m</div>
                {/* <div className="distance-value">{sensorData.progressFraction*100}m</div> */}
                </div>
                <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${sensorData.progressFraction * 100}%` }}
                ></div>
                </div>
            </div>

            <div className="bottom-right-panel">
                <div className="status-display">
                <span className="status-label">Pod Status:</span>
                <span className="status-value">{sensorData.podStatus}</span>
                <span className="status-indicator"></span>
                </div>
                <div className="runtime-display">
                <span className="runtime-label">Runtime:</span>
                <span className="runtime-value">{sensorData.runtime}s</span>
                </div>
            </div>

            <div className="footer">
                <div className="time-temp-Container">
                <p className="time-display">
                    <span className="clock-icon">🕒</span>
                    {new Date().toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    })}
                </p>
                <p className="weather-temp">
                    {weatherIcon && (
                    <img
                        src={`https:${weatherIcon}`}
                        alt="Weather Icon"
                        className="weather-icon"
                        style={{
                        verticalAlign: "middle",
                        marginRight: "5px",
                        marginLeft: "5px",
                        width: "40%",
                        }}
                    />
                    )}
                    {weatherTemp !== null ? `${weatherTemp}°C` : "Temp°C"}
                </p>
                </div>
            </div>
            <div className='controls-stack'>
                

                <div className="toggle-container">
                    {/* <span className="mode-label up">L</span> */}
                    <label className="toggle-switch vertical mode-toggle ">
                    <input
                        type="checkbox"
                        checked={dashboardMode === "levitation"}
                        onChange={onToggleMode}
                    />
                    <span className="slider vertical"></span>
                    </label>
                    {/* <span className="mode-label down">P</span> */}
                </div>
            

                <div className="toggle-container">
                    <label className="toggle-switch theme-toggle">
                    <input
                        type="checkbox"
                        checked={theme === "light"}
                        onChange={onToggleTheme}
                    />
                    <span className="slider"></span>
                    </label>
                </div>
            
            </div>
            <div className="reset-button-container">
                <button className="center-button" onClick={onResetCamera}>
                ↻
                </button>
            </div>
        </div>
    );
}