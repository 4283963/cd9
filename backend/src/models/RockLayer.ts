import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('rock_layers')
export class RockLayer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'double', name: 'start_depth' })
  startDepth!: number;

  @Column({ type: 'double', name: 'end_depth' })
  endDepth!: number;

  @Column({ type: 'varchar', length: 50 })
  rockType!: string;

  @Column({ type: 'double', nullable: true })
  hardness?: number;

  @Column({ type: 'double', name: 'elastic_modulus', nullable: true })
  elasticModulus?: number;

  @Column({ type: 'double', name: 'poisson_ratio', nullable: true })
  poissonRatio?: number;

  @Column({ type: 'double', name: 'density', nullable: true })
  density?: number;

  @Column({ type: 'text', nullable: true })
  description?: string;
}

export interface IRockLayer {
  id?: number;
  name: string;
  startDepth: number;
  endDepth: number;
  rockType: string;
  hardness?: number;
  elasticModulus?: number;
  poissonRatio?: number;
  density?: number;
  description?: string;
}
