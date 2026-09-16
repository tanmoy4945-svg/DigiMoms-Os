import { Restaurant } from '../types';

export interface SubscriptionStatusDetails {
  subEndDate: number;
  formattedEndDate: string;
  isTrialActive: boolean;
  isFreeActive: boolean;
  isSubActive: boolean;
  isSuspended: boolean;
  isExpired: boolean;
  diffDays: number;
  daysAgo: number;
  expiryBadgeText: string;
  expiryDescriptionText: string;
  isExpiringSoon: boolean;
  monthlyFee: number;
}

/**
 * Calculates complete, accurate subscription and plan status details for a restaurant.
 * Completely eliminates hardcoded gateway names and prevents "Expired Today" errors
 * when a plan expired days or weeks in the past.
 */
export function getRestaurantSubscriptionDetails(
  restaurant: Restaurant | null | undefined,
  referenceNow: number = Date.now()
): SubscriptionStatusDetails {
  const defaultMonthlyFee = restaurant?.monthly_subscription_fee || 999;

  if (!restaurant) {
    return {
      subEndDate: referenceNow,
      formattedEndDate: new Date(referenceNow).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      isTrialActive: false,
      isFreeActive: false,
      isSubActive: false,
      isSuspended: false,
      isExpired: true,
      diffDays: 0,
      daysAgo: 0,
      expiryBadgeText: 'Inactive',
      expiryDescriptionText: 'No active subscription plan found.',
      isExpiringSoon: false,
      monthlyFee: defaultMonthlyFee
    };
  }

  const now = referenceNow;
  const isSuspended = restaurant.status === 'suspended';

  const isTrialActive =
    !isSuspended &&
    restaurant.trial_status === 'active' &&
    new Date(restaurant.trial_end || 0).getTime() > now;

  const isFreeActive =
    !isSuspended &&
    restaurant.free_offer_status === 'active' &&
    new Date(restaurant.free_offer_end || 0).getTime() > now;

  const isSubActive =
    !isSuspended &&
    restaurant.status === 'active' &&
    new Date(restaurant.subscription_end || 0).getTime() > now;

  // Determine effective subscription end date across paid subscription, trial, and free offers
  let subEndDate = new Date(restaurant.subscription_end || now).getTime();
  if (restaurant.trial_end) {
    const trialEndMs = new Date(restaurant.trial_end).getTime();
    if (isTrialActive || trialEndMs > subEndDate) {
      subEndDate = Math.max(subEndDate, trialEndMs);
    }
  }
  if (restaurant.free_offer_end) {
    const freeEndMs = new Date(restaurant.free_offer_end).getTime();
    if (isFreeActive || freeEndMs > subEndDate) {
      subEndDate = Math.max(subEndDate, freeEndMs);
    }
  }

  const formattedEndDate = new Date(subEndDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Check if expired
  const isExpired =
    isSuspended ||
    restaurant.status === 'inactive' ||
    restaurant.status === 'expired' ||
    (!isTrialActive && !isFreeActive && !isSubActive);

  // Time difference calculations
  const diffMs = subEndDate - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const daysAgo = Math.max(0, Math.floor((now - subEndDate) / (1000 * 60 * 60 * 24)));

  let expiryBadgeText = '';
  let expiryDescriptionText = '';

  if (isSuspended) {
    expiryBadgeText = 'Account Suspended';
    expiryDescriptionText = 'Your restaurant account has been suspended by administration. All operations and logins are blocked.';
  } else if (isExpired) {
    if (daysAgo === 0) {
      expiryBadgeText = 'Expired Today';
    } else if (daysAgo === 1) {
      expiryBadgeText = 'Expired Yesterday';
    } else {
      expiryBadgeText = `Expired ${daysAgo} Days Ago`;
    }
    expiryDescriptionText = `Your monthly plan expired on ${formattedEndDate} (${expiryBadgeText}). Pay ₹${defaultMonthlyFee} online to reactivate your digital menu, QR ordering, and all management features.`;
  } else {
    // Active plan
    if (diffDays <= 0) {
      expiryBadgeText = 'Expires Today';
    } else if (diffDays === 1) {
      expiryBadgeText = '1 Day Remaining';
    } else {
      expiryBadgeText = `${diffDays} Days Remaining`;
    }
    expiryDescriptionText = `Your monthly plan ends on ${formattedEndDate} (${expiryBadgeText}). Pay ₹${defaultMonthlyFee} online to keep your digital menu & QR ordering active without interruption.`;
  }

  const isExpiringSoon = !isExpired && !isSuspended && diffDays <= 7 && diffDays >= 0;

  return {
    subEndDate,
    formattedEndDate,
    isTrialActive,
    isFreeActive,
    isSubActive,
    isSuspended,
    isExpired,
    diffDays,
    daysAgo,
    expiryBadgeText,
    expiryDescriptionText,
    isExpiringSoon,
    monthlyFee: defaultMonthlyFee
  };
}
