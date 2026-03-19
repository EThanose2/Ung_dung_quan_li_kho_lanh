import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StorageArea } from './storage-area.entity';

@Entity('AREA_THRESHOLDS')
export class AreaThreshold {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  sensor_type: string; // VD: 'TEMP' (Nhiệt độ), 'HUMI' (Độ ẩm)

  @Column('float')
  min_value: number;

  @Column('float')
  max_value: number;

  // Khóa ngoại: area_id nối với bảng STORAGE_AREAS
  @ManyToOne(() => StorageArea, (area) => area.thresholds)
  @JoinColumn({ name: 'area_id' })
  area: StorageArea;
}
