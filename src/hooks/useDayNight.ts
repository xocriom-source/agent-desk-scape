import { useState, useEffect, useMemo } from "react";

export interface DayNightConfig {
  /** 0-1 where 0=midnight, 0.5=noon */
  timeOfDay: number;
  isDay: boolean;
  isNight: boolean;
  isSunrise: boolean;
  isSunset: boolean;
  /** Background color */
  bgColor: string;
  /** Fog color */
  fogColor: string;
  /** Ambient light intensity */
  ambientIntensity: number;
  /** Ambient light color */
  ambientColor: string;
  /** Sun/moon intensity */
  sunIntensity: number;
  /** Sun color */
  sunColor: string;
  /** Sun position [x, y, z] */
  sunPosition: [number, number, number];
  /** Hemisphere sky color */
  skyColor: string;
  /** Hemisphere ground color */
  groundColor: string;
  /** Hemisphere intensity */
  hemiIntensity: number;
  /** Show stars */
  showStars: boolean;
  /** Star opacity */
  starOpacity: number;
  /** Fog near/far */
  fogNear: number;
  fogFar: number;
  /** Tone mapping exposure */
  exposure: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ra = (pa >> 16) & 0xff, ga = (pa >> 8) & 0xff, ba = pa & 0xff;
  const rb = (pb >> 16) & 0xff, gb = (pb >> 8) & 0xff, bb = pb & 0xff;
  const r = Math.round(lerp(ra, rb, t));
  const g = Math.round(lerp(ga, gb, t));
  const b2 = Math.round(lerp(ba, bb, t));
  return `#${((r << 16) | (g << 8) | b2).toString(16).padStart(6, "0")}`;
}

export function useDayNight(): DayNightConfig {
  const [hour, setHour] = useState(() => new Date().getHours() + new Date().getMinutes() / 60);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setHour(now.getHours() + now.getMinutes() / 60);
    }, 30000); // update every 30s
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    const timeOfDay = hour / 24;

    // Time periods
    const isNight = hour < 5.5 || hour > 20;
    const isSunrise = hour >= 5.5 && hour < 7.5;
    const isDay = hour >= 7.5 && hour < 17.5;
    const isSunset = hour >= 17.5 && hour <= 20;

    // Sun angle (rises east, sets west)
    const sunAngle = ((hour - 6) / 12) * Math.PI; // 0 at 6am, PI at 6pm
    const sunHeight = Math.sin(sunAngle) * 25;
    const sunX = Math.cos(sunAngle) * 15;

    let bgColor: string, fogColor: string;
    let ambientIntensity: number, ambientColor: string;
    let sunIntensity: number, sunColor: string;
    let skyColor: string, groundColor: string, hemiIntensity: number;
    let showStars: boolean, starOpacity: number;
    let fogNear: number, fogFar: number, exposure: number;

    if (isNight) {
      bgColor = "#0E1525";
      fogColor = "#0E1525";
      ambientIntensity = 0.45;
      ambientColor = "#6688CC";
      sunIntensity = 0.2;
      sunColor = "#AABBEE";
      skyColor = "#1A1A40";
      groundColor = "#2A2A3A";
      hemiIntensity = 0.3;
      showStars = true;
      starOpacity = 1;
      fogNear = 60;
      fogFar = 300;
      exposure = 1.1;
    } else if (isSunrise) {
      const t = (hour - 5.5) / 2; // 0 to 1
      bgColor = lerpColor("#1A1C30", "#FFE8D0", t);
      fogColor = lerpColor("#1A1C30", "#FFD0A0", t);
      ambientIntensity = lerp(0.4, 0.7, t);
      ambientColor = lerpColor("#6688BB", "#FFE0C0", t);
      sunIntensity = lerp(0.3, 0.8, t);
      sunColor = "#FF9040";
      skyColor = lerpColor("#2A2A50", "#87CEEB", t);
      groundColor = lerpColor("#3A3A4A", "#8B7355", t);
      hemiIntensity = lerp(0.25, 0.4, t);
      showStars = t < 0.5;
      starOpacity = Math.max(0, 1 - t * 2);
      fogNear = lerp(50, 80, t);
      fogFar = lerp(250, 400, t);
      exposure = lerp(1.0, 1.4, t);
    } else if (isDay) {
      bgColor = "#87CEEB";
      fogColor = "#B0D8F0";
      ambientIntensity = 0.8;
      ambientColor = "#FFF8F0";
      sunIntensity = 1.2;
      sunColor = "#FFF0D0";
      skyColor = "#87CEEB";
      groundColor = "#8B7355";
      hemiIntensity = 0.5;
      showStars = false;
      starOpacity = 0;
      fogNear = 80;
      fogFar = 450;
      exposure = 1.4;
    } else {
      // Sunset
      const t = (hour - 17.5) / 2.5; // 0 to 1
      bgColor = lerpColor("#FF8040", "#0E1525", t);
      fogColor = lerpColor("#FF6030", "#0E1525", t);
      ambientIntensity = lerp(0.6, 0.45, t);
      ambientColor = lerpColor("#FFD0A0", "#6688CC", t);
      sunIntensity = lerp(0.7, 0.2, t);
      sunColor = "#FF6020";
      skyColor = lerpColor("#FF8040", "#1A1A40", t);
      groundColor = lerpColor("#8B5A30", "#2A2A3A", t);
      hemiIntensity = lerp(0.4, 0.3, t);
      showStars = t > 0.5;
      starOpacity = Math.max(0, (t - 0.5) * 2);
      fogNear = lerp(70, 60, t);
      fogFar = lerp(400, 300, t);
      exposure = lerp(1.3, 1.1, t);
    }

    return {
      timeOfDay,
      isDay,
      isNight,
      isSunrise,
      isSunset,
      bgColor,
      fogColor,
      ambientIntensity,
      ambientColor,
      sunIntensity,
      sunColor,
      sunPosition: [sunX, Math.max(2, sunHeight), 10] as [number, number, number],
      skyColor,
      groundColor,
      hemiIntensity,
      showStars,
      starOpacity,
      fogNear,
      fogFar,
      exposure,
    };
  }, [hour]);
}
