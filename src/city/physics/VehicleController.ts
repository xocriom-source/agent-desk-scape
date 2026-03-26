/**
 * VehicleController — Kinematic vehicle simulation.
 * Provides realistic acceleration, braking, steering, and inertia
 * without a full physics engine.
 */

export interface VehicleConfig {
  maxSpeed: number;         // units/sec
  acceleration: number;     // units/sec²
  brakeForce: number;       // units/sec²
  friction: number;         // passive deceleration
  steeringSpeed: number;    // rad/sec
  maxSteeringAngle: number; // rad
  wheelBase: number;        // distance between axles
  mass: number;             // affects inertia feel
}

export interface VehiclePhysicsState {
  x: number;
  z: number;
  heading: number;        // rad, direction vehicle faces
  velocity: number;       // units/sec (negative = reverse)
  steeringAngle: number;  // current wheel angle
  throttle: number;       // -1 to 1
  steering: number;       // -1 to 1 (input)
}

export const VEHICLE_CONFIGS: Record<string, VehicleConfig> = {
  car: {
    maxSpeed: 14,
    acceleration: 6,
    brakeForce: 18,
    friction: 2.2,
    steeringSpeed: 2.0,
    maxSteeringAngle: Math.PI / 5.5,
    wheelBase: 0.65,
    mass: 1.2,
  },
  motorcycle: {
    maxSpeed: 16,
    acceleration: 12,
    brakeForce: 18,
    friction: 2.5,
    steeringSpeed: 3.5,
    maxSteeringAngle: Math.PI / 4,
    wheelBase: 0.4,
    mass: 0.6,
  },
  bicycle: {
    maxSpeed: 6,
    acceleration: 4,
    brakeForce: 8,
    friction: 2,
    steeringSpeed: 3,
    maxSteeringAngle: Math.PI / 4,
    wheelBase: 0.35,
    mass: 0.3,
  },
  futuristic_car: {
    maxSpeed: 20,
    acceleration: 15,
    brakeForce: 25,
    friction: 2,
    steeringSpeed: 3,
    maxSteeringAngle: Math.PI / 5,
    wheelBase: 0.7,
    mass: 0.8,
  },
};

export function getVehicleConfig(type: string): VehicleConfig {
  return VEHICLE_CONFIGS[type] || VEHICLE_CONFIGS.car;
}

/**
 * Simulate one physics step using bicycle model kinematics.
 * Returns new state.
 */
export function stepVehiclePhysics(
  state: VehiclePhysicsState,
  config: VehicleConfig,
  dt: number,
  collisionCheck?: (x: number, z: number, radius: number) => boolean,
): VehiclePhysicsState {
  dt = Math.min(dt, 0.05); // Cap to prevent tunneling

  const { throttle, steering } = state;
  let { velocity, steeringAngle, heading, x, z } = state;

  // ── Steering interpolation ──
  const targetSteering = steering * config.maxSteeringAngle;
  const steerDelta = config.steeringSpeed * dt;
  if (Math.abs(targetSteering - steeringAngle) < steerDelta) {
    steeringAngle = targetSteering;
  } else {
    steeringAngle += Math.sign(targetSteering - steeringAngle) * steerDelta;
  }

  // Return steering to center when no input
  if (Math.abs(steering) < 0.01) {
    const returnSpeed = config.steeringSpeed * 2 * dt;
    if (Math.abs(steeringAngle) < returnSpeed) {
      steeringAngle = 0;
    } else {
      steeringAngle -= Math.sign(steeringAngle) * returnSpeed;
    }
  }

  // ── Acceleration / braking with weight feel ──
  const massFactor = 1 / Math.max(config.mass, 0.3);
  if (throttle > 0.01) {
    if (velocity < 0) {
      // Braking from reverse
      velocity += config.brakeForce * massFactor * dt;
      if (velocity > 0) velocity = 0;
    } else {
      // Progressive acceleration (slower at high speed)
      const speedRatio = Math.abs(velocity) / config.maxSpeed;
      const accCurve = 1 - speedRatio * speedRatio * 0.6;
      velocity += throttle * config.acceleration * massFactor * accCurve * dt;
    }
  } else if (throttle < -0.01) {
    if (velocity > 0.5) {
      // Brake with weight
      velocity -= config.brakeForce * massFactor * dt;
      if (velocity < 0) velocity = 0;
    } else {
      // Reverse (slower, heavier)
      velocity += throttle * config.acceleration * 0.3 * massFactor * dt;
    }
  } else {
    // Friction (coast to stop) — heavier = slower coast
    const frictionForce = config.friction * (0.5 + 0.5 * massFactor);
    if (Math.abs(velocity) < 0.15) {
      velocity = 0;
    } else {
      velocity -= Math.sign(velocity) * frictionForce * dt;
    }
  }

  // Clamp speed
  velocity = Math.max(-config.maxSpeed * 0.3, Math.min(config.maxSpeed, velocity));

  // ── Bicycle model kinematics ──
  if (Math.abs(velocity) > 0.01) {
    if (Math.abs(steeringAngle) > 0.001) {
      const turnRadius = config.wheelBase / Math.tan(steeringAngle);
      const angularVelocity = velocity / turnRadius;
      heading += angularVelocity * dt;
    }

    const newX = x + Math.sin(heading) * velocity * dt;
    const newZ = z + Math.cos(heading) * velocity * dt;

    // Collision check
    if (collisionCheck && collisionCheck(newX, newZ, 0.4)) {
      // Bounce back slightly
      velocity *= -0.2;
    } else {
      x = newX;
      z = newZ;
    }
  }

  // Normalize heading
  while (heading > Math.PI) heading -= Math.PI * 2;
  while (heading < -Math.PI) heading += Math.PI * 2;

  return { x, z, heading, velocity, steeringAngle, throttle, steering };
}

/**
 * Map keyboard input to throttle/steering.
 */
export function inputToVehicleControls(keys: Set<string>): { throttle: number; steering: number } {
  let throttle = 0;
  let steering = 0;

  if (keys.has("w") || keys.has("arrowup")) throttle = 1;
  if (keys.has("s") || keys.has("arrowdown")) throttle = throttle > 0 ? 0 : -1;
  if (keys.has("a") || keys.has("arrowleft")) steering = -1;
  if (keys.has("d") || keys.has("arrowright")) steering = steering < 0 ? 0 : 1;

  return { throttle, steering };
}
