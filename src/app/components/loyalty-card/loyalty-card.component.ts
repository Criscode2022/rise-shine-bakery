import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { CustomerLoyalty, LoyaltyService } from '../../services/loyalty.service';

@Component({
  selector: 'app-loyalty-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loyalty-card" [class]="loyalty?.tier">
      <div class="loyalty-header">
        <div class="tier-badge">{{ loyalty?.tier | uppercase }}</div>
        <h3>Rewards Card</h3>
      </div>
      
      <div class="points-display">
        <div class="points-value">{{ loyalty?.total_points || 0 }}</div>
        <div class="points-label">Points Available</div>
      </div>
      
      <div class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progressPercentage"></div>
        </div>
        <div class="progress-labels">
          <span>{{ loyalty?.tier }}</span>
          <span *ngIf="nextTier">{{ pointsToNextTier }} pts to {{ nextTier }}</span>
          <span *ngIf="!nextTier">Max Tier! 🎉</span>
        </div>
      </div>
      
      <div class="benefits-section">
        <h4>Your Benefits</h4>
        <ul>
          <li *ngFor="let perk of benefits?.perks">{{ perk }}</li>
        </ul>
      </div>
      
      <div class="redeem-section" *ngIf="canRedeem">
        <div class="redeem-info">
          Worth ${{ redeemValue }} in rewards
        </div>
        <button class="btn-redeem" (click)="onRedeem()">
          Redeem Points
        </button>
      </div>
    </div>
  `,
  styles: [`
    .loyalty-card {
      background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
      border-radius: 16px;
      padding: 24px;
      color: white;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    
    .loyalty-card.silver {
      background: linear-gradient(135deg, #718096 0%, #A0AEC0 100%);
    }
    
    .loyalty-card.gold {
      background: linear-gradient(135deg, #D69E2E 0%, #ECC94B 100%);
      color: #744210;
    }
    
    .loyalty-card.platinum {
      background: linear-gradient(135deg, #2D3748 0%, #4A5568 50%, #A0AEC0 100%);
    }
    
    .loyalty-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .tier-badge {
      background: rgba(255,255,255,0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .loyalty-card.gold .tier-badge {
      background: rgba(116, 66, 16, 0.2);
    }
    
    h3 {
      margin: 0;
      font-size: 18px;
      opacity: 0.9;
    }
    
    .points-display {
      text-align: center;
      margin-bottom: 24px;
    }
    
    .points-value {
      font-size: 48px;
      font-weight: bold;
      line-height: 1;
    }
    
    .points-label {
      font-size: 14px;
      opacity: 0.8;
      margin-top: 4px;
    }
    
    .progress-section {
      margin-bottom: 20px;
    }
    
    .progress-bar {
      height: 8px;
      background: rgba(255,255,255,0.3);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: rgba(255,255,255,0.9);
      transition: width 0.3s ease;
    }
    
    .loyalty-card.gold .progress-fill {
      background: #744210;
    }
    
    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-top: 8px;
      opacity: 0.8;
      text-transform: capitalize;
    }
    
    .benefits-section {
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }
    
    .loyalty-card.gold .benefits-section {
      background: rgba(116, 66, 16, 0.1);
    }
    
    .benefits-section h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      opacity: 0.9;
    }
    
    .benefits-section ul {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
      opacity: 0.9;
    }
    
    .benefits-section li {
      margin-bottom: 4px;
    }
    
    .redeem-section {
      text-align: center;
    }
    
    .redeem-info {
      font-size: 14px;
      margin-bottom: 12px;
      opacity: 0.9;
    }
    
    .btn-redeem {
      background: white;
      color: #8B4513;
      border: none;
      padding: 12px 32px;
      border-radius: 24px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .loyalty-card.silver .btn-redeem {
      color: #718096;
    }
    
    .loyalty-card.gold .btn-redeem {
      color: #D69E2E;
    }
    
    .loyalty-card.platinum .btn-redeem {
      color: #2D3748;
    }
    
    .btn-redeem:hover {
      transform: scale(1.05);
    }
  `]
})
export class LoyaltyCardComponent implements OnInit {
  @Input() customerId!: string;
  loyalty: CustomerLoyalty | null = null;
  benefits: { discount: number; perks: string[] } | null = null;
  
  private readonly TIER_THRESHOLDS = {
    bronze: 0,
    silver: 100,
    gold: 500,
    platinum: 1000
  };

  constructor(private loyaltyService: LoyaltyService) {}

  async ngOnInit() {
    if (this.customerId) {
      this.loyalty = await this.loyaltyService.getCustomerLoyalty(this.customerId);
      if (this.loyalty) {
        this.benefits = this.loyaltyService.getTierBenefits(this.loyalty.tier);
      }
    }
  }

  get progressPercentage(): number {
    if (!this.loyalty) return 0;
    const currentTierPoints = this.TIER_THRESHOLDS[this.loyalty.tier as keyof typeof this.TIER_THRESHOLDS];
    const nextTierPoints = this.getNextTierThreshold();
    if (!nextTierPoints) return 100;
    return ((this.loyalty.total_points - currentTierPoints) / (nextTierPoints - currentTierPoints)) * 100;
  }

  get nextTier(): string | null {
    const tiers = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tiers.indexOf(this.loyalty?.tier || 'bronze');
    return tiers[currentIndex + 1] || null;
  }

  get pointsToNextTier(): number {
    if (!this.nextTier) return 0;
    const nextThreshold = this.TIER_THRESHOLDS[this.nextTier as keyof typeof this.TIER_THRESHOLDS];
    return nextThreshold - (this.loyalty?.total_points || 0);
  }

  get canRedeem(): boolean {
    return (this.loyalty?.total_points || 0) >= 100; // Minimum 100 points to redeem
  }

  get redeemValue(): string {
    return this.loyaltyService.pointsToDollars(this.loyalty?.total_points || 0).toFixed(2);
  }

  private getNextTierThreshold(): number | null {
    if (!this.nextTier) return null;
    return this.TIER_THRESHOLDS[this.nextTier as keyof typeof this.TIER_THRESHOLDS];
  }

  onRedeem() {
    // Emit event to parent component
    console.log('Redeem points clicked');
  }
}
