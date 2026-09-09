import * as THREE from "three";
import { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";

extend({ MeshLineGeometry, MeshLineMaterial });
useGLTF.preload(`${import.meta.env.BASE_URL}models/LegoLab.glb`);

/* ── Error boundary ─────────────────────────────────────────────────────── */

class LegoErrorBoundary extends Component {
  state = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  render() {
    return this.state.crashed ? (this.props.fallback ?? null) : this.props.children;
  }
}

/* ── WebGL context loss ─────────────────────────────────────────────────── */

function ContextGuard() {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = (event) => event.preventDefault(); // allows restore
    canvas.addEventListener("webglcontextlost", onLost);
    return () => canvas.removeEventListener("webglcontextlost", onLost);
  }, [gl]);

  return null;
}

/** Reads a CSS custom property as a real colour, and follows theme changes. */
function useTokenColor(token, fallback = "#ffffff") {
  const [color, setColor] = useState(fallback);

  useEffect(() => {
    const read = () => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
      if (value) setColor(value);
    };

    read();

    // The theme toggles by changing a class on <html>.
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => observer.disconnect();
  }, [token]);

  return color;
}

/* ── The rope and the figure ────────────────────────────────────────────── */

const SEGMENT = {
  type: "dynamic",
  canSleep: true,
  colliders: false,
  angularDamping: 6,
  linearDamping: 6,
};

function Band({ maxSpeed = 50, minSpeed = 10 }) {
  const band = useRef();
  const fixed = useRef();
  const j1 = useRef();
  const j2 = useRef();
  const j3 = useRef();
  const card = useRef();

  // Scratch vectors as refs: no allocation inside the frame loop.
  const vec = useRef(new THREE.Vector3());
  const ang = useRef(new THREE.Vector3());
  const rot = useRef(new THREE.Vector3());
  const dir = useRef(new THREE.Vector3());

  const { scene: gltf } = useGLTF(`${import.meta.env.BASE_URL}models/LegoLab.glb`);
  const { width, height } = useThree((s) => s.size);
  const ropeColor = useTokenColor("--foreground", "#ffffff");

  const curve = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
    c.curveType = "chordal";
    return c;
  }, []);

  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0],
  ]);

  /* Resolve the rig once. The original looked these up every frame. */
  const parts = useMemo(() => {
    const get = (name) => gltf.getObjectByName(name) ?? null;
    return {
      head: get("Part0"),
      armL: get("Part3"),
      handL: get("Part4"),
      armR: get("Part5"),
      handR: get("Part6"),
      legL: get("Part8"),
      legR: get("Part9"),
    };
  }, [gltf]);

  /* Reparent the hands once, not sixty times a second. */
  useEffect(() => {
    const { armL, handL, armR, handR } = parts;
    if (armL && handL) armL.attach(handL);
    if (armR && handR) armR.attach(handR);
  }, [parts]);

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = dragged ? "grabbing" : "grab";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (!card.current || !fixed.current || !j1.current || !j2.current || !j3.current) return;
    if (!band.current) return;

    if (dragged) {
      vec.current.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.current.copy(vec.current).sub(state.camera.position).normalize();
      vec.current.add(dir.current.multiplyScalar(state.camera.position.length()));

      for (const ref of [card, j1, j2, j3, fixed]) ref.current?.wakeUp();

      card.current.setNextKinematicTranslation({
        x: vec.current.x - dragged.x,
        y: vec.current.y - dragged.y,
        z: vec.current.z - dragged.z,
      });
    }

    for (const ref of [j1, j2]) {
      const body = ref.current;
      if (!body) continue;
      if (!body.lerped) body.lerped = new THREE.Vector3().copy(body.translation());
      const d = Math.max(0.1, Math.min(1, body.lerped.distanceTo(body.translation())));
      body.lerped.lerp(body.translation(), delta * (minSpeed + d * (maxSpeed - minSpeed)));
    }

    curve.points[0].copy(j3.current.translation());
    curve.points[1].copy(j2.current.lerped ?? j2.current.translation());
    curve.points[2].copy(j1.current.lerped ?? j1.current.translation());
    curve.points[3].copy(fixed.current.translation());
    band.current.geometry.setPoints(curve.getPoints(32));

    ang.current.copy(card.current.angvel());
    rot.current.copy(card.current.rotation());
    card.current.setAngvel({
      x: ang.current.x,
      y: ang.current.y - rot.current.y * 0.25,
      z: ang.current.z,
    });

    const { head, armL, armR, legL, legR } = parts;
    const t = state.clock.getElapsedTime();
    const lv = card.current.linvel();
    const speed = Math.sqrt(lv.x ** 2 + lv.y ** 2 + lv.z ** 2);
    const swinging = !dragged && speed > 0.05;

    if (head) head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, dragged ? Math.PI : 0, 0.3);

    if (swinging) {
      const wave = Math.sin(t * 10) * 0.2;
      const stride = Math.sin(t * 10) * 0.5;
      if (armL) armL.rotation.x = THREE.MathUtils.lerp(armL.rotation.x, wave, 0.3);
      if (armR) armR.rotation.x = THREE.MathUtils.lerp(armR.rotation.x, -wave, 0.3);
      if (legL) legL.rotation.x = THREE.MathUtils.lerp(legL.rotation.x, -stride + 1, 0.3);
      if (legR) legR.rotation.x = THREE.MathUtils.lerp(legR.rotation.x, stride + 1, 0.3);
    } else {
      if (armL) armL.rotation.x = THREE.MathUtils.lerp(armL.rotation.x, 2.3, 0.2);
      if (armR) armR.rotation.x = THREE.MathUtils.lerp(armR.rotation.x, 2.3, 0.2);
      if (legL) legL.rotation.x = THREE.MathUtils.lerp(legL.rotation.x, 1.5, 0.2);
      if (legR) legR.rotation.x = THREE.MathUtils.lerp(legR.rotation.x, 1.5, 0.2);
    }
  });

  return (
    <>
      <group position={[0, 4.5, 0]}>
        <RigidBody ref={fixed} {...SEGMENT} type="fixed" />

        <RigidBody position={[0.5, 0, 0]} ref={j1} {...SEGMENT}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...SEGMENT}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...SEGMENT}>
          <BallCollider args={[0.1]} />
        </RigidBody>

        <RigidBody position={[2, 0, 0]} ref={card} {...SEGMENT} type={dragged ? "kinematicPosition" : "dynamic"}>
          <CuboidCollider args={[0.5, 1.1, 0.01]} position={[0, 0.2, 0]} />
          <primitive
            object={gltf}
            scale={2}
            position={[0, -0.2, -0.05]}
            rotation={[0, -0.15, 0]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerDown={(e) => {
              e.target.setPointerCapture(e.pointerId);
              drag(new THREE.Vector3().copy(e.point).sub(vec.current.copy(card.current.translation())));
            }}
            onPointerUp={(e) => {
              e.target.releasePointerCapture(e.pointerId);
              drag(false);
            }}
          />
        </RigidBody>
      </group>

      <mesh ref={band} renderOrder={-1}>
        <meshLineGeometry />
        <meshLineMaterial color={ropeColor} depthTest={false} resolution={[width, height]} lineWidth={0.5} />
      </mesh>
    </>
  );
}

function Scene() {
  return (
    <>
      <ContextGuard />
      <ambientLight intensity={Math.PI / 4} />

      <Physics gravity={[0, -30, 0]} timeStep={1 / 60}>
        <Band />
      </Physics>

      <Environment blur={0.75} environmentIntensity={0.6}>
        <Lightformer intensity={1} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={1} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={2} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={6} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
      </Environment>
    </>
  );
}

export default function Lego({ className = "h-full w-full" }) {
  const hostRef = useRef(null);
  const [visible, setVisible] = useState(false);

  // Physics and rendering only run while the badge is actually on screen.
  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "120px" });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} className={className}>
      <LegoErrorBoundary>
        {visible && (
          <Canvas
            className="h-full w-full"
            camera={{ position: [0, 0, 14], fov: 23 }}
            dpr={[1, 1.5]}
            performance={{ min: 0.5 }}
            gl={{
              powerPreference: "high-performance",
              antialias: true,
              failIfMajorPerformanceCaveat: false,
              alpha: true,
            }}
            style={{ background: "transparent" }}
          >
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </Canvas>
        )}
      </LegoErrorBoundary>
    </div>
  );
}
