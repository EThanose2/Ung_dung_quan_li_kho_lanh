import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// 1. Cắm RAM (Import cái MqttService ông vừa tạo)
import { MqttService } from './mqtt/mqtt.service';

// 2. Cắm Ổ Cứng (Import 6 cái file Database hôm bữa)
import { User } from './entities/user.entity';
import { StorageArea } from './entities/storage-area.entity';
import { Device } from './entities/device.entity';
import { SensorReading } from './entities/sensor-reading.entity';
import { AreaThreshold } from './entities/area-threshold.entity';
import { ActionLog } from './entities/action-log.entity';

import { AppController } from './app.controller';

@Module({
  imports: [
    // 3. Khởi động nguồn kết nối thẳng vô MySQL (XAMPP)
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root', // Mặc định của XAMPP
      password: '', // Mặc định của XAMPP để trống
      database: 'iot_kho_lanh', // Tên DB trên phpMyAdmin

      // Khai báo 6 cái bảng cho TypeORM
      entities: [
        User,
        StorageArea,
        Device,
        SensorReading,
        AreaThreshold,
        ActionLog,
      ],

      // False khi đã có sẵn database không cần tạo lại
      synchronize: false,
    }),

    //Cấp quyền cho service với 3 bảng này
    TypeOrmModule.forFeature([SensorReading, ActionLog, Device]),
  ],
  controllers: [AppController],
  providers: [
    MqttService, // 4. Gắn MqttService vào đây để khi bật server, nó tự động chạy nhận thông tin liên tục từ Adafruit
  ],
})
export class AppModule {}
