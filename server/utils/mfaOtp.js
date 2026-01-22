const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail, isSmtpConfigured } = require('./emailService');

const generateOtp = () => {
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(6, '0');
};

const getOtpExpiryMinutes = () => {
  const raw = process.env.MFA_OTP_EXP_MINUTES || '10';
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 60) return 10;
  return n;
};

const sendOtpEmail = async ({ to, otp, expiresMinutes }) => {
  if (!isSmtpConfigured()) {
    throw new Error('SMTP not configured');
  }
  const subject = 'Your ClearPass OTP Code';
  const text = `Your OTP code is ${otp}. It expires in ${expiresMinutes} minutes.`;
  const html = `<p>Your OTP code is <b>${otp}</b>.</p><p>It expires in ${expiresMinutes} minutes.</p>`;

  await sendEmail({ to, subject, text, html });
};

const createOtpChallenge = async ({ db, userId }) => {
  const otp = generateOtp();
  const expiresMinutes = getOtpExpiryMinutes();
  const otp_hash = await bcrypt.hash(otp, 10);
  const expires_at = new Date(Date.now() + expiresMinutes * 60_000);

  await db.execute(
    `UPDATE mfa_otp_challenges SET consumed_at = NOW() WHERE user_id = ? AND consumed_at IS NULL`,
    [userId]
  );

  const [result] = await db.execute(
    `
    INSERT INTO mfa_otp_challenges (user_id, otp_hash, attempts_remaining, expires_at, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `,
    [userId, otp_hash, 5, expires_at]
  );

  const challengeId = result?.insertId;
  return { otp, expiresMinutes, expiresAt: expires_at, challengeId };
};

const verifyOtpChallenge = async ({ db, userId, otp }) => {
  const [rows] = await db.execute(
    `
    SELECT id, otp_hash, attempts_remaining, expires_at, consumed_at
    FROM mfa_otp_challenges
    WHERE user_id = ? AND consumed_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
  `,
    [userId]
  );

  if (!rows.length) return { ok: false, reason: 'no_challenge' };
  const ch = rows[0];
  if (ch.consumed_at) return { ok: false, reason: 'consumed' };
  if (new Date(ch.expires_at).getTime() < Date.now())
    return { ok: false, reason: 'expired', challengeId: ch.id };
  if (ch.attempts_remaining <= 0) return { ok: false, reason: 'locked', challengeId: ch.id };

  const match = await bcrypt.compare(String(otp || ''), ch.otp_hash);
  if (!match) {
    await db.execute(
      `UPDATE mfa_otp_challenges SET attempts_remaining = GREATEST(attempts_remaining - 1, 0) WHERE id = ?`,
      [ch.id]
    );
    return { ok: false, reason: 'invalid', challengeId: ch.id };
  }

  await db.execute(`UPDATE mfa_otp_challenges SET consumed_at = NOW() WHERE id = ?`, [ch.id]);
  return { ok: true, challengeId: ch.id };
};

module.exports = {
  isSmtpConfigured,
  getOtpExpiryMinutes,
  createOtpChallenge,
  verifyOtpChallenge,
  sendOtpEmail,
};
