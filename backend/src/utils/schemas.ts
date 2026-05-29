import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    role: z.enum(['SUPER_ADMIN', 'DEPARTMENT_ADMIN']),
    department: z.enum(['PRODUCTION', 'STORES']).optional(),
    employeeId: z.string().optional(),
    reason: z.string().optional(),
    adminCode: z.string().optional(),
  }).refine((data) => {
    if (data.role === 'DEPARTMENT_ADMIN' && !data.department) return false;
    if (data.role === 'DEPARTMENT_ADMIN' && !data.reason) return false;
    return true;
  }, {
    message: 'Department and reason are required for Department Admins',
    path: ['department'],
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
  }),
});
