import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { StorageArea } from './storage-area.entity';
import { ActionLog } from './action-log.entity';

@Entity('USERS')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  username: string;

  @Column()
  password_hash: string;

  @Column({ length: 100 })
  email: string;

  @Column({ length: 20, default: 'STAFF' })
  role: string; // ADMIN hoặc STAFF

  @Column({ default: 'ACTIVE' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  // Quan hệ: 1 User quản lý Nhiều Kho (StorageArea)
  @OneToMany(() => StorageArea, (area) => area.operator)
  areas: StorageArea[];

  // Quan hệ: 1 User có Nhiều Lịch sử thao tác (ActionLog)
  @OneToMany(() => ActionLog, (log) => log.user)
  action_logs: ActionLog[];
}
