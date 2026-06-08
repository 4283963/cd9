export interface TBMPosition {
  x: number
  y: number
  z: number
  pitch: number
  yaw: number
  roll: number
}

export interface TBMStatus {
  mileage: number
  speed: number
  cutterSpeed: number
  thrust: number
  torque: number
  position: TBMPosition
}

export interface StressData {
  segmentId: number
  position: number
  maxStress: number
  minStress: number
  avgStress: number
  stressDistribution: number[]
}

export interface RockLayer {
  name: string
  depth: number
  thickness: number
  hardness: number
  color: string
}

export interface GroundWaterData {
  waterLevel: number
  waterPressure: number
  pressureDistribution: number[][]
}

export interface TunnelSegmentData {
  id: number
  startMileage: number
  endMileage: number
  radius: number
  shape: 'circular' | 'horseshoe'
  stressData: number[]
}

export interface RealTimeData {
  timestamp: number
  tbmStatus: TBMStatus
  stressData: StressData
  groundWater: GroundWaterData
  rockLayers: RockLayer[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
}

export interface ConnectionStatus {
  connected: boolean
  lastMessageTime: number | null
  error: string | null
}
