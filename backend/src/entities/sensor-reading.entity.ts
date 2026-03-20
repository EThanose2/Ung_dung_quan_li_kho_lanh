import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Device } from './device.entity';

@Entity('SENSOR_READINGS')
export class SensorReading {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('float')
  reading_value: number; // Lưu con số như 30.5, 60...

  @CreateDateColumn()
  recorded_at: Date;

  // Khóa ngoại: device_id nối với bảng DEVICES
  @ManyToOne(() => Device, (device) => device.readings)
  @JoinColumn({ name: 'device_id' })
  device: Device;
}
