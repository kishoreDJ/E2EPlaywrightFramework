import { z } from 'zod';

export const DoNotSellAddressSchema = z.object({
  addressType: z.enum(['MAILING_ADDRESS', 'BILLING_ADDRESS', 'WEEKEND_ADDRESS']),
  addressLine1: z.string(),
  addressLine2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
});

export const DoNotSellContactPreferenceSchema = z.object({
  preferenceType: z.string(),
  preferenceValue: z.boolean(),
});

export const DoNotSellPayloadSchema = z.object({
  orchestratorRequestId: z.string(),
  dsarRequestId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable().optional(),
  requestStatus: z.string(),
  requestType: z.string(),
  createdDate: z.string(),
  createdBy: z.string(),
  additionalEmailAddresses: z.array(z.string()).optional(),
  addresses: z.array(DoNotSellAddressSchema).optional(),
  contactPreferences: z.array(DoNotSellContactPreferenceSchema).optional(),
  uuid: z.string().optional(),
  verint_cid: z.string().optional(),
  batchId: z.string().nullable().optional(),
});

export const DoNotSellPostResponseSchema = z.object({
  data: z.object({
    attributes: z.object({
      payload: DoNotSellPayloadSchema,
    }),
  }),
});

export const DoNotSellGetByIdResponseSchema = z.object({
  data: z.object({
    attributes: z.object({
      payload: z.object({
        totalPages: z.number().optional(),
        currentPage: z.number().optional(),
        custDataPrivacy: z.array(
          z.object({
            orchestratorRequestId: z.string(),
            dsarRequestId: z.string(),
            firstName: z.string(),
            lastName: z.string(),
            email: z.string().nullable().optional(),
            requestStatus: z.string(),
            requestType: z.string(),
            createdDate: z.string(),
            createdBy: z.string(),
          })
        ).optional(),
      }),
    }),
  }),
});

export const RequestStatusCountSchema = z.object({
  totalRequests: z.number(),
  totalPending: z.number().optional(),
  totalInProgress: z.number().optional(),
  totalCompleted: z.number().optional(),
  totalFailed: z.number().optional(),
});

export const RequestStatusCountResponseSchema = z.object({
  data: z.object({
    attributes: z.object({
      payload: z.object({
        totalRequests: z.number(),
        DSAR_DONOTSELL: RequestStatusCountSchema.optional(),
        DSAR_DELETE: RequestStatusCountSchema.optional(),
        DSAR_ACCESS: RequestStatusCountSchema.optional(),
      }),
    }),
  }),
});
