import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Vendor, InventoryItem, InventoryTransaction, PurchaseOrder } from '../entities/inventory.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Vendor) private vendorRepository: Repository<Vendor>,
    @InjectRepository(InventoryItem) private itemRepository: Repository<InventoryItem>,
    @InjectRepository(InventoryTransaction) private transactionRepository: Repository<InventoryTransaction>,
    @InjectRepository(PurchaseOrder) private poRepository: Repository<PurchaseOrder>,
  ) {}

  // --- Vendors ---
  async findAllVendors(organizationId: string) {
    return this.vendorRepository.find({ where: { organizationId, isActive: true }, order: { name: 'ASC' } });
  }

  async createVendor(dto: any, userId: string, organizationId: string) {
    const vendor = this.vendorRepository.create({ ...dto, organizationId, createdBy: userId });
    return this.vendorRepository.save(vendor);
  }

  async updateVendor(id: string, dto: any, userId: string, organizationId: string) {
    await this.vendorRepository.update({ id, organizationId }, { ...dto, updatedBy: userId });
    return this.vendorRepository.findOne({ where: { id, organizationId } });
  }

  // --- Items ---
  async findAllItems(organizationId: string, branchId?: string, lowStock = false) {
    const query = this.itemRepository
      .createQueryBuilder('item')
      .where('item.organizationId = :organizationId AND item.isActive = true', { organizationId });

    if (branchId) query.andWhere('item.branchId = :branchId', { branchId });
    if (lowStock) query.andWhere('item.currentStock <= item.minimumStock');

    return query.orderBy('item.name', 'ASC').getMany();
  }

  async findOneItem(id: string, organizationId: string) {
    const item = await this.itemRepository.findOne({ where: { id, organizationId } });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async createItem(dto: any, userId: string, organizationId: string) {
    const item = this.itemRepository.create({ ...dto, organizationId, createdBy: userId });
    return this.itemRepository.save(item);
  }

  async updateItem(id: string, dto: any, userId: string, organizationId: string) {
    await this.findOneItem(id, organizationId);
    await this.itemRepository.update(id, { ...dto, updatedBy: userId });
    return this.findOneItem(id, organizationId);
  }

  async adjustStock(itemId: string, dto: any, userId: string, organizationId: string) {
    const item = await this.findOneItem(itemId, organizationId);
    const stockBefore = Number(item.currentStock);
    let stockAfter: number;

    if (dto.transactionType === 'IN') {
      stockAfter = stockBefore + Number(dto.quantity);
    } else if (dto.transactionType === 'OUT') {
      stockAfter = stockBefore - Number(dto.quantity);
      if (stockAfter < 0) throw new BadRequestException('Insufficient stock');
    } else {
      stockAfter = Number(dto.quantity);
    }

    await this.itemRepository.update(itemId, { currentStock: stockAfter, updatedBy: userId });

    const tx = this.transactionRepository.create({
      inventoryItemId: itemId,
      organizationId,
      branchId: item.branchId,
      transactionType: dto.transactionType,
      quantity: dto.quantity,
      stockBefore,
      stockAfter,
      unitCost: dto.unitCost,
      referenceId: dto.referenceId,
      referenceType: dto.referenceType,
      notes: dto.notes,
      performedBy: userId,
      createdBy: userId,
    });
    return this.transactionRepository.save(tx);
  }

  async getLowStockAlerts(organizationId: string) {
    return this.itemRepository
      .createQueryBuilder('item')
      .where('item.organizationId = :organizationId AND item.isActive = true AND item.currentStock <= item.minimumStock', { organizationId })
      .getMany();
  }

  async getStats(organizationId: string) {
    const [totalItems, lowStockItems] = await Promise.all([
      this.itemRepository.count({ where: { organizationId, isActive: true } }),
      this.itemRepository
        .createQueryBuilder('item')
        .where('item.organizationId = :organizationId AND item.isActive = true AND item.currentStock <= item.minimumStock', { organizationId })
        .getCount(),
    ]);

    const valueResult = await this.itemRepository
      .createQueryBuilder('item')
      .select('SUM(item.currentStock * item.unitCost)', 'totalValue')
      .where('item.organizationId = :organizationId AND item.isActive = true', { organizationId })
      .getRawOne();

    return {
      totalItems,
      lowStockItems,
      totalInventoryValue: parseFloat(valueResult.totalValue) || 0,
    };
  }
}
