import { DataSource } from 'typeorm';
import { SensorData } from './models/SensorData';
import { TBMStatus } from './models/TBMStatus';
import { RockLayer } from './models/RockLayer';
import { GroundWater } from './models/GroundWater';
import * as dotenv from 'dotenv';

dotenv.config();

let dataSource: DataSource | null = null;

export async function initializeDatabase(): Promise<DataSource> {
  const dbMode = process.env.DB_MODE || 'memory';

  if (dbMode === 'mysql') {
    dataSource = new DataSource({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tunnel_digital_twin',
      entities: [SensorData, TBMStatus, RockLayer, GroundWater],
      synchronize: true,
      logging: false,
    });
  } else {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [SensorData, TBMStatus, RockLayer, GroundWater],
      synchronize: true,
      logging: false,
    });
  }

  await dataSource.initialize();
  console.log(`Database initialized in ${dbMode} mode`);
  return dataSource;
}

export function getDataSource(): DataSource {
  if (!dataSource) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return dataSource;
}

export async function closeDatabase(): Promise<void> {
  if (dataSource) {
    await dataSource.destroy();
    dataSource = null;
  }
}
