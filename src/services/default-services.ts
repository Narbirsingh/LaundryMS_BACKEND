import { EntityManager } from 'typeorm';
import { Service } from '../entities/service.entity';
import { ServiceCategory, PricingMethod } from '../common/enums';

/** Starter services every new organization gets; owners can edit or remove them. */
export const DEFAULT_SERVICES: Array<Pick<Service, 'name' | 'description' | 'category' | 'pricingMethod' | 'basePrice'>> = [
  { name: 'Wash & Fold', category: ServiceCategory.WASH_FOLD, pricingMethod: PricingMethod.PER_KG, basePrice: 49, description: 'Full wash, dry and fold — priced per kg. Ideal for everyday clothing.' },
  { name: 'Wash & Iron', category: ServiceCategory.WASH_IRON, pricingMethod: PricingMethod.PER_GARMENT, basePrice: 59, description: 'Wash, dry and iron — crisply pressed and ready to wear.' },
  { name: 'Steam Ironing', category: ServiceCategory.STEAM_IRONING, pricingMethod: PricingMethod.PER_GARMENT, basePrice: 25, description: 'Steam press only — no wash. Perfect for lightly worn garments.' },
  { name: 'Dry Cleaning', category: ServiceCategory.DRY_CLEANING, pricingMethod: PricingMethod.PER_GARMENT, basePrice: 149, description: 'Professional solvent-based cleaning for delicate and special fabrics.' },
  { name: 'Premium Dry Cleaning', category: ServiceCategory.PREMIUM_DRY_CLEANING, pricingMethod: PricingMethod.PER_GARMENT, basePrice: 299, description: 'Expert care for designer wear, suits, sarees and bridal outfits.' },
  { name: 'Stain Removal', category: ServiceCategory.STAIN_REMOVAL, pricingMethod: PricingMethod.PER_GARMENT, basePrice: 79, description: 'Targeted treatment for tough stains — oil, ink, wine, rust and more.' },
  { name: 'Shoe Cleaning', category: ServiceCategory.SHOE_CLEANING, pricingMethod: PricingMethod.PER_PAIR, basePrice: 199, description: 'Deep clean, deodorize and polish for all types of footwear.' },
  { name: 'Bag Cleaning', category: ServiceCategory.BAG_CLEANING, pricingMethod: PricingMethod.PER_ITEM, basePrice: 249, description: 'Thorough cleaning for handbags, backpacks and travel bags.' },
  { name: 'Curtain Cleaning', category: ServiceCategory.CURTAIN_CLEANING, pricingMethod: PricingMethod.PER_KG, basePrice: 89, description: 'Pick-up, wash, iron and re-hang service for all curtain types.' },
  { name: 'Carpet & Rug Cleaning', category: ServiceCategory.CARPET_CLEANING, pricingMethod: PricingMethod.PER_ITEM, basePrice: 499, description: 'Deep extraction cleaning — removes dust, allergens and embedded dirt.' },
  { name: 'Blanket & Duvet', category: ServiceCategory.BLANKET_CLEANING, pricingMethod: PricingMethod.PER_ITEM, basePrice: 199, description: 'Large-load wash for blankets, quilts, duvets and comforters.' },
  { name: 'Alteration & Repair', category: ServiceCategory.ALTERATION_REPAIR, pricingMethod: PricingMethod.PER_GARMENT, basePrice: 99, description: 'Hemming, zip replacement, button stitching and minor garment repairs.' },
];

/** Inserts the default services for a new organization inside the caller's transaction. */
export async function seedDefaultServices(manager: EntityManager, organizationId: string, createdBy?: string) {
  const services = DEFAULT_SERVICES.map((s, i) =>
    manager.create(Service, {
      ...s,
      organizationId,
      gstRate: 5,
      processingHours: 24,
      isActive: true,
      sortOrder: i + 1,
      createdBy,
    }),
  );
  await manager.save(services);
}
