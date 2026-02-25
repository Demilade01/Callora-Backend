import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { DeveloperRevenueResponse, SettlementStore } from '../types/developer.js';
import { UsageStore } from '../types/gateway.js';

export interface DeveloperRoutesDeps {
  settlementStore: SettlementStore;
  usageStore: UsageStore;
}

export function createDeveloperRouter(deps: DeveloperRoutesDeps): Router {
  const router = Router();
  const { settlementStore, usageStore } = deps;

  /**
   * GET /api/developers/revenue
   *
   * Returns the authenticated developer's revenue summary and
   * a paginated list of settlements.
   */
  router.get('/revenue', requireAuth, (req: Request, res: Response) => {
    const developerId = req.developerId!;

    let limit = parseInt(req.query.limit as string, 10);
    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    let offset = parseInt(req.query.offset as string, 10);
    if (isNaN(offset) || offset < 0) offset = 0;

    // Fetch settlements
    const allSettlements = settlementStore.getDeveloperSettlements(developerId);
    const settlements = allSettlements.slice(offset, offset + limit);
    const total = allSettlements.length;

    // Calculate aggregated revenue
    const completedTotal = allSettlements
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => sum + s.amount, 0);

    const pendingTotal = allSettlements
      .filter((s) => s.status === 'pending')
      .reduce((sum, s) => sum + s.amount, 0);

    // Get unsettled usage to calculate total earned
    const unsettledEvents = usageStore.getUnsettledEvents().filter((e) => e.userId === developerId);
    const unsettledRevenue = unsettledEvents.reduce((sum, e) => sum + e.amountUsdc, 0);

    const totalEarned = completedTotal + unsettledRevenue + pendingTotal;

    const body: DeveloperRevenueResponse = {
      summary: {
        total_earned: totalEarned,
        pending: pendingTotal,
        available_to_withdraw: unsettledRevenue,
      },
      settlements,
      pagination: { limit, offset, total },
    };

    res.json(body);
  });

  return router;
}
