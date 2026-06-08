import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('sensor_data')
export class SensorData {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'bigint' })
  timestamp!: number;

  @Column({ type: 'double' })
  x!: number;

  @Column({ type: 'double' })
  y!: number;

  @Column({ type: 'double' })
  z!: number;

  @Column({ type: 'double', name: 'stress' })
  stress!: number;

  @Column({ type: 'double', name: 'water_pressure' })
  waterPressure!: number;

  @Column({ type: 'double' })
  temperature!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sensorId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sensorType?: string;
}

export interface ISensorData {
  id?: number;
  timestamp: number;
  x: number;
  y: number;
  z: number;
  stress: number;
  waterPressure: number;
  temperature: number;
  sensorId?: string;
  sensorType?: string;
}
