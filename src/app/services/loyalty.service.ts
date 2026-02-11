import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';

export interface LoyaltyTransaction {
  id?: string;
  customer_id: string;
  points: number;
  transaction_type: 'earn' | 'redeem' | 'bonus';
  description?: string;
  order_id?: string;
  created_at?: string;
}

export interface CustomerLoyalty {
  customer_id: string;
  total_points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lifetime_points: number;
}

@Injectable({
  providedIn: 'root'
})
export class LoyaltyService {
  // Points earning rates
  private readonly POINTS_PER_DOLLAR = 1; // 1 point per $1 spent
  private readonly BIRTHDAY_BONUS = 50;
  private readonly REFERRAL_BONUS = 25;

  // Tier thresholds
  private readonly TIER_THRESHOLDS = {
    bronze: 0,
    silver: 100,
    gold: 500,
    platinum: 1000
  };

  constructor(private db: DatabaseService) {}

  /**
   * Calculate points earned for an order
   */
  calculateOrderPoints(orderTotal: number): number {
    return Math.floor(orderTotal * this.POINTS_PER_DOLLAR);
  }

  /**
   * Get customer's current loyalty info
   */
  async getCustomerLoyalty(customerId: string): Promise<CustomerLoyalty> {
    const transactions = await this.db.select<LoyaltyTransaction>('loyalty_transactions', {
      filters: { customer_id: `eq.${customerId}` }
    });

    const totalPoints = transactions.reduce((sum, t) => sum + t.points, 0);
    const lifetimePoints = transactions
      .filter(t => t.points > 0)
      .reduce((sum, t) => sum + t.points, 0);

    return {
      customer_id: customerId,
      total_points: totalPoints,
      tier: this.calculateTier(totalPoints),
      lifetime_points: lifetimePoints
    };
  }

  /**
   * Award points for an order
   */
  async awardPointsForOrder(
    customerId: string, 
    orderTotal: number, 
    orderId: string
  ): Promise<LoyaltyTransaction> {
    const points = this.calculateOrderPoints(orderTotal);
    
    return this.db.insert<LoyaltyTransaction>('loyalty_transactions', {
      customer_id: customerId,
      points: points,
      transaction_type: 'earn',
      description: `Points earned for order $${orderTotal.toFixed(2)}`,
      order_id: orderId,
      created_at: new Date().toISOString()
    });
  }

  /**
   * Redeem points for a discount
   */
  async redeemPoints(
    customerId: string, 
    pointsToRedeem: number, 
    description: string
  ): Promise<{ success: boolean; transaction?: LoyaltyTransaction; error?: string }> {
    const loyalty = await this.getCustomerLoyalty(customerId);
    
    if (loyalty.total_points < pointsToRedeem) {
      return { 
        success: false, 
        error: `Insufficient points. Available: ${loyalty.total_points}` 
      };
    }

    const transaction = await this.db.insert<LoyaltyTransaction>('loyalty_transactions', {
      customer_id: customerId,
      points: -pointsToRedeem,
      transaction_type: 'redeem',
      description: description,
      created_at: new Date().toISOString()
    });

    return { success: true, transaction };
  }

  /**
   * Award bonus points (birthday, referral, etc.)
   */
  async awardBonusPoints(
    customerId: string, 
    points: number, 
    description: string
  ): Promise<LoyaltyTransaction> {
    return this.db.insert<LoyaltyTransaction>('loyalty_transactions', {
      customer_id: customerId,
      points: points,
      transaction_type: 'bonus',
      description: description,
      created_at: new Date().toISOString()
    });
  }

  /**
   * Get transaction history for a customer
   */
  async getTransactionHistory(customerId: string): Promise<LoyaltyTransaction[]> {
    return this.db.select<LoyaltyTransaction>('loyalty_transactions', {
      filters: { customer_id: `eq.${customerId}` },
      order: 'created_at.desc'
    });
  }

  /**
   * Calculate tier based on points
   */
  private calculateTier(points: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
    if (points >= this.TIER_THRESHOLDS.platinum) return 'platinum';
    if (points >= this.TIER_THRESHOLDS.gold) return 'gold';
    if (points >= this.TIER_THRESHOLDS.silver) return 'silver';
    return 'bronze';
  }

  /**
   * Get tier benefits
   */
  getTierBenefits(tier: string): { discount: number; perks: string[] } {
    const benefits = {
      bronze: { discount: 0, perks: ['Earn 1 point per $1 spent'] },
      silver: { discount: 0.05, perks: ['Earn 1 point per $1 spent', '5% discount on all orders', 'Early access to new products'] },
      gold: { discount: 0.10, perks: ['Earn 1 point per $1 spent', '10% discount on all orders', 'Free delivery', 'Birthday bonus (50 points)'] },
      platinum: { discount: 0.15, perks: ['Earn 1 point per $1 spent', '15% discount on all orders', 'Free delivery', 'Birthday bonus (100 points)', 'Priority support'] }
    };
    return benefits[tier as keyof typeof benefits] || benefits.bronze;
  }

  /**
   * Convert points to dollar value (for redemption)
   * 100 points = $1
   */
  pointsToDollars(points: number): number {
    return points / 100;
  }

  /**
   * Convert dollars to points needed
   */
  dollarsToPoints(dollars: number): number {
    return Math.ceil(dollars * 100);
  }
}
