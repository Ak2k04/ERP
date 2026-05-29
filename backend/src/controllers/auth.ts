import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../services/prisma';
import asyncHandler from '../utils/asyncHandler';
import { AppError } from '../middleware/error';
import { generateToken, hashToken } from '../utils/token';
import * as emailService from '../services/email';
import logger from '../utils/logger';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, password, role, department, employeeId, reason, adminCode } = req.body;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  // Role validation
  if (role === 'SUPER_ADMIN') {
    if (adminCode !== process.env.SUPER_ADMIN_INVITE_CODE) {
      throw new AppError('Invalid admin invitation code', 403);
    }
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      role,
      department,
      employeeId,
      reason,
      status: 'PENDING_VERIFICATION',
    },
  });

  // Verification Token
  const { token, hash } = generateToken();
  await prisma.token.create({
    data: {
      userId: user.id,
      type: 'EMAIL_VERIFICATION',
      tokenHash: hash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    },
  });

  // Send Email
  await emailService.sendVerificationEmail(email, fullName, token);

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.emailVerified) {
    throw new AppError('Please verify your email first', 403);
  }

  if (user.status === 'PENDING_APPROVAL') {
    throw new AppError('Your account is pending approval', 403);
  }

  if (user.status === 'REJECTED') {
    throw new AppError('Your account request was rejected', 403);
  }

  if (!user.isActive || user.status === 'DEACTIVATED') {
    throw new AppError('This account has been deactivated', 403);
  }

  // Auth tokens
  const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '15min' });
  const refreshTokenExpiry = rememberMe ? '30d' : '7d';
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: refreshTokenExpiry });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  res.cookie('accessToken', accessToken, COOKIE_OPTIONS);
  res.cookie('refreshToken', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  const hash = hashToken(token);

  const dbToken = await prisma.token.findUnique({
    where: { tokenHash: hash },
    include: { user: true },
  });

  if (!dbToken || dbToken.type !== 'EMAIL_VERIFICATION' || dbToken.expiresAt < new Date()) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  // Check if first SuperAdmin
  const superAdminCount = await prisma.user.count({
    where: { role: 'SUPER_ADMIN', emailVerified: true },
  });

  let nextStatus: any = 'PENDING_APPROVAL';
  if (dbToken.user.role === 'SUPER_ADMIN' && superAdminCount === 0) {
    nextStatus = 'ACTIVE';
  }

  await prisma.user.update({
    where: { id: dbToken.userId },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: nextStatus,
    },
  });

  await prisma.token.delete({ where: { id: dbToken.id } });

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    status: nextStatus,
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const { token, hash } = generateToken();
    await prisma.token.create({
      data: {
        userId: user.id,
        type: 'PASSWORD_RESET',
        tokenHash: hash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
      },
    });
    await emailService.sendPasswordResetEmail(email, token);
  }

  res.status(200).json({
    success: true,
    message: 'If an account exists with that email, a reset link has been sent.',
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  const hash = hashToken(token);

  const dbToken = await prisma.token.findUnique({
    where: { tokenHash: hash },
  });

  if (!dbToken || dbToken.type !== 'PASSWORD_RESET' || dbToken.expiresAt < new Date()) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: dbToken.userId },
    data: { passwordHash },
  });

  await prisma.token.delete({ where: { id: dbToken.id } });

  res.status(200).json({
    success: true,
    message: 'Password reset successfully',
  });
});

export const logout = (req: Request, res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.status(200).json({ success: true, message: 'Logged out' });
};
