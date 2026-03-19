import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Device } from './device.entity';
import { AreaThreshold } from './area-threshold.entity';

@Entity('STORAGE_AREAS')
export class StorageArea {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  area_code: string;

  @Column({ length: 100 })
  area_name: string; // VD: Kho Thịt, Kho Rau Củ

  @Column({ length: 50 })
  area_type: string;

  @Column({ default: 'ACTIVE' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  // Khóa ngoại: operator_id nối với bảng USERS
  @ManyToOne(() => User, (user) => user.areas)
  @JoinColumn({ name: 'operator_id' })
  operator: User;

  // 1 Kho có Nhiều Thiết bị
  @OneToMany(() => Device, (device) => device.area)
  devices: Device[];

  // 1 Kho có Nhiều Ngưỡng cài đặt (Nhiệt độ, Độ ẩm)
  @OneToMany(() => AreaThreshold, (threshold) => threshold.area)
  thresholds: AreaThreshold[];
}
