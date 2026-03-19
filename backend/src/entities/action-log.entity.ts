import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Device } from './device.entity';

@Entity('ACTION_LOGS')
export class ActionLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  action_type: string; // VD: 'AUTO_ALERT' hoặc 'MANUAL_CONTROL'

  @Column({ length: 100 })
  action_value: string; // VD: 'Bật quạt do nhiệt độ cao', 'Nhân viên tự tắt đèn'

  @CreateDateColumn()
  created_at: Date;

  // Khóa ngoại: user_id - người thực hiện
  @ManyToOne(() => User, (user) => user.action_logs, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Khóa ngoại: device_id Thông tin thiết bị
  @ManyToOne(() => Device, (device) => device.action_logs)
  @JoinColumn({ name: 'device_id' })
  device: Device;
}
