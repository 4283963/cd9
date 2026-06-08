import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('tbm_status')
export class TBMStatus {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'bigint' })
  timestamp!: number;

  @Column({ type: 'double', name: 'position_x' })
  positionX!: number;

  @Column({ type: 'double', name: 'position_y' })
  positionY!: number;

  @Column({ type: 'double', name: 'position_z' })
  positionZ!: number;

  @Column({ type: 'double', name: 'excavation_speed' })
  excavationSpeed!: number;

  @Column({ type: 'double', name: 'cutter_head_speed' })
  cutterHeadSpeed!: number;

  @Column({ type: 'double', name: 'thrust_force' })
  thrustForce!: number;

  @Column({ type: 'double', name: 'torque' })
  torque!: number;

  @Column({ type: 'double', nullable: true })
  pitch?: number;

  @Column({ type: 'double', nullable: true })
  yaw?: number;

  @Column({ type: 'double', nullable: true })
  roll?: number;

  @Column({ type: 'double', name: 'total_distance', default: 0 })
  totalDistance!: number;
}

export interface ITBMStatus {
  id?: number;
  timestamp: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  excavationSpeed: number;
  cutterHeadSpeed: number;
  thrustForce: number;
  torque: number;
  pitch?: number;
  yaw?: number;
  roll?: number;
  totalDistance?: number;
}
