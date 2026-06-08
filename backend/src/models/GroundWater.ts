import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('ground_water')
export class GroundWater {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'bigint', nullable: true })
  timestamp?: number;

  @Column({ type: 'double' })
  x!: number;

  @Column({ type: 'double' })
  y!: number;

  @Column({ type: 'double' })
  z!: number;

  @Column({ type: 'double', name: 'water_level' })
  waterLevel!: number;

  @Column({ type: 'double', name: 'water_pressure' })
  waterPressure!: number;

  @Column({ type: 'double', name: 'flow_rate', nullable: true })
  flowRate?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  zoneId?: string;

  @Column({ type: 'double', name: 'permeability', nullable: true })
  permeability?: number;
}

export interface IGroundWater {
  id?: number;
  timestamp?: number;
  x: number;
  y: number;
  z: number;
  waterLevel: number;
  waterPressure: number;
  flowRate?: number;
  zoneId?: string;
  permeability?: number;
}
