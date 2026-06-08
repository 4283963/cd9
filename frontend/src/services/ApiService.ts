import { ApiResponse, TBMStatus, StressData, GroundWaterData, RockLayer, TunnelSegmentData } from '../types'

export class ApiService {
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url
  }

  public getBaseUrl(): string {
    return this.baseUrl
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      })

      const result = await response.json()
      
      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error || result.message || `HTTP ${response.status}`
        }
      }

      return {
        success: true,
        data: result.data as T
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  public async getTBMStatus(): Promise<ApiResponse<TBMStatus>> {
    return this.request<TBMStatus>('/api/realtime/tbm')
  }

  public async getStressData(segmentId?: number): Promise<ApiResponse<StressData>> {
    return this.request<StressData>('/api/realtime/stress')
  }

  public async getGroundWaterData(): Promise<ApiResponse<GroundWaterData>> {
    return this.request<GroundWaterData>('/api/realtime/groundwater')
  }

  public async getRockLayers(): Promise<ApiResponse<RockLayer[]>> {
    return this.request<RockLayer[]>('/api/realtime/rocklayers')
  }

  public async getRealtimeData(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/realtime')
  }

  public async getTunnelSegments(): Promise<ApiResponse<TunnelSegmentData[]>> {
    return this.request<TunnelSegmentData[]>('/api/tunnel/segments')
  }

  public async getTunnelSegment(id: number): Promise<ApiResponse<TunnelSegmentData>> {
    return this.request<TunnelSegmentData>(`/api/tunnel/segments/${id}`)
  }

  public async getHistoryData(startTime: number, endTime: number): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/history?start=${startTime}&end=${endTime}`)
  }

  public async getAlerts(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/alerts')
  }

  public async postCommand(command: string, params: any = {}): Promise<ApiResponse<any>> {
    return this.request<any>('/api/command', {
      method: 'POST',
      body: JSON.stringify({ command, params })
    })
  }
}
