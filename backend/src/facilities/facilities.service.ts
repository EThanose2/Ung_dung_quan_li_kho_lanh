import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
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
      LEFT JOIN food_types f ON a.current_food_type_id = f.id
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
            current_food_type: row.food_id
              ? {
                  id: row.food_id,
                  food_name: row.food_name,
                  min_temp: row.min_temp,
                  max_temp: row.max_temp,
                  min_humi: row.min_humi,
                  max_humi: row.max_humi,
                }
              : null,
            devices: [],
          };
          warehouse.areas.push(area);
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
    return this.formatWarehouseRows(raw);
  }

  async getWarehouseById(id: number) {
    const raw = await this.buildWarehouseQuery(id);
    const result = this.formatWarehouseRows(raw);
    if (!result.length)
      throw new HttpException('Không tìm thấy kho lạnh', HttpStatus.NOT_FOUND);
    return result[0];
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

  async createArea(data: Partial<Area>) {
    return await this.areaRepo.save(this.areaRepo.create(data));
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
    const area = await this.areaRepo.findOne({ where: { id: areaId } });
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!area || !user)
      throw new HttpException('Lỗi dữ liệu', HttpStatus.BAD_REQUEST);
    area.user = user;
    await this.areaRepo.save(area);
    return { user: user.username, area: area.area_name };
  }

  async updateAreaSettings(id: number, data: any) {
    const area = await this.areaRepo.findOne({
      where: { id },
      relations: ['warehouse'],
    });
    if (!area)
      throw new HttpException('Không tìm thấy Khu vực!', HttpStatus.NOT_FOUND);

    if (data.auto_door_timeout_sec !== undefined)
      area.auto_door_timeout_sec = data.auto_door_timeout_sec;
    if (data.manual_override_mins !== undefined)
      area.manual_override_mins = data.manual_override_mins;

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

    if (data.current_food_type_id !== undefined) {
      const food = await this.foodTypeRepo.findOne({
        where: { id: data.current_food_type_id },
      });
      if (food) area.current_food_type = food;
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
}