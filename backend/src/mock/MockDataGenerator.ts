import {
  getSensorService,
  getTBMService,
  getRockLayerService,
  getGroundWaterService,
  getRealtimeDataService,
} from '../services';
import { wsManager } from '../websocket';
import { ISensorData, ITBMStatus, IRockLayer, IGroundWater } from '../models';

export interface MockConfig {
  enabled: boolean;
  interval: number;
  sensorCount: number;
  tunnelLength: number;
  tunnelRadius: number;
  excavationSpeed: number;
}

class MockDataGenerator {
  private config: MockConfig = {
    enabled: true,
    interval: 1000,
    sensorCount: 20,
    tunnelLength: 1000,
    tunnelRadius: 5,
    excavationSpeed: 0.02,
  };

  private timer: NodeJS.Timeout | null = null;
  private tbmPosition = 0;
  private isRunning = false;

  constructor() {}

  configure(config: Partial<MockConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): MockConfig {
    return { ...this.config };
  }

  async initialize(): Promise<void> {
    await this.initializeRockLayers();
    await this.initializeGroundWater();
    await this.initializeTBMStatus();
  }

  private async initializeRockLayers(): Promise<void> {
    const rockLayerService = getRockLayerService();
    const count = await rockLayerService.getRockLayerCount();

    if (count > 0) {
      console.log('Rock layers already exist, skipping initialization');
      return;
    }

    const rockLayers: IRockLayer[] = [
      {
        name: '表土层',
        startDepth: 0,
        endDepth: 30,
        rockType: '粘土',
        hardness: 20,
        elasticModulus: 30,
        poissonRatio: 0.35,
        density: 1.9,
        description: '松散表土层，含少量砾石',
      },
      {
        name: '风化岩层',
        startDepth: 30,
        endDepth: 80,
        rockType: '风化砂岩',
        hardness: 45,
        elasticModulus: 15,
        poissonRatio: 0.28,
        density: 2.3,
        description: '强风化至中风化砂岩',
      },
      {
        name: '砂岩层',
        startDepth: 80,
        endDepth: 200,
        rockType: '砂岩',
        hardness: 70,
        elasticModulus: 35,
        poissonRatio: 0.22,
        density: 2.6,
        description: '中粗粒砂岩，较坚硬',
      },
      {
        name: '泥岩层',
        startDepth: 200,
        endDepth: 350,
        rockType: '泥岩',
        hardness: 55,
        elasticModulus: 20,
        poissonRatio: 0.30,
        density: 2.5,
        description: '泥岩夹粉砂岩',
      },
      {
        name: '石灰岩层',
        startDepth: 350,
        endDepth: 500,
        rockType: '石灰岩',
        hardness: 85,
        elasticModulus: 50,
        poissonRatio: 0.20,
        density: 2.7,
        description: '致密石灰岩，局部岩溶发育',
      },
      {
        name: '砂岩层II',
        startDepth: 500,
        endDepth: 700,
        rockType: '砂岩',
        hardness: 75,
        elasticModulus: 40,
        poissonRatio: 0.21,
        density: 2.65,
        description: '细粒砂岩，胶结良好',
      },
      {
        name: '板岩层',
        startDepth: 700,
        endDepth: 1000,
        rockType: '板岩',
        hardness: 90,
        elasticModulus: 55,
        poissonRatio: 0.18,
        density: 2.8,
        description: '变质板岩，坚硬完整',
      },
    ];

    await rockLayerService.addRockLayers(rockLayers);
    console.log(`Initialized ${rockLayers.length} rock layers`);
  }

  private async initializeGroundWater(): Promise<void> {
    const groundWaterService = getGroundWaterService();
    const existing = await groundWaterService.getAllGroundWaterData();

    if (existing.length > 0) {
      console.log('Ground water data already exists, skipping initialization');
      return;
    }

    const groundWaterData: IGroundWater[] = [];
    const zones = ['A', 'B', 'C', 'D'];

    for (let i = 0; i < 50; i++) {
      const x = Math.random() * this.config.tunnelLength;
      const y = (Math.random() - 0.5) * 20;
      const z = -50 - Math.random() * 500;
      const zoneId = `zone_${zones[Math.floor(Math.random() * zones.length)]}`;

      groundWaterData.push({
        x,
        y,
        z,
        waterLevel: -30 - Math.random() * 100,
        waterPressure: 0.5 + Math.random() * 3,
        flowRate: 0.1 + Math.random() * 2,
        zoneId,
        permeability: 0.001 + Math.random() * 0.1,
        timestamp: Date.now(),
      });
    }

    await groundWaterService.addGroundWaterDataBatch(groundWaterData);
    console.log(`Initialized ${groundWaterData.length} groundwater data points`);
  }

  private async initializeTBMStatus(): Promise<void> {
    const tbmService = getTBMService();
    const currentStatus = await tbmService.getCurrentStatus();

    if (currentStatus) {
      this.tbmPosition = currentStatus.totalDistance || 0;
      console.log(`TBM already initialized at position: ${this.tbmPosition.toFixed(2)}m`);
      return;
    }

    const initialStatus: ITBMStatus = {
      timestamp: Date.now(),
      positionX: 0,
      positionY: 0,
      positionZ: -20,
      excavationSpeed: 0.02,
      cutterHeadSpeed: 5,
      thrustForce: 10000,
      torque: 5000,
      pitch: 0,
      yaw: 0,
      roll: 0,
      totalDistance: 0,
    };

    await tbmService.updateStatus(initialStatus);
    console.log('Initialized TBM status');
  }

  start(): void {
    if (this.isRunning) {
      console.log('Mock data generator is already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('Mock data generator is disabled');
      return;
    }

    this.isRunning = true;
    console.log(`Starting mock data generator with interval ${this.config.interval}ms`);

    this.timer = setInterval(() => {
      this.generateData().catch((error) => {
        console.error('Error generating mock data:', error);
      });
    }, this.config.interval);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('Mock data generator stopped');
  }

  private async generateData(): Promise<void> {
    await this.generateSensorData();
    await this.updateTBMStatus();
    await this.broadcastRealtimeData();
  }

  private async broadcastRealtimeData(): Promise<void> {
    try {
      const realtimeDataService = getRealtimeDataService();
      const realtimeData = await realtimeDataService.getRealtimeData();

      wsManager.broadcast({
        type: 'realtime',
        data: realtimeData,
        timestamp: Date.now(),
      });

      wsManager.broadcast({
        type: 'tbm-status',
        data: realtimeData.tbmStatus,
        timestamp: Date.now(),
      });

      wsManager.broadcast({
        type: 'stress-data',
        data: realtimeData.stressData,
        timestamp: Date.now(),
      });

      wsManager.broadcast({
        type: 'groundwater',
        data: realtimeData.groundWater,
        timestamp: Date.now(),
      });

      wsManager.broadcast({
        type: 'rocklayers',
        data: realtimeData.rockLayers,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error broadcasting realtime data:', error);
    }
  }

  private async generateSensorData(): Promise<void> {
    const sensorService = getSensorService();
    const sensorDataList: ISensorData[] = [];

    const now = Date.now();

    for (let i = 0; i < this.config.sensorCount; i++) {
      const angle = (i / this.config.sensorCount) * Math.PI * 2;
      const radius = this.config.tunnelRadius * (0.8 + Math.random() * 0.2);

      const x = this.tbmPosition + (Math.random() - 0.5) * 20;
      const y = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const z = -20 + Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;

      const depth = Math.abs(z);
      const baseStress = 30 + depth * 0.15;
      const baseWaterPressure = depth * 0.01;

      const stressVariation = Math.sin(now / 5000 + i) * 10;
      const tempVariation = Math.sin(now / 10000 + i * 0.5) * 2;

      const sensorData: ISensorData = {
        timestamp: now,
        x,
        y,
        z,
        stress: baseStress + stressVariation + (Math.random() - 0.5) * 0.3,
        waterPressure: baseWaterPressure + (Math.random() - 0.5) * 0.2,
        temperature: 20 + depth * 0.03 + tempVariation + (Math.random() - 0.5) * 0.5,
        sensorId: `sensor_${String(i + 1).padStart(3, '0')}`,
        sensorType: i % 3 === 0 ? 'stress' : i % 3 === 1 ? 'water' : 'temperature',
      };

      sensorDataList.push(sensorData);
    }

    await sensorService.addSensorDataBatch(sensorDataList);

    wsManager.broadcast({
      type: 'sensor_data',
      data: sensorDataList,
      timestamp: now,
    });
  }

  private async updateTBMStatus(): Promise<void> {
    const tbmService = getTBMService();

    this.tbmPosition += this.config.excavationSpeed;

    if (this.tbmPosition > this.config.tunnelLength) {
      this.tbmPosition = 0;
    }

    const now = Date.now();
    const speedVariation = Math.sin(now / 3000) * 0.005;
    const cutterHeadVariation = Math.sin(now / 4000) * 1;

    const status: ITBMStatus = {
      timestamp: now,
      positionX: this.tbmPosition,
      positionY: 0 + Math.sin(now / 15000) * 0.5,
      positionZ: -20 + Math.sin(now / 20000) * 1,
      excavationSpeed: this.config.excavationSpeed + speedVariation,
      cutterHeadSpeed: 5 + cutterHeadVariation,
      thrustForce: 10000 + Math.sin(now / 8000) * 2000,
      torque: 5000 + Math.sin(now / 6000) * 1000,
      pitch: Math.sin(now / 25000) * 0.3,
      yaw: Math.sin(now / 30000) * 0.2,
      roll: Math.sin(now / 10000) * 0.1,
      totalDistance: this.tbmPosition,
    };

    const savedStatus = await tbmService.updateStatus(status);
    tbmService.setCurrentStatus(savedStatus);

    wsManager.broadcast({
      type: 'tbm_status',
      data: status,
      timestamp: now,
    });
  }

  getRunningStatus(): boolean {
    return this.isRunning;
  }

  getTBMPosition(): number {
    return this.tbmPosition;
  }
}

const mockDataGenerator = new MockDataGenerator();

export default mockDataGenerator;
export { MockDataGenerator };
