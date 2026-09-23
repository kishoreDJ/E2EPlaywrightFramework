import { z } from 'zod';

const ApplicationCategory = z.enum(['B2C', 'B2B_CIBS', 'B2B_PALM', 'B2B_OASYS']);

export const RegistrationRecordSchema = z.object({
  applicationId: z.string(),
  applicationName: z.string(),
  supportEmail: z.string().email(),
  applicationCategory: z.array(ApplicationCategory),
  status: z.string(),
  createdBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedBy: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const GetListResponseSchema = z.object({
  data: z.object({
    type: z.string(),
    attributes: z.object({
      payload: z.object({
        dataPrivacyRegistration: z.array(RegistrationRecordSchema),
        totalPages: z.number(),
        currentPage: z.number(),
      }),
    }),
  }),
});

export const WriteResponseSchema = z.object({
  data: z.object({
    attributes: z.object({
      payload: RegistrationRecordSchema,
    }),
  }),
});

export const ErrorResponseSchema = z.object({
  error: z.object({
    id: z.string(),
    attributes: z.object({
      payload: z.object({
        errorMessage: z.string(),
      }),
    }),
  }),
});
