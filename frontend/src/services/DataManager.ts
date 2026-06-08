import { WebSocketService } from './WebSocketService'
import { ApiService } from './ApiService'
import { RealTimeData, TBMStatus, StressData, GroundWaterData, RockLayer, ConnectionStatus } from '../types'
import { generateMockData } from '../utils/mock'

export type DataUpdateCallback = (data: RealTimeData) => void

export class DataManager {
  private wsService: WebSocketService
  private apiService: ApiService
  private mockMode: boolean
  private mockInterval: number | null = null
  private mockData: RealTimeData
  private updateCallbacks: DataUpdateCallback[] = []
  private cache: {
    tbmStatus: TBMStatus | null
    stressData: StressData | null
    groundWater: GroundWaterData | null
    rockLayers: RockLayer[] | null
  } = {
    tbmStatus: null,
    stressData: null,
    groundWater: null,
    rockLayers: null
  }

  constructor(wsUrl?: string, apiUrl?: string, mockMode: boolean = false) {
    this.wsService = new WebSocketService(wsUrl)
    this.apiService = new ApiService(apiUrl)
    this.mockMode = mockMode
    this.mockData = generateMockData()

    if (mockMode) {
      this.startMock()
    } else {
      this.setupWebSocket()
    }
  }

  private setupWebSocket(): void {
    this.wsService.on('tbm-status', (message) => {
      this.cache.tbmStatus = message.data
      this.notifyUpdate()
    })

    this.wsService.on('stress-data', (message) => {
      this.cache.stressData = message.data
      this.notifyUpdate()
    })

    this.wsService.on('groundwater', (message) => {
      this.cache.groundWater = message.data
      this.notifyUpdate()
    })

    this.wsService.on('rocklayers', (message) => {
      this.cache.rockLayers = message.data
      this.notifyUpdate()
    })

    this.wsService.on('realtime', (message) => {
      const data = message.data as RealTimeData
      this.cache.tbmStatus = data.tbmStatus
      this.cache.stressData = data.stressData
      this.cache.groundWater = data.groundWater
      this.cache.rockLayers = data.rockLayers
      this.notifyUpdate()
    })
  }

  private startMock(): void {
    this.cache.tbmStatus = this.mockData.tbmStatus
    this.cache.stressData = this.mockData.stressData
    this.cache.groundWater = this.mockData.groundWater
    this.cache.rockLayers = this.mockData.rockLayers

    this.mockInterval = window.setInterval(() => {
      this.updateMockData()
      this.notifyUpdate()
    }, 100)
  }

  private updateMockData(): void {
    const tbm = this.mockData.tbmStatus
    tbm.mileage += tbm.speed / 60 / 10
    tbm.speed = 0.8 + Math.sin(Date.now() / 5000) * 0.2
    tbm.cutterSpeed = 3 + Math.sin(Date.now() / 3000) * 0.5
    tbm.thrust = 15000 + Math.sin(Date.now() / 7000) * 2000

    tbm.position.x = Math.sin(tbm.mileage * 0.01) * 2
    tbm.position.y = -20 + Math.sin(tbm.mileage * 0.005) * 1
    tbm.position.z = tbm.mileage
    tbm.position.pitch = Math.sin(tbm.mileage * 0.02) * 0.5
    tbm.position.yaw = Math.sin(tbm.mileage * 0.01) * 1
    tbm.position.roll = 0

    const stress = this.mockData.stressData
    stress.position = tbm.mileage
    stress.maxStress = 60 + Math.sin(Date.now() / 4000) * 20
    stress.minStress = 20 + Math.sin(Date.now() / 6000) * 10
    stress.avgStress = (stress.maxStress + stress.minStress) / 2

    for (let i = 0; i < stress.stressDistribution.length; i++) {
      const angle = (i / stress.stressDistribution.length) * Math.PI * 2
      stress.stressDistribution[i] = stress.avgStress + Math.sin(angle * 2 + Date.now() / 2000) * 15
    }

    const gw = this.mockData.groundWater
    gw.waterLevel = -15 + Math.sin(Date.now() / 10000) * 0.5
    gw.waterPressure = 0.15 + Math.sin(Date.now() / 8000) * 0.05

    this.cache.tbmStatus = { ...tbm, position: { ...tbm.position } }
    this.cache.stressData = { ...stress, stressDistribution: [...stress.stressDistribution] }
    this.cache.groundWater = { ...gw }
  }

  private notifyUpdate(): void {
    const data: RealTimeData = {
      timestamp: Date.now(),
      tbmStatus: this.cache.tbmStatus!,
      stressData: this.cache.stressData!,
      groundWater: this.cache.groundWater!,
      rockLayers: this.cache.rockLayers!
    }

    for (const callback of this.updateCallbacks) {
      try {
        callback(data)
      } catch (error) {
        console.error('[DataManager] Error in update callback:', error)
      }
    }
  }

  public onUpdate(callback: DataUpdateCallback): void {
    this.updateCallbacks.push(callback)
  }

  public offUpdate(callback: DataUpdateCallback): void {
    const index = this.updateCallbacks.indexOf(callback)
    if (index > -1) {
      this.updateCallbacks.splice(index, 1)
    }
  }

  public getCurrentData(): RealTimeData | null {
    if (!this.cache.tbmStatus) return null
    
    return {
      timestamp: Date.now(),
      tbmStatus: this.cache.tbmStatus,
      stressData: this.cache.stressData!,
      groundWater: this.cache.groundWater!,
      rockLayers: this.cache.rockLayers!
    }
  }

  public async connect(): Promise<void> {
    if (this.mockMode) return

    try {
      await this.wsService.connect()
      await this.fetchInitialData()
    } catch (error) {
      console.error('[DataManager] Connection failed:', error)
      throw error
    }
  }

  private async fetchInitialData(): Promise<void> {
    const [tbmResult, stressResult, gwResult, layersResult] = await Promise.all([
      this.apiService.getTBMStatus(),
      this.apiService.getStressData(),
      this.apiService.getGroundWaterData(),
      this.apiService.getRockLayers()
    ])

    if (tbmResult.success && tbmResult.data) {
      this.cache.tbmStatus = tbmResult.data
    }
    if (stressResult.success && stressResult.data) {
      this.cache.stressData = stressResult.data
    }
    if (gwResult.success && gwResult.data) {
      this.cache.groundWater = gwResult.data
    }
    if (layersResult.success && layersResult.data) {
      this.cache.rockLayers = layersResult.data
    }

    this.notifyUpdate()
  }

  public disconnect(): void {
    if (this.mockInterval) {
      clearInterval(this.mockInterval)
      this.mockInterval = null
    }
    this.wsService.disconnect()
  }

  public getConnectionStatus(): ConnectionStatus {
    if (this.mockMode) {
      return {
        connected: true,
        lastMessageTime: Date.now(),
        error: null
      }
    }
    return this.wsService.getStatus()
  }

  public setMockMode(enabled: boolean): void {
    if (this.mockMode === enabled) return

    this.mockMode = enabled

    if (enabled) {
      this.wsService.disconnect()
      this.startMock()
    } else {
      if (this.mockInterval) {
        clearInterval(this.mockInterval)
        this.mockInterval = null
      }
      this.connect().catch(console.error)
    }
  }

  public isMockMode(): boolean {
    return this.mockMode
  }

  public getWebSocketService(): WebSocketService {
    return this.wsService
  }

  public getApiService(): ApiService {
    return this.apiService
  }
}
