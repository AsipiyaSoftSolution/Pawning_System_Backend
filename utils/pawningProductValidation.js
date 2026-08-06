import {
  INTEREST_METHOD_AMOUNT,
  INTEREST_METHOD_PERIOD,
  isStageInterestMethod,
  isUntilSettlement,
  isValidInterestMethod,
} from "./pawningProductConstants.js";

const MAX_STAGES = 4;

const toNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const label = (index) => `Product item ${index + 1}`;

const validateStageRates = (plan, index, prefix, count, errors) => {
  let previousStart = null;
  for (let stage = 1; stage <= count; stage += 1) {
    const rateKey = prefix === "stage" ? `stage${stage}Interest` : `${prefix}${stage}`;
    const rate = toNumber(plan[rateKey]);
    if (rate === null) {
      errors.push(`${label(index)}: stage ${stage} rate is required.`);
    } else if (rate < 0) {
      errors.push(`${label(index)}: stage ${stage} rate cannot be negative.`);
    } else if (rate > 100) {
      errors.push(`${label(index)}: stage ${stage} rate cannot exceed 100%.`);
    }

    const start = toNumber(plan[`${prefix}${stage}StartDate`]);
    if (stage === 1) {
      if (start !== 0) {
        errors.push(`${label(index)}: stage 1 must start on day 0.`);
      }
    } else if (start === null) {
      errors.push(`${label(index)}: stage ${stage} start day is required.`);
    } else if (previousStart !== null && start <= previousStart) {
      errors.push(
        `${label(index)}: stage ${stage} must start after stage ${stage - 1}.`,
      );
    }
    if (start !== null) previousStart = start;

    const end = plan[`${prefix}${stage}EndDate`];
    const isLastStage = stage === count;
    if (!isLastStage && !isUntilSettlement(end)) {
      const endNum = toNumber(end);
      if (endNum === null) {
        errors.push(`${label(index)}: stage ${stage} end day is required.`);
      } else if (start !== null && endNum < start) {
        errors.push(
          `${label(index)}: stage ${stage} end day must be on or after its start day.`,
        );
      }
    }
  }
};

const validateRange = (plan, index, minKey, maxKey, fieldLabel, errors) => {
  const min = toNumber(plan[minKey]);
  const max = toNumber(plan[maxKey]);

  if (min === null) {
    errors.push(`${label(index)}: minimum ${fieldLabel} is required.`);
  } else if (min < 0) {
    errors.push(`${label(index)}: minimum ${fieldLabel} cannot be negative.`);
  }

  if (max === null) {
    errors.push(`${label(index)}: maximum ${fieldLabel} is required.`);
  } else if (max < 0) {
    errors.push(`${label(index)}: maximum ${fieldLabel} cannot be negative.`);
  }

  if (min !== null && max !== null && max < min) {
    errors.push(
      `${label(index)}: maximum ${fieldLabel} must be greater than or equal to the minimum.`,
    );
  }

  return { min, max };
};

const validateNoOverlaps = (ranges, fieldLabel, errors) => {
  const sorted = [...ranges].sort((a, b) => a.min - b.min);
  for (let i = 1; i < sorted.length; i += 1) {
    const previous = sorted[i - 1];
    const current = sorted[i];
    if (current.min <= previous.max) {
      errors.push(
        `${fieldLabel} ranges overlap between product items ${previous.index + 1} and ${current.index + 1}.`,
      );
    }
  }
};

/**
 * Validate a pawning product create/update payload.
 * Returns an array of human readable error messages (empty when valid).
 */
export const validatePawningProductPayload = (data) => {
  const errors = [];

  if (!data || typeof data !== "object") {
    return ["Product data is required."];
  }

  if (!data.productName || String(data.productName).trim().length < 3) {
    errors.push("Product name must be at least 3 characters.");
  }

  if (!isValidInterestMethod(data.interestMethod)) {
    errors.push(
      `Interest method must be "${INTEREST_METHOD_PERIOD}" or "${INTEREST_METHOD_AMOUNT}".`,
    );
  }

  const plans = Array.isArray(data.productItems) ? data.productItems : [];
  if (plans.length === 0) {
    errors.push("At least one product item is required.");
    return errors;
  }

  const isPeriodMode = data.interestMethod === INTEREST_METHOD_PERIOD;
  const periodRangesByType = new Map();
  const amountRanges = [];

  plans.forEach((plan, index) => {
    if (!plan || typeof plan !== "object") {
      errors.push(`${label(index)}: invalid product item.`);
      return;
    }

    if (isPeriodMode) {
      if (!plan.periodType) {
        errors.push(`${label(index)}: period type is required.`);
      }
      const { min, max } = validateRange(
        plan,
        index,
        "minPeriod",
        "maxPeriod",
        "period",
        errors,
      );
      if (min !== null && max !== null && plan.periodType) {
        const key = String(plan.periodType);
        if (!periodRangesByType.has(key)) periodRangesByType.set(key, []);
        periodRangesByType.get(key).push({ min, max, index });
      }
    } else {
      const { min, max } = validateRange(
        plan,
        index,
        "minAmount",
        "maxAmount",
        "amount",
        errors,
      );
      if (min !== null && max !== null) amountRanges.push({ min, max, index });
    }

    if (isStageInterestMethod(plan.interestApplicableMethod)) {
      const stages = toNumber(plan.numberOfStages);
      if (stages === null || stages < 2 || stages > MAX_STAGES) {
        errors.push(
          `${label(index)}: stage-wise interest needs between 2 and ${MAX_STAGES} stages.`,
        );
      } else {
        validateStageRates(plan, index, "stage", stages, errors);
      }
    } else {
      const interest = toNumber(plan.interest);
      if (interest === null) {
        errors.push(`${label(index)}: interest rate is required.`);
      } else if (interest < 0) {
        errors.push(`${label(index)}: interest rate cannot be negative.`);
      } else if (interest > 100) {
        errors.push(`${label(index)}: interest rate cannot exceed 100%.`);
      }
    }

    const lateChargeStages = toNumber(plan.numberOfLateChargeStages);
    if (lateChargeStages !== null && lateChargeStages > 0) {
      if (lateChargeStages > MAX_STAGES) {
        errors.push(
          `${label(index)}: late charge cannot have more than ${MAX_STAGES} stages.`,
        );
      } else {
        validateStageRates(
          plan,
          index,
          "lateChargeStage",
          lateChargeStages,
          errors,
        );
      }
    } else {
      const flatLateCharge = toNumber(plan.lateChargePerDay);
      if (flatLateCharge !== null && flatLateCharge < 0) {
        errors.push(`${label(index)}: late charge cannot be negative.`);
      }
    }

    const serviceChargeValue = toNumber(plan.serviceChargeValue);
    if (serviceChargeValue !== null && serviceChargeValue < 0) {
      errors.push(`${label(index)}: service charge cannot be negative.`);
    }
    if (
      plan.serviceChargeValueType === "percentage" &&
      serviceChargeValue !== null &&
      serviceChargeValue > 100
    ) {
      errors.push(`${label(index)}: service charge percentage cannot exceed 100%.`);
    }
  });

  if (isPeriodMode) {
    for (const [periodType, ranges] of periodRangesByType) {
      validateNoOverlaps(ranges, `Period (${periodType})`, errors);
    }
  } else {
    validateNoOverlaps(amountRanges, "Pawning amount", errors);
  }

  return errors;
};
