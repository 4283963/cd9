import * as THREE from 'three'
import { SceneManager } from './core/SceneManager'
import { Tunnel } from './objects/Tunnel'
import { TBM } from './objects/TBM'
import { RockLayers } from './objects/RockLayers'
import { GroundWater } from './objects/GroundWater'
import { DataManager } from './services/DataManager'
import { CoordinateTransformer, radToDeg, degToRad } from './math/coordinate'
import { RealTimeData } from './types'
import { formatNumber, formatTime } from './utils/mock'

export class App {
  private sceneManager: SceneManager
  private tunnel: Tunnel
  private tbm: TBM
  private rockLayers: RockLayers
  private groundWater: GroundWater
  private dataManager: DataManager
  private coordTransformer: CoordinateTransformer
  private lastTunnelLength: number = 0
  private segmentLength: number = 10
  private fps: number = 60
  private frameCount: number = 0
  private lastFpsUpdate: number = 0

  constructor() {
    this.sceneManager = new SceneManager('scene-canvas')

    this.coordTransformer = new CoordinateTransformer({
      origin: { x: 0, y: 0, z: 0 },
      scale: 1,
      rotationY: 0
    })

    this.tunnel = new Tunnel({
      radius: 5,
      shape: 'circular'
    })

    this.tbm = new TBM({
      radius: 4.5,
      length: 15
    })

    this.rockLayers = new RockLayers({
      width: 100,
      length: 500
    })

    this.groundWater = new GroundWater({
      width: 100,
      length: 500,
      waterLevel: -15
    })

    this.dataManager = new DataManager(
      'ws://localhost:3001',
      'http://localhost:3001',
      true
    )

    this.init()
  }

  private async init(): Promise<void> {
    this.sceneManager.scene.add(this.tunnel.group)
    this.sceneManager.scene.add(this.tbm.group)
    this.sceneManager.scene.add(this.rockLayers.group)
    this.sceneManager.scene.add(this.groundWater.group)

    this.setupLights()
    this.setupControls()
    this.setupDataCallbacks()
    this.setupAnimation()

    const initialData = this.dataManager.getCurrentData()
    if (initialData) {
      this.initializeFromData(initialData)
      this.updateUI(initialData)
    } else {
      this.tbm.setPosition(0, -20, 0)
      this.tbm.setCutterHeadSpeed(3)
      for (let i = 0; i < 10; i++) {
        this.tunnel.addSegment(this.segmentLength)
      }
      this.lastTunnelLength = 10 * this.segmentLength
    }

    if (!this.dataManager.isMockMode()) {
      try {
        await this.dataManager.connect()
      } catch (error) {
        console.warn('[App] Failed to connect to backend, using fallback data')
      }
    }

    this.setView('side')
  }

  private initializeFromData(data: RealTimeData): void {
    const pos = data.tbmStatus.position
    const worldPos = this.coordTransformer.toWorld(pos)

    this.tbm.setPosition(worldPos.x, worldPos.y, worldPos.z)
    this.tbm.setCutterHeadSpeed(data.tbmStatus.cutterSpeed)

    const initialSegments = Math.max(10, Math.ceil(data.tbmStatus.mileage / this.segmentLength) + 5)
    for (let i = 0; i < initialSegments; i++) {
      this.tunnel.addSegment(this.segmentLength)
    }
    this.lastTunnelLength = initialSegments * this.segmentLength

    if (data.stressData?.stressDistribution) {
      this.tunnel.updateStressData(data.stressData.stressDistribution)
    }

    if (data.groundWater) {
      this.groundWater.setWaterLevel(data.groundWater.waterLevel)
      if (data.groundWater.pressureDistribution) {
        this.groundWater.setPressureData(data.groundWater.pressureDistribution)
      }
    }
  }

  private setupLights(): void {
    const tbmLight = this.sceneManager.addPointLight(
      0, -20, 0,
      0xffffaa, 1, 50
    )
    this.tbm.group.add(tbmLight)
    tbmLight.position.set(0, 0, -5)
  }

  private setupControls(): void {
    const btnTBMView = document.getElementById('btn-tbm-view')
    const btnSideView = document.getElementById('btn-side-view')
    const btnTopView = document.getElementById('btn-top-view')
    const btnToggleLayers = document.getElementById('btn-toggle-layers')
    const btnToggleWater = document.getElementById('btn-toggle-water')

    const buttons = [btnTBMView, btnSideView, btnTopView]
    
    const setActive = (activeBtn: HTMLElement) => {
      buttons.forEach(btn => {
        if (btn) btn.classList.remove('active')
      })
      if (activeBtn) activeBtn.classList.add('active')
    }

    btnTBMView?.addEventListener('click', () => {
      setActive(btnTBMView)
      this.setView('tbm')
    })

    btnSideView?.addEventListener('click', () => {
      setActive(btnSideView)
      this.setView('side')
    })

    btnTopView?.addEventListener('click', () => {
      setActive(btnTopView)
      this.setView('top')
    })

    btnToggleLayers?.addEventListener('click', () => {
      this.rockLayers.toggle()
      btnToggleLayers.classList.toggle('active')
    })

    btnToggleWater?.addEventListener('click', () => {
      this.groundWater.toggle()
      btnToggleWater.classList.toggle('active')
    })
  }

  private setView(view: string): void {
    const tbmPos = this.tbm.getPosition()
    
    switch (view) {
      case 'tbm':
        this.sceneManager.setCameraPosition(
          tbmPos.x + 20,
          tbmPos.y + 15,
          tbmPos.z + 20
        )
        this.sceneManager.setCameraTarget(tbmPos.x, tbmPos.y, tbmPos.z)
        break
      case 'side':
        this.sceneManager.setCameraPosition(
          tbmPos.x + 60,
          tbmPos.y + 10,
          tbmPos.z
        )
        this.sceneManager.setCameraTarget(tbmPos.x, tbmPos.y, tbmPos.z)
        break
      case 'top':
        this.sceneManager.setCameraPosition(
          tbmPos.x,
          tbmPos.y + 80,
          tbmPos.z
        )
        this.sceneManager.setCameraTarget(tbmPos.x, tbmPos.y, tbmPos.z)
        break
    }
  }

  private setupDataCallbacks(): void {
    this.dataManager.onUpdate((data: RealTimeData) => {
      this.updateFromData(data)
      this.updateUI(data)
    })
  }

  private updateFromData(data: RealTimeData): void {
    const pos = data.tbmStatus.position
    const worldPos = this.coordTransformer.toWorld(pos)
    
    this.tbm.setPosition(worldPos.x, worldPos.y, worldPos.z)
    this.tbm.setRotation(
      degToRad(pos.pitch),
      degToRad(pos.yaw),
      degToRad(pos.roll)
    )
    this.tbm.setCutterHeadSpeed(data.tbmStatus.cutterSpeed)

    this.tunnel.updateStressData(data.stressData.stressDistribution)

    if (data.tbmStatus.mileage > this.lastTunnelLength) {
      const segmentsToAdd = Math.floor(
        (data.tbmStatus.mileage - this.lastTunnelLength) / this.segmentLength
      )
      for (let i = 0; i < segmentsToAdd; i++) {
        this.tunnel.addSegment(this.segmentLength)
      }
      this.lastTunnelLength += segmentsToAdd * this.segmentLength

      if (this.lastTunnelLength > 400) {
        this.rockLayers.updateLength(Math.max(500, this.lastTunnelLength + 100))
        this.groundWater.updateLength(Math.max(500, this.lastTunnelLength + 100))
      }
    }

    if (data.groundWater) {
      this.groundWater.setWaterLevel(data.groundWater.waterLevel)
      if (data.groundWater.pressureDistribution) {
        this.groundWater.setPressureData(data.groundWater.pressureDistribution)
      }
    }
  }

  private updateUI(data: RealTimeData): void {
    const mileageEl = document.getElementById('mileage')
    const speedEl = document.getElementById('speed')
    const cutterSpeedEl = document.getElementById('cutter-speed')
    const thrustEl = document.getElementById('thrust')
    const maxStressEl = document.getElementById('max-stress')
    const minStressEl = document.getElementById('min-stress')
    const avgStressEl = document.getElementById('avg-stress')
    const posXEl = document.getElementById('pos-x')
    const posYEl = document.getElementById('pos-y')
    const posZEl = document.getElementById('pos-z')
    const pitchEl = document.getElementById('pitch')
    const yawEl = document.getElementById('yaw')
    const waterLevelEl = document.getElementById('water-level')
    const waterPressureEl = document.getElementById('water-pressure')
    const rockTypeEl = document.getElementById('rock-type')
    const rockHardnessEl = document.getElementById('rock-hardness')
    const connectionStatusEl = document.getElementById('connection-status')
    const systemTimeEl = document.getElementById('system-time')

    if (mileageEl) mileageEl.textContent = formatNumber(data.tbmStatus.mileage, 2) + ' m'
    if (speedEl) speedEl.textContent = formatNumber(data.tbmStatus.speed, 2) + ' m/min'
    if (cutterSpeedEl) cutterSpeedEl.textContent = formatNumber(data.tbmStatus.cutterSpeed, 2) + ' rpm'
    if (thrustEl) thrustEl.textContent = formatNumber(data.tbmStatus.thrust, 0) + ' kN'

    if (maxStressEl) maxStressEl.textContent = formatNumber(data.stressData.maxStress, 1) + ' MPa'
    if (minStressEl) minStressEl.textContent = formatNumber(data.stressData.minStress, 1) + ' MPa'
    if (avgStressEl) avgStressEl.textContent = formatNumber(data.stressData.avgStress, 1) + ' MPa'

    if (posXEl) posXEl.textContent = formatNumber(data.tbmStatus.position.x, 2) + ' m'
    if (posYEl) posYEl.textContent = formatNumber(data.tbmStatus.position.y, 2) + ' m'
    if (posZEl) posZEl.textContent = formatNumber(data.tbmStatus.position.z, 2) + ' m'
    if (pitchEl) pitchEl.textContent = formatNumber(data.tbmStatus.position.pitch, 2) + '°'
    if (yawEl) yawEl.textContent = formatNumber(data.tbmStatus.position.yaw, 2) + '°'

    if (waterLevelEl) waterLevelEl.textContent = formatNumber(data.groundWater.waterLevel, 2) + ' m'
    if (waterPressureEl) waterPressureEl.textContent = formatNumber(data.groundWater.waterPressure, 3) + ' MPa'

    if (data.rockLayers && data.rockLayers.length > 0) {
      const currentDepth = data.tbmStatus.position.y
      const currentLayer = data.rockLayers.find(
        layer => currentDepth <= layer.depth && currentDepth >= layer.depth - layer.thickness
      )
      if (rockTypeEl) rockTypeEl.textContent = currentLayer?.name || '未知'
      if (rockHardnessEl) rockHardnessEl.textContent = formatNumber(currentLayer?.hardness || 0, 0) + ' MPa'
    }

    const status = this.dataManager.getConnectionStatus()
    if (connectionStatusEl) {
      connectionStatusEl.textContent = status.connected ? '已连接' : '已断开'
      const dot = connectionStatusEl.previousElementSibling
      if (dot) {
        dot.className = 'status-dot ' + (status.connected ? 'connected' : 'disconnected')
      }
    }

    if (systemTimeEl) {
      systemTimeEl.textContent = '系统时间: ' + formatTime(Date.now())
    }
  }

  private setupAnimation(): void {
    this.sceneManager.addAnimationCallback((delta: number) => {
      this.tbm.update(delta)
      this.groundWater.update(delta)
      this.updateFPS(delta)
      this.updateCameraFollow()
    })

    this.sceneManager.startAnimation()
  }

  private updateFPS(delta: number): void {
    this.frameCount++
    const now = performance.now()
    
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round(this.frameCount * 1000 / (now - this.lastFpsUpdate))
      this.frameCount = 0
      this.lastFpsUpdate = now

      const fpsEl = document.getElementById('fps')
      if (fpsEl) {
        fpsEl.textContent = 'FPS: ' + this.fps
      }
    }
  }

  private updateCameraFollow(): void {
    const tbmPos = this.tbm.getPosition()
    const camera = this.sceneManager.camera
    
    const offset = new THREE.Vector3(
      camera.position.x - this.sceneManager.controls.target.x,
      camera.position.y - this.sceneManager.controls.target.y,
      camera.position.z - this.sceneManager.controls.target.z
    )

    const targetPos = new THREE.Vector3(
      tbmPos.x + offset.x,
      tbmPos.y + offset.y,
      tbmPos.z + offset.z
    )

    camera.position.lerp(targetPos, 0.02)
    this.sceneManager.controls.target.lerp(tbmPos, 0.02)
  }

  public start(): void {
    console.log('Tunnel Digital Twin System started')
  }

  public dispose(): void {
    this.dataManager.disconnect()
    this.tunnel.dispose()
    this.tbm.dispose()
    this.rockLayers.dispose()
    this.groundWater.dispose()
    this.sceneManager.dispose()
  }
}
