import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import React, { useEffect, useRef, useState, Suspense } from "react";
import * as THREE from "three";
import "./App.css"; // Import CSS file

import { useSensorDataWithTracking } from "./Components/useSensorData1";
import DashboardOverlay from "./Components/DashboardOverlay";

function PodModel({
  url,
  width = 4,
  depth = 4,
  height = 2,
  basePosition = [0, 0, 0],
  gaps = [0, 0, 0, 0],
}) {
  const group = useRef();
  const { scene } = useGLTF(url);
  const [localScene] = useState(() => scene.clone(true));
  const [basePosX, basePosY, basePosZ] = basePosition;

  useFrame(() => {
    const halfW = width / 2;
    const halfD = depth / 2;
    const corners = [
      new THREE.Vector3(
        -halfW + basePosX,
        gaps[0] + basePosY,
        -halfD + basePosZ
      ),
      new THREE.Vector3(
        halfW + basePosX,
        gaps[1] + basePosY,
        -halfD + basePosZ
      ),
      new THREE.Vector3(
        -halfW + basePosX,
        gaps[2] + basePosY,
        halfD + basePosZ
      ),
      new THREE.Vector3(halfW + basePosX, gaps[3] + basePosY, halfD + basePosZ),
    ];
    const center = corners
      .reduce((acc, v) => acc.add(v), new THREE.Vector3())
      .multiplyScalar(1 / 4);
    const v1 = new THREE.Vector3().subVectors(corners[1], corners[0]);
    const v2 = new THREE.Vector3().subVectors(corners[2], corners[0]);
    const normal = new THREE.Vector3().crossVectors(v1, v2).normalize();
    const defaultNormal = new THREE.Vector3(0, -1, -2);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      defaultNormal,
      normal
    );
    if (group.current) {
      group.current.position.copy(
        center.clone().add(normal.clone().multiplyScalar(height / 2))
      );
      group.current.setRotationFromQuaternion(quaternion);
      // group.current.rotation.z += Math.PI;
    }
  });

  useEffect(() => {
    localScene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.roughness = 0.6;
        // child.material.metalness = 0;
        child.material.needsUpdate = true;
      }
    }, [localScene])
  })

  return (
    <group ref={group} >{/* castShadow> */}
      <primitive object={localScene} />
    </group>
  );
}

function TrackModel({ url, position = [1.5, -1.85, -1.7], color = 0x000000 }) {
  const group = useRef();
  const { scene } = useGLTF(url);
  const [localScene] = useState(() => scene.clone(true));

  useEffect(() => {
    if (group.current) {
      group.current.rotation.y = -Math.PI / 2;
      group.current.position.set(...position);
    }

    // Traverse the scene and change material color to black
    localScene.traverse((child) => {
      if (child.isMesh && child.material) {
        // Clone the material to avoid affecting other instances
        child.material = child.material.clone();
        child.material.roughness = 0.9;
        // Set the color to black
        child.material.color.set(color);
      }
    });
  }, [position, color, localScene]);

  return (
    <group ref={group} >{/* receiveShadow> */}
      <primitive object={localScene} />
    </group>
  );
}

function TubeModel({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 1,
  height = 5,
  radialSegments = 12,
  heightSegments = 1,
  openEnded = false,
}) {
  const geometry = new THREE.CylinderGeometry(
    radius,
    radius,
    height,
    radialSegments,
    heightSegments,
    openEnded
  );
  const material = new THREE.MeshPhysicalMaterial({
    side: THREE.DoubleSide,
    roughness: 0,
    transmission: 0.9,
    thickness: 0.1,
    attenuationColor: new THREE.Color(0x79b2fa),
    attenuationDistance: 0.5,
    clearcoat: 1,
    clearcoatRoughness: 0,
    transparent: true,
    opacity: 0.3,
    depthWrite: false, // This allows objects inside to be visible
  });
  return (
    <mesh
      geometry={geometry}
      material={material}
      position={position}
      rotation={rotation}
    />
  );
}

function LightsForTorus({
  position = [0,0,0],
  radius  = 1,
  lightOffset = 0,
  color = 0x00ffff,
  emissionIntensity=4,
  emissionDistance=1,
  emissionDecay=1
}) {
  const lightCount = 16;
  const lights = [];
  for (let i=0; i< lightCount; i++) {
    const angle = (i / lightCount) * 2 * Math.PI;
    const x = position[0];
    const y = position[1] + (radius + lightOffset) * Math.cos(angle);
    const z = position[2] + (radius + lightOffset) * Math.sin(angle);
    lights.push(
      <pointLight
        key={i}
        position={[x,y,z]}
        color={color}
        intensity={emissionIntensity}
        distance={emissionDistance}
        decay={emissionDecay}
        // castShadow
        />
    );
  }
  return(
    <>
      {lights}
    </>
  )
}

function TorusModel({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 1,
  tube = 0.4,
  radialSegments = 6,
  tubularSegments = 40,
  emission = 0x00ffff,
  emissionIntensity = 2,
}) {
  const geometry = new THREE.TorusGeometry(
    radius,
    tube,
    radialSegments,
    tubularSegments
  );
  const material = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
    emissive: emission,
    emissiveIntensity: emissionIntensity,
  });
  return (
    <mesh
      geometry={geometry}
      material={material}
      position={position}
      rotation={rotation}
      // castShadow
      // receiveShadow
    />
  );
}

function TubeArray({
  basePosition = [0, 0, 0],
  spacing = 2.0,
  count = 6,
  velocity = 0,
  visibleRange = 7,
}) {
  const [segments, setSegments] = useState(
    Array(count)
      .fill(0)
      .map((_, i) => ({
        key: i,
        position: [i * spacing - Math.floor(count / 2) * spacing, 0.3, 0],
      }))
  );

  useFrame(() => {
    setSegments((prevSegments) => {
      let moved = prevSegments.map((seg) => ({
        ...seg,
        position: [
          seg.position[0] - velocity * 0.02,
          seg.position[1],
          seg.position[2],
        ],
      }));
      moved = moved.filter((seg) => Math.abs(seg.position[0]) <= visibleRange);
      while (moved.length < count) {
        const minX = Math.min(...moved.map((s) => s.position[0]), 0);
        moved.unshift({
          key: Math.random(),
          position: [minX - spacing, 0.3, 0],
        });
        const maxX = Math.max(...moved.map((s) => s.position[0]), 0);
        moved.push({
          key: Math.random(),
          position: [maxX + spacing, 0.3, 0],
        });
        if (moved.length > count) moved = moved.slice(0, count);
      }
      return moved;
    });
  });

  useEffect(() => {
    setSegments(
      Array(count)
        .fill(0)
        .map((_, i) => ({
          key: i,
          position: [i * spacing - Math.floor(count / 2) * spacing, 0.3, 0],
        }))
    );
  }, [count, spacing]);

  return (
    <>
      {segments.map((seg) => (
        <React.Fragment key = {seg.key}>
          <TorusModel
            position={[
              seg.position[0] + basePosition[0],
              seg.position[1] + basePosition[1],
              seg.position[2] + basePosition[2],
            ]}
            rotation={[0, Math.PI / 2, 0]}
            radius={1}
            tube={0.03}
            radialSegments={10}
            tubularSegments={45}
            color={0xffffff}
          />
          <LightsForTorus
            position={[
              seg.position[0] + basePosition[0],
              seg.position[1] + basePosition[1],
              seg.position[2] + basePosition[2],
            ]}
            radius={1}
            lightOffset={0.0}
            color={0x00ffff}
            emissionIntensity={0.3}
            emissionDistance={2}
            emissionDecay={1}
          />
        </React.Fragment>
      ))}
    </>
  );
}

export default function App() {
  const sensorData = useSensorDataWithTracking();
  const controlsRef = useRef();
  const [theme, setTheme] = useState("dark"); // Add theme state, default to 'dark'
  const [dashboardMode, setDashboardMode] = useState("propulsion");
  
  const toggleDashboardMode = () => {
    setDashboardMode((prevMode) => (prevMode === "propulsion" ? "levitation" : "propulsion"));
    console.log("Dashboard mode changed to:", dashboardMode);
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div
      className={`App ${theme === "light" ? "light-mode" : ""}`}
      style={{ height: "100vh", width: "100vw", position: "relative" }}
    >
      <Canvas camera={{ position: [0, 0, 30], fov: 10 }} shadows>
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          // castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <directionalLight
          position={[10, 20, -10]}
          intensity={0.3}
          // castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        {/* <DeformableCuboid
          width={3.3}
          depth={1.2}
          height={1.07}
          basePosition={[0, -0.15, 0]}
          gaps={[
            sensorData.gap,
            sensorData.gap,
            sensorData.gap,
            sensorData.gap,
          ]}
        /> */}
        <TubeArray
          basePosition={[1, 0, 0]}
          spacing={3.0}
          count={4}
          velocity={sensorData.speed}
          visibleRange={4}
        />
        <TubeModel
          position={[0, 0.28, 0]}
          rotation={[0, 0, Math.PI / 2]}
          radius={1}
          height={12}
          radialSegments={24}
          heightSegments={1}
          color={0x444444}
          openEnded={true}
        />
        <Suspense fallback={null}>
          <TrackModel url="/Track.glb" position={[0, -0.6, 0]} />
          <TrackModel url="/Track.glb" position={[-4, -0.6, 0]} />
          <TrackModel url="/Track.glb" position={[4, -0.6, 0]} />
          <PodModel
            url="/NewPod4.glb"
            width={3.3}
            depth={1.2}
            height={1.07}
            basePosition={[0, 0.5, 0]}
            gaps={
              dashboardMode === "propulsion"
                ? [-0.1, -0.1, -0.1, -0.1]
                : Object.values(sensorData.levGaps).map(function(x) {return (x*0.01)-0.1})
            }
          />    
        </Suspense>
        <OrbitControls ref={controlsRef} />
      </Canvas>

      {/* Dashboard Overlay */}
      <DashboardOverlay
        sensorData={sensorData}
        onResetCamera={resetCamera}
        theme={theme}
        onToggleTheme={toggleTheme}
        dashboardMode={dashboardMode}
        onToggleMode={toggleDashboardMode}
      />
    </div>
  );
}
