import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from '../entities/order.entity';
import { Customer } from '../entities/customer.entity';
import { Invoice, Payment } from '../entities/billing.entity';
import { Expense } from '../entities/employee.entity';
import { OrderStatus } from '../common/enums';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    @InjectRepository(Customer) private customerRepository: Repository<Customer>,
    @InjectRepository(Invoice) private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
    @InjectRepository(Expense) private expenseRepository: Repository<Expense>,
  ) {}

  private getDateRange(period: string): { from: Date; to: Date } {
    const to = new Date();
    const from = new Date();
    switch (period) {
      case 'today':
        from.setHours(0, 0, 0, 0);
        break;
      case 'week':
        from.setDate(from.getDate() - 7);
        break;
      case 'month':
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
        break;
      case 'quarter':
        from.setMonth(from.getMonth() - 3);
        break;
      case 'year':
        from.setMonth(0, 1);
        from.setHours(0, 0, 0, 0);
        break;
      default:
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
    }
    return { from, to };
  }

  async getSalesReport(organizationId: string, period = 'month', fromDate?: string, toDate?: string) {
    const range = fromDate && toDate
      ? { from: new Date(fromDate), to: new Date(toDate) }
      : this.getDateRange(period);

    const ordersResult = await this.orderRepository
      .createQueryBuilder('o')
      .select('DATE(o.orderDate)', 'date')
      .addSelect('COUNT(*)', 'orders')
      .addSelect('SUM(o.totalAmount)', 'revenue')
      .addSelect('SUM(o.amountPaid)', 'collected')
      .where('o.organizationId = :organizationId AND o.orderDate BETWEEN :from AND :to', {
        organizationId, from: range.from, to: range.to,
      })
      .groupBy('DATE(o.orderDate)')
      .orderBy('DATE(o.orderDate)', 'ASC')
      .getRawMany();

    const summary = await this.orderRepository
      .createQueryBuilder('o')
      .select('COUNT(*)', 'totalOrders')
      .addSelect('SUM(o.totalAmount)', 'totalRevenue')
      .addSelect('SUM(o.amountPaid)', 'totalCollected')
      .addSelect('SUM(o.amountDue)', 'totalDue')
      .where('o.organizationId = :organizationId AND o.orderDate BETWEEN :from AND :to', {
        organizationId, from: range.from, to: range.to,
      })
      .getRawOne();

    const statusBreakdown = await this.orderRepository
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('o.organizationId = :organizationId AND o.orderDate BETWEEN :from AND :to', {
        organizationId, from: range.from, to: range.to,
      })
      .groupBy('o.status')
      .getRawMany();

    return {
      period,
      from: range.from,
      to: range.to,
      daily: ordersResult.map((r) => ({
        date: r.date,
        orders: parseInt(r.orders),
        revenue: parseFloat(r.revenue) || 0,
        collected: parseFloat(r.collected) || 0,
      })),
      summary: {
        totalOrders: parseInt(summary.totalOrders) || 0,
        totalRevenue: parseFloat(summary.totalRevenue) || 0,
        totalCollected: parseFloat(summary.totalCollected) || 0,
        totalDue: parseFloat(summary.totalDue) || 0,
      },
      statusBreakdown,
    };
  }

  async getFinancialReport(organizationId: string, period = 'month') {
    const range = this.getDateRange(period);

    const [paymentsResult, expensesResult] = await Promise.all([
      this.paymentRepository
        .createQueryBuilder('p')
        .select('SUM(p.amount)', 'totalIncome')
        .where('p.organizationId = :organizationId AND p.paymentDate BETWEEN :from AND :to AND p.isRefund = false', {
          organizationId, from: range.from, to: range.to,
        })
        .getRawOne(),
      this.expenseRepository
        .createQueryBuilder('e')
        .select('SUM(e.amount)', 'totalExpenses')
        .where('e.organizationId = :organizationId AND e.expenseDate BETWEEN :from AND :to', {
          organizationId, from: range.from, to: range.to,
        })
        .getRawOne(),
    ]);

    const totalIncome = parseFloat(paymentsResult.totalIncome) || 0;
    const totalExpenses = parseFloat(expensesResult.totalExpenses) || 0;

    const expenseByCategory = await this.expenseRepository
      .createQueryBuilder('e')
      .select('e.category', 'category')
      .addSelect('SUM(e.amount)', 'total')
      .where('e.organizationId = :organizationId AND e.expenseDate BETWEEN :from AND :to', {
        organizationId, from: range.from, to: range.to,
      })
      .groupBy('e.category')
      .getRawMany();

    return {
      period,
      from: range.from,
      to: range.to,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      profitMargin: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
      expenseByCategory,
    };
  }

  async getCustomerReport(organizationId: string) {
    const topCustomers = await this.customerRepository
      .createQueryBuilder('c')
      .where('c.organizationId = :organizationId', { organizationId })
      .orderBy('c.totalSpent', 'DESC')
      .take(10)
      .getMany();

    const stats = await this.customerRepository
      .createQueryBuilder('c')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(c.totalSpent)', 'totalRevenue')
      .addSelect('SUM(c.outstandingBalance)', 'totalOutstanding')
      .addSelect('AVG(c.totalOrders)', 'avgOrders')
      .where('c.organizationId = :organizationId', { organizationId })
      .getRawOne();

    const newThisMonth = await this.customerRepository
      .createQueryBuilder('c')
      .where('c.organizationId = :organizationId AND c.createdAt >= :from', {
        organizationId,
        from: this.getDateRange('month').from,
      })
      .getCount();

    return {
      topCustomers,
      newThisMonth,
      stats: {
        totalCustomers: parseInt(stats.total) || 0,
        totalRevenue: parseFloat(stats.totalRevenue) || 0,
        totalOutstanding: parseFloat(stats.totalOutstanding) || 0,
        avgOrdersPerCustomer: parseFloat(stats.avgOrders) || 0,
      },
    };
  }
}
