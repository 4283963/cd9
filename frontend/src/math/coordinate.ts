import * as THREE from 'three'

export interface EngineCoord {
  x: number
  y: number
  z: number
}

export interface WorldCoord {
  x: number
  y: number
  z: number
}

export interface CoordTransformParams {
  origin: EngineCoord
  scale: number
  rotationY: number
}

export class CoordinateTransformer {
  private origin: EngineCoord
  private scale: number
  private rotationY: number
  private rotationMatrix: THREE.Matrix4
  private inverseRotationMatrix: THREE.Matrix4

  constructor(params: CoordTransformParams = {
    origin: { x: 0, y: 0, z: 0 },
    scale: 1,
    rotationY: 0
  }) {
    this.origin = { ...params.origin }
    this.scale = params.scale
    this.rotationY = params.rotationY
    this.rotationMatrix = new THREE.Matrix4()
    this.rotationMatrix.makeRotationY(this.rotationY)
    this.inverseRotationMatrix = this.rotationMatrix.clone().invert()
  }

  public setOrigin(origin: EngineCoord): void {
    this.origin = { ...origin }
  }

  public getOrigin(): EngineCoord {
    return { ...this.origin }
  }

  public setScale(scale: number): void {
    this.scale = scale
  }

  public getScale(): number {
    return this.scale
  }

  public setRotation(rotationY: number): void {
    this.rotationY = rotationY
    this.rotationMatrix.makeRotationY(rotationY)
    this.inverseRotationMatrix = this.rotationMatrix.clone().invert()
  }

  public getRotation(): number {
    return this.rotationY
  }

  public toWorld(engine: EngineCoord): WorldCoord {
    const vec = new THREE.Vector3(
      (engine.x - this.origin.x) * this.scale,
      (engine.y - this.origin.y) * this.scale,
      (engine.z - this.origin.z) * this.scale
    )
    vec.applyMatrix4(this.rotationMatrix)
    
    return { x: vec.x, y: vec.y, z: vec.z }
  }

  public toEngine(world: WorldCoord): EngineCoord {
    const vec = new THREE.Vector3(world.x, world.y, world.z)
    vec.applyMatrix4(this.inverseRotationMatrix)
    
    return {
      x: vec.x / this.scale + this.origin.x,
      y: vec.y / this.scale + this.origin.y,
      z: vec.z / this.scale + this.origin.z
    }
  }

  public toWorldVector(engineVec: EngineCoord): WorldCoord {
    const vec = new THREE.Vector3(
      engineVec.x * this.scale,
      engineVec.y * this.scale,
      engineVec.z * this.scale
    )
    vec.applyMatrix4(this.rotationMatrix)
    
    return { x: vec.x, y: vec.y, z: vec.z }
  }

  public toEngineVector(worldVec: WorldCoord): EngineCoord {
    const vec = new THREE.Vector3(worldVec.x, worldVec.y, worldVec.z)
    vec.applyMatrix4(this.inverseRotationMatrix)
    
    return {
      x: vec.x / this.scale,
      y: vec.y / this.scale,
      z: vec.z / this.scale
    }
  }

  public distanceToWorld(engineDistance: number): number {
    return engineDistance * this.scale
  }

  public distanceToEngine(worldDistance: number): number {
    return worldDistance / this.scale
  }
}

export function degToRad(deg: number): number {
  return deg * (Math.PI / 180)
}

export function radToDeg(rad: number): number {
  return rad * (180 / Math.PI)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5
  return (value - min) / (max - min)
}

export function mapValue(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return lerp(outMin, outMax, normalize(value, inMin, inMax))
}

export function createTranslationMatrix(x: number, y: number, z: number): THREE.Matrix4 {
  const matrix = new THREE.Matrix4()
  matrix.makeTranslation(x, y, z)
  return matrix
}

export function createRotationMatrix(x: number, y: number, z: number): THREE.Matrix4 {
  const matrix = new THREE.Matrix4()
  matrix.makeRotationFromEuler(new THREE.Euler(x, y, z))
  return matrix
}

export function createScaleMatrix(x: number, y: number, z: number): THREE.Matrix4 {
  const matrix = new THREE.Matrix4()
  matrix.makeScale(x, y, z)
  return matrix
}

export function composeMatrix(
  position: THREE.Vector3,
  rotation: THREE.Euler,
  scale: THREE.Vector3
): THREE.Matrix4 {
  const matrix = new THREE.Matrix4()
  matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale)
  return matrix
}
