import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { StorageArea } from './storage-area.entity';
import { SensorReading } from './sensor-reading.entity';
import { ActionLog } from './action-log.entity';

@Entity('DEVICES')
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  device_code: string;

  @Column({ length: 100 })
  device_name: string; // VD: Cảm biến DHT20, Quạt thông gió

  @Column({ length: 50 })
  device_type: string; // VD: SENSOR (đo đạc) hoặc ACTUATOR (điều khiển)

  // ĐÂY NÈ! Bí kíp kết nối Adafruit của ông nằm ở đây!
  @Column({ length: 100, nullable: true })
  adafruit_feed_key: string; // VD: 'nhietdo1', 'den1'

  @Column({ default: 'ONLINE' })
  status: string;

  @Column({ default: 'AUTO' })
  control_mode: string; // AUTO hoặc MANUAL

  @Column({ default: 'OFF' })
  power_state: string; // ON hoặc OFF

  @CreateDateColumn()
  created_at: Date;

  // Khóa ngoại: area_id nối với bảng STORAGE_AREAS
  @ManyToOne(() => StorageArea, (area) => area.devices)
  @JoinColumn({ name: 'area_id' })
  area: StorageArea;

  // 1 Thiết bị gửi Nhiều Dữ liệu
  @OneToMany(() => SensorReading, (reading) => reading.device)
  readings: SensorReading[];

  // 1 Thiết bị có Nhiều Lịch sử bật/tắt
  @OneToMany(() => ActionLog, (log) => log.device)
  action_logs: ActionLog[];
}
