/**
 * 坐标转换工具模块
 * 支持工程坐标与三维坐标的相互转换，以及经纬度与笛卡尔坐标的转换
 */

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface LatLng {
  lat: number;
  lng: number;
  altitude?: number;
}

export interface CoordinateTransformParams {
  offsetX?: number;
  offsetY?: number;
  offsetZ?: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  scale?: number;
}

const EARTH_RADIUS = 6378137;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * 角度转弧度
 */
export function degToRad(deg: number): number {
  return deg * DEG_TO_RAD;
}

/**
 * 弧度转角度
 */
export function radToDeg(rad: number): number {
  return rad * RAD_TO_DEG;
}

/**
 * 经纬度转笛卡尔坐标（ECEF坐标系）
 * @param latLng 经纬度坐标
 * @returns 笛卡尔坐标 (x, y, z)
 */
export function latLngToCartesian(latLng: LatLng): Point3D {
  const { lat, lng, altitude = 0 } = latLng;
  const latRad = degToRad(lat);
  const lngRad = degToRad(lng);
  const r = EARTH_RADIUS + altitude;

  return {
    x: r * Math.cos(latRad) * Math.cos(lngRad),
    y: r * Math.cos(latRad) * Math.sin(lngRad),
    z: r * Math.sin(latRad),
  };
}

/**
 * 笛卡尔坐标转经纬度（ECEF坐标系）
 * @param point 笛卡尔坐标
 * @returns 经纬度坐标
 */
export function cartesianToLatLng(point: Point3D): LatLng {
  const { x, y, z } = point;
  const r = Math.sqrt(x * x + y * y + z * z);
  const lat = radToDeg(Math.asin(z / r));
  const lng = radToDeg(Math.atan2(y, x));
  const altitude = r - EARTH_RADIUS;

  return { lat, lng, altitude };
}

/**
 * 工程坐标转三维坐标
 * 支持平移、旋转、缩放变换
 * @param engineeringPoint 工程坐标点
 * @param params 转换参数
 * @returns 三维坐标点
 */
export function engineeringTo3D(
  engineeringPoint: Point3D,
  params: CoordinateTransformParams = {}
): Point3D {
  const {
    offsetX = 0,
    offsetY = 0,
    offsetZ = 0,
    rotationX = 0,
    rotationY = 0,
    rotationZ = 0,
    scale = 1,
  } = params;

  let { x, y, z } = engineeringPoint;

  x *= scale;
  y *= scale;
  z *= scale;

  if (rotationX !== 0) {
    const rad = degToRad(rotationX);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const newY = y * cos - z * sin;
    const newZ = y * sin + z * cos;
    y = newY;
    z = newZ;
  }

  if (rotationY !== 0) {
    const rad = degToRad(rotationY);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const newX = x * cos + z * sin;
    const newZ = -x * sin + z * cos;
    x = newX;
    z = newZ;
  }

  if (rotationZ !== 0) {
    const rad = degToRad(rotationZ);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const newX = x * cos - y * sin;
    const newY = x * sin + y * cos;
    x = newX;
    y = newY;
  }

  return {
    x: x + offsetX,
    y: y + offsetY,
    z: z + offsetZ,
  };
}

/**
 * 三维坐标转工程坐标
 * 是 engineeringTo3D 的逆变换
 * @param point3D 三维坐标点
 * @param params 转换参数（与正向变换相同）
 * @returns 工程坐标点
 */
export function threeDToEngineering(
  point3D: Point3D,
  params: CoordinateTransformParams = {}
): Point3D {
  const {
    offsetX = 0,
    offsetY = 0,
    offsetZ = 0,
    rotationX = 0,
    rotationY = 0,
    rotationZ = 0,
    scale = 1,
  } = params;

  let x = point3D.x - offsetX;
  let y = point3D.y - offsetY;
  let z = point3D.z - offsetZ;

  if (rotationZ !== 0) {
    const rad = -degToRad(rotationZ);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const newX = x * cos - y * sin;
    const newY = x * sin + y * cos;
    x = newX;
    y = newY;
  }

  if (rotationY !== 0) {
    const rad = -degToRad(rotationY);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const newX = x * cos + z * sin;
    const newZ = -x * sin + z * cos;
    x = newX;
    z = newZ;
  }

  if (rotationX !== 0) {
    const rad = -degToRad(rotationX);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const newY = y * cos - z * sin;
    const newZ = y * sin + z * cos;
    y = newY;
    z = newZ;
  }

  return {
    x: x / scale,
    y: y / scale,
    z: z / scale,
  };
}

/**
 * 计算两点之间的距离
 */
export function distance(p1: Point3D, p2: Point3D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 向量加法
 */
export function addVectors(p1: Point3D, p2: Point3D): Point3D {
  return {
    x: p1.x + p2.x,
    y: p1.y + p2.y,
    z: p1.z + p2.z,
  };
}

/**
 * 向量减法
 */
export function subtractVectors(p1: Point3D, p2: Point3D): Point3D {
  return {
    x: p1.x - p2.x,
    y: p1.y - p2.y,
    z: p1.z - p2.z,
  };
}

/**
 * 向量标量乘法
 */
export function scaleVector(p: Point3D, scalar: number): Point3D {
  return {
    x: p.x * scalar,
    y: p.y * scalar,
    z: p.z * scalar,
  };
}

/**
 * 向量归一化
 */
export function normalizeVector(p: Point3D): Point3D {
  const len = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return {
    x: p.x / len,
    y: p.y / len,
    z: p.z / len,
  };
}

/**
 * 向量点积
 */
export function dotProduct(p1: Point3D, p2: Point3D): number {
  return p1.x * p2.x + p1.y * p2.y + p1.z * p2.z;
}

/**
 * 向量叉积
 */
export function crossProduct(p1: Point3D, p2: Point3D): Point3D {
  return {
    x: p1.y * p2.z - p1.z * p2.y,
    y: p1.z * p2.x - p1.x * p2.z,
    z: p1.x * p2.y - p1.y * p2.x,
  };
}

export default {
  latLngToCartesian,
  cartesianToLatLng,
  engineeringTo3D,
  threeDToEngineering,
  distance,
  addVectors,
  subtractVectors,
  scaleVector,
  normalizeVector,
  dotProduct,
  crossProduct,
  degToRad,
  radToDeg,
};
