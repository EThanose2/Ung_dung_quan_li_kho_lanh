import { Injectable, HttpException, HttpStatus,NotFoundException,
  BadRequestException,  } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from '../entities/warehouse.entity';
import { Area } from '../entities/area.entity';
import { FoodType } from '../entities/food-type.entity';
import { User } from '../entities/user.entity';
import { ActionLog } from '../entities/action-log.entity';

@Injectable()
export class FacilitiesService {
  constructor(
    @InjectRepository(Warehouse) private warehouseRepo: Repository<Warehouse>,
    @InjectRepository(Area) private areaRepo: Repository<Area>,
    @InjectRepository(FoodType) private foodTypeRepo: Repository<FoodType>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(ActionLog) private actionLogRepo: Repository<ActionLog>,
  ) {}
  private async getOperatorsByAreaIds(areaIds: number[]): Promise<any[]> {
  if (!areaIds.length) return [];
  return this.warehouseRepo.query(`
    SELECT uam.area_id, u.id as user_id, u.username, u.full_name
    FROM user_area_management uam
    INNER JOIN users u ON uam.user_id = u.id
    WHERE uam.area_id IN (${areaIds.join(',')})
  `);
}

// Helper gắn operators vào result
private attachOperators(result: any[], operatorRows: any[]): any[] {
  for (const warehouse of result) {
    for (const area of warehouse.areas) {
      area.operators = operatorRows
        .filter(o => Number(o.area_id) === area.id)
        .map(o => ({ id: o.user_id, username: o.username, full_name: o.full_name }));
    }
  }
  return result;
}
  // ================= QUẢN LÝ KHO =================

  // Dùng chung cho getAllWarehouses và getWarehouseById
  private buildWarehouseQuery(warehouseId?: number): Promise<any[]> {
  
  const whereClause = warehouseId ? `WHERE w.id = ${warehouseId}` : '';


  return this.warehouseRepo.query(`
    SELECT 
      w.id as warehouse_id, w.warehouse_name,
      a.id as area_id, a.area_name, a.auto_door_timeout_sec,
      a.operating_mode, a.manual_override_mins,
      f.id as food_id, f.food_name, f.min_temp, f.max_temp, f.min_humi, f.max_humi,
      d.id as device_id, d.device_name, d.adafruit_feed_key, d.device_type, d.status,
      sr.reading_value
      
    FROM warehouses w
    LEFT JOIN areas a ON w.id = a.warehouse_id
    LEFT JOIN area_food_types aft ON a.id = aft.area_id
    LEFT JOIN food_types f ON aft.food_type_id = f.id
    LEFT JOIN devices d ON a.id = d.area_id
    LEFT JOIN (
      SELECT device_id, reading_value 
      FROM sensor_readings 
      WHERE id IN (SELECT MAX(id) FROM sensor_readings GROUP BY device_id)
    ) sr ON sr.device_id = d.id
    ${whereClause}
    ORDER BY w.id, a.id, d.id
  `);
}

  private formatWarehouseRows(rawData: any[]): any[] {
    return rawData.reduce((acc: any[], row: any) => {
      let warehouse = acc.find((w) => w.id === row.warehouse_id);
      if (!warehouse) {
        warehouse = {
          id: row.warehouse_id,
          warehouse_name: row.warehouse_name,
          areas: [],
        };
        acc.push(warehouse);
      }

      if (row.area_id) {
        let area = warehouse.areas.find((a: any) => a.id === row.area_id);
        if (!area) {
          area = {
            id: row.area_id,
            area_name: row.area_name,
            auto_door_timeout_sec: row.auto_door_timeout_sec,
            operating_mode: row.operating_mode || 'AUTO',
            manual_override_mins: row.manual_override_mins || 30,
            food_types: [],
            devices: [],
            operators: [],
          };
          warehouse.areas.push(area);
        }
        
        if (row.food_id && !area.food_types.find((f: any) => f.id === row.food_id)) {
          area.food_types.push({
            id: row.food_id,
            food_name: row.food_name,
            min_temp: row.min_temp,
            max_temp: row.max_temp,
            min_humi: row.min_humi,
            max_humi: row.max_humi,
          });
        }

        if (row.device_id) {
          const exists = area.devices.find((d: any) => d.id === row.device_id);
          if (!exists) {
            area.devices.push({
              id: row.device_id,
              device_name: row.device_name,
              adafruit_feed_key: row.adafruit_feed_key,
              device_type: row.device_type,
              status: row.status,
              latest_value: row.reading_value ?? null,
            });
          }
        }
      }
      return acc;
    }, []);
  }

  async getAllWarehouses() {
    const raw = await this.buildWarehouseQuery();
  const result = this.formatWarehouseRows(raw);
  const areaIds = result.flatMap(w => w.areas.map((a: any) => a.id));
  const operators = await this.getOperatorsByAreaIds(areaIds);
  return this.attachOperators(result, operators);
  }

  async getWarehouseById(id: number) {
    const raw = await this.buildWarehouseQuery(id);
  const result = this.formatWarehouseRows(raw);
  if (!result.length)
    throw new HttpException('Không tìm thấy kho lạnh', HttpStatus.NOT_FOUND);
  const areaIds = result[0].areas.map((a: any) => a.id);
  const operators = await this.getOperatorsByAreaIds(areaIds);
  return this.attachOperators(result, operators)[0];
  }
  async getWarehousesByOperator(userId: number) {
  const raw = await this.warehouseRepo.query(`
    SELECT 
      w.id as warehouse_id, w.warehouse_name,
      a.id as area_id, a.area_name, a.auto_door_timeout_sec,
      a.operating_mode, a.manual_override_mins,
      f.id as food_id, f.food_name, f.min_temp, f.max_temp, f.min_humi, f.max_humi,
      d.id as device_id, d.device_name, d.adafruit_feed_key, d.device_type, d.status,
      sr.reading_value
    FROM warehouses w
    INNER JOIN areas a ON w.id = a.warehouse_id
    INNER JOIN user_area_management uam ON a.id = uam.area_id AND uam.user_id = ${userId}
    LEFT JOIN area_food_types aft ON a.id = aft.area_id
    LEFT JOIN food_types f ON aft.food_type_id = f.id
    LEFT JOIN devices d ON a.id = d.area_id
    LEFT JOIN (
      SELECT device_id, reading_value 
      FROM sensor_readings 
      WHERE id IN (SELECT MAX(id) FROM sensor_readings GROUP BY device_id)
    ) sr ON sr.device_id = d.id
    ORDER BY w.id, a.id, d.id
  `);
  const result = this.formatWarehouseRows(raw);
  const areaIds = result.flatMap(w => w.areas.map((a: any) => a.id));
  const operators = await this.getOperatorsByAreaIds(areaIds);
  return this.attachOperators(result, operators);
}

  async createWarehouse(data: Partial<Warehouse>) {
    if (!data.warehouse_name?.trim())
      throw new HttpException('Tên kho không được trống', HttpStatus.BAD_REQUEST);
    return await this.warehouseRepo.save(this.warehouseRepo.create(data));
  }

  async updateWarehouse(id: number, data: Partial<Warehouse>) {
    const warehouse = await this.warehouseRepo.findOne({ where: { id } });
    if (!warehouse)
      throw new HttpException('Không tìm thấy kho lạnh', HttpStatus.NOT_FOUND);
    if (data.warehouse_name?.trim())
      warehouse.warehouse_name = data.warehouse_name.trim();
    return await this.warehouseRepo.save(warehouse);
  }

  async deleteWarehouse(id: number) {
    const warehouse = await this.warehouseRepo.findOne({
      where: { id },
      relations: ['areas'],
    });
    if (!warehouse)
      throw new HttpException('Không tìm thấy kho lạnh', HttpStatus.NOT_FOUND);
    if (warehouse.areas?.length > 0)
      throw new HttpException(
        `Kho còn ${warehouse.areas.length} khu vực. Xóa hết khu vực trước!`,
        HttpStatus.BAD_REQUEST,
      );
    await this.warehouseRepo.delete(id);
    return true;
  }

  async getDashboardData() {
    return await this.getAllWarehouses();
  }

  // ================= QUẢN LÝ KHU VỰC =================

  async getAllAreas() {
    return await this.areaRepo.find({
      relations: ['warehouse', 'user', 'current_food_type'],
    });
  }

  async createArea(data: Partial<Area> & { food_type_ids?: number[]; operator_id?: number }) {
  const newArea = this.areaRepo.create(data);

  if (data.food_type_ids && data.food_type_ids.length > 0) {
    newArea.food_types = await this.foodTypeRepo.findBy(
      data.food_type_ids.map(id => ({ id }))
    );
  }

  // ✅ Gán operator ngay khi tạo nếu có
  // facilities.service.ts - updateAreaSettings, thêm vào cuối trước return:
if (data.operator_id !== undefined) {
  if (data.operator_id) {
    const user = await this.userRepo.findOne({ where: { id: data.operator_id } });
    if (user) newArea.operators = [user]; // thay thế hoàn toàn
  } else {
    newArea.operators = []; // bỏ phân công
  }
}

  const saved = await this.areaRepo.save(newArea);

  // Load lại đầy đủ relations để trả về
  return await this.areaRepo.findOne({
    where: { id: saved.id },
    relations: ['warehouse', 'food_types', 'operators'],
  });
}

  async deleteArea(id: number) {
    // ✅ FIX: Load relation devices để kiểm tra trước khi xóa
    const area = await this.areaRepo.findOne({
      where: { id },
      relations: ['devices'],
    });
    if (!area) {
      throw new HttpException('Không tìm thấy khu vực', HttpStatus.NOT_FOUND);
    }
    if (area.devices?.length > 0) {
      throw new HttpException(
        `Khu vực còn ${area.devices.length} thiết bị. Xóa hết thiết bị trước!`,
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.areaRepo.delete(id);
    return true;
  }

  async assignOperator(areaId: number, userId: number) {
  const area = await this.areaRepo.findOne({
    where: { id: areaId },
    relations: ['operators'],
  });
  const user = await this.userRepo.findOne({ where: { id: userId } });
  if (!area || !user)
    throw new HttpException('Lỗi dữ liệu', HttpStatus.BAD_REQUEST);

  // ✅ Luôn thay thế hoàn toàn — 1 khu vực chỉ có 1 operator
  area.operators = [user];
  await this.areaRepo.save(area);

  return { user: user.username, area: area.area_name };
}

  async updateAreaSettings(id: number, data: any) {
    const area = await this.areaRepo.findOne({
      where: { id },
      relations: ['warehouse', 'food_types', 'operators'], // ✅ thêm operators
    });
    if (!area)
      throw new HttpException('Không tìm thấy Khu vực!', HttpStatus.NOT_FOUND);

    if (data.auto_door_timeout_sec !== undefined)
      area.auto_door_timeout_sec = data.auto_door_timeout_sec;
    if (data.manual_override_mins !== undefined)
      area.manual_override_mins = data.manual_override_mins;

    // Cập nhật food_types nếu có
    if (data.food_type_ids !== undefined) {
      area.food_types = data.food_type_ids.length > 0
        ? await this.foodTypeRepo.findBy(data.food_type_ids.map((fid: number) => ({ id: fid })))
        : [];
    }

    // ✅ Cập nhật operator: luôn replace, không append
    if (data.operator_id !== undefined) {
      if (data.operator_id) {
        const user = await this.userRepo.findOne({ where: { id: data.operator_id } });
        if (!user) throw new HttpException('Không tìm thấy người dùng', HttpStatus.NOT_FOUND);
        area.operators = [user]; // thay thế hoàn toàn
      } else {
        area.operators = []; // bỏ phân công
      }
    }

    if (data.operating_mode !== undefined) {
      const oldMode = area.operating_mode;
      area.operating_mode = data.operating_mode;
      if (oldMode !== data.operating_mode) {
        const modeName = data.operating_mode === 'AUTO' ? 'Tự động' : 'Tắt tự động';
        const whName = area.warehouse?.warehouse_name || 'Kho Không Tên';
        await this.actionLogRepo.save(
          this.actionLogRepo.create({
            action_type: 'MODE_CHANGE',
            action_value: `[${whName} - ${area.area_name}] đã chuyển sang ${modeName}`,
            trigger_source: 'MANUAL',
            area: area,
          }),
        );
      }
    }


    return await this.areaRepo.save(area);
  }

  // ================= QUẢN LÝ THỰC PHẨM =================

  async getAllFoodTypes() {
    return await this.foodTypeRepo.find();
  }

  async createFoodType(data: Partial<FoodType>) {
    return await this.foodTypeRepo.save(this.foodTypeRepo.create(data));
  }

  async updateFoodType(id: number, data: Partial<FoodType>) {
    await this.foodTypeRepo.update(id, data);
    return true;
  }

  async deleteFoodType(id: number) {
    await this.foodTypeRepo.delete(id);
    return true;
  }

   async addFoodToArea(areaId: number, foodTypeId: number) {
    // 1. Lấy Khu vực
    const area = await this.areaRepo.findOne({
      where: { id: areaId },
      relations: ['food_types'],
    });

    if (!area) throw new NotFoundException('Không tìm thấy khu vực này');

    // Khởi tạo mảng rỗng nếu chưa có gì (chống lỗi TypeORM)
    const currentFoods = area.food_types || [];

    // 2. Lấy thực phẩm mới định thêm vào
    const newFood = await this.foodTypeRepo.findOne({
      where: { id: foodTypeId },
    });
    if (!newFood)
      throw new NotFoundException('Không tìm thấy loại thực phẩm này');

    // 3. Nếu khu vực đã có thực phẩm, tiến hành check "Vùng giao thoa"
    if (currentFoods.length > 0) {
      const allFoods = [...currentFoods, newFood];

      // Tìm dải nhiệt độ và độ ẩm giao thoa (Strict Intersection)
      const bounds = allFoods.reduce(
        (acc, f) => ({
          minT: Math.max(acc.minT, f.min_temp),
          maxT: Math.min(acc.maxT, f.max_temp),
          minH: Math.max(acc.minH, f.min_humi),
           maxH: Math.min(acc.maxH, f.max_humi),
        }),
        { minT: -99, maxT: 99, minH: 0, maxH: 100 },
      );

      // Nếu dải Min vượt quá dải Max -> Không có tiếng nói chung
      if (bounds.minT > bounds.maxT || bounds.minH > bounds.maxH) {
        throw new BadRequestException(
          'Xung đột thông số! Thực phẩm này không thể để chung với các loại hiện có do lệch dải nhiệt độ/độ ẩm.',
        );
      }
    }

    // 4. Lưu liên kết mới vào bảng trung gian
    currentFoods.push(newFood);
    area.food_types = currentFoods;
    await this.areaRepo.save(area);

    return {
      status: 'success',
      message: 'Đã thêm thực phẩm vào khu vực thành công.',
    };
  }

  async resolveAlert(logId: number) {
    const log = await this.actionLogRepo.findOne({ where: { id: logId } });
    if (!log) throw new NotFoundException('Không tìm thấy log cảnh báo');

    log.is_resolved = true;
    await this.actionLogRepo.save(log);

    // Ghi nhận thêm 1 log là nhân viên đã dọn dẹp xong
    return { status: 'success', message: 'Đã xác nhận xử lý cảnh báo!' };
  }
  
}