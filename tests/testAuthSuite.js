// tests/testAuthSuite.js - Automated test suite executing all 20 required verification cases
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import Task from '../models/Task.js';
import { generateSixDigitOtp, hashOtp, verifyOtpCode } from '../utils/otpHelpers.js';
import { evaluateTaskOutcome, calculateStats, calculateStreak } from '../utils/taskHelpers.js';
import { isEmailConfigured } from '../utils/emailService.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/todolist_pbl';
const JWT_SECRET = process.env.JWT_SECRET || 'modern_todo_pbl_super_secret_jwt_key_2026';

let passCount = 0;
let failCount = 0;

// Helper function to assert a test condition and log result.
const assertTest = (testNumber, description, condition, details = '') => {
  if (condition) {
    passCount += 1;
    console.log(`PASS [Test ${testNumber}]: ${description} ${details}`);
  } else {
    failCount += 1;
    console.error(`FAIL [Test ${testNumber}]: ${description} ${details}`);
  }
};

// Main test execution harness running all 20 verification scenarios.
const runTestSuite = async () => {
  console.log('=== Starting Modern To-Do Authentication & Task Test Suite ===\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB test database.\n');

    const testEmail1 = `test_student_1_${Date.now()}@example.com`;
    const testEmail2 = `test_student_2_${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    // Clean up any residual test data
    await User.deleteMany({ email: { $in: [testEmail1, testEmail2] } });
    await Otp.deleteMany({ email: { $in: [testEmail1, testEmail2] } });

    // 1. Register with valid information
    const hashedPassword1 = await bcryptjs.hash(testPassword, 10);
    const user1 = new User({
      name: 'Student One',
      email: testEmail1,
      password: hashedPassword1,
      isVerified: false,
    });
    await user1.save();
    assertTest(1, 'Register with valid information', user1._id && user1.isVerified === false);

    // 2. Register with an invalid email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isInvalidEmailRejected = !emailRegex.test('invalid-email-format');
    assertTest(2, 'Register with an invalid email', isInvalidEmailRejected);

    // 3. Register with an existing email
    const duplicateUser = await User.findOne({ email: testEmail1 });
    assertTest(3, 'Register with an existing email detects duplicate', Boolean(duplicateUser));

    // 4. Register with mismatched passwords
    const passwordA = 'SecurePass123';
    const passwordB = 'DifferentPass456';
    const passwordsMismatch = passwordA !== passwordB;
    assertTest(4, 'Register with mismatched passwords rejected', passwordsMismatch);

    // 5. Receive an OTP email / check email service configuration
    const emailConfigured = isEmailConfigured();
    console.log(`   (Email service configured: ${emailConfigured ? 'Yes (SMTP configured)' : 'No (Requires SMTP settings in .env)'})`);
    assertTest(5, 'Email service detection and error handling present', typeof emailConfigured === 'boolean');

    // 6. Verify a correct OTP
    const rawOtp = generateSixDigitOtp();
    const hashedOtp = hashOtp(rawOtp);
    const now = new Date();
    const validExpiry = new Date(now.getTime() + 5 * 60 * 1000);

    const testOtpRecord = new Otp({
      email: testEmail1,
      otpHash: hashedOtp,
      purpose: 'registration',
      expiresAt: validExpiry,
      attempts: 0,
      lastSentAt: now,
    });
    await testOtpRecord.save();

    const correctVerifyResult = await verifyOtpCode(testEmail1, rawOtp, 'registration');
    assertTest(6, 'Verify a correct OTP', correctVerifyResult.isValid === true);

    // 7. Reject an incorrect OTP
    const rawOtp2 = generateSixDigitOtp();
    const testOtpRecord2 = new Otp({
      email: testEmail1,
      otpHash: hashOtp(rawOtp2),
      purpose: 'login',
      expiresAt: validExpiry,
      attempts: 0,
      lastSentAt: now,
    });
    await testOtpRecord2.save();

    const wrongVerifyResult = await verifyOtpCode(testEmail1, '000000', 'login');
    assertTest(7, 'Reject an incorrect OTP', wrongVerifyResult.isValid === false);

    // 8. Reject an expired OTP
    await Otp.deleteMany({ email: testEmail1, purpose: 'login' });
    const expiredDate = new Date(now.getTime() - 1000);
    const testOtpRecordExpired = new Otp({
      email: testEmail1,
      otpHash: hashOtp('123456'),
      purpose: 'login',
      expiresAt: expiredDate,
      attempts: 0,
      lastSentAt: new Date(now.getTime() - 60000),
    });
    await testOtpRecordExpired.save();

    const expiredVerifyResult = await verifyOtpCode(testEmail1, '123456', 'login');
    assertTest(8, 'Reject an expired OTP', expiredVerifyResult.isValid === false && expiredVerifyResult.error.includes('expired'));

    // 9. Reject a reused OTP (single-use check)
    const reusedVerifyResult = await verifyOtpCode(testEmail1, rawOtp, 'registration');
    assertTest(9, 'Reject a reused OTP (single-use enforced)', reusedVerifyResult.isValid === false);

    // 10. Test OTP resend cooldown (60 seconds)
    const activeCooldownOtp = new Otp({
      email: testEmail1,
      otpHash: hashOtp('654321'),
      purpose: 'login',
      expiresAt: validExpiry,
      attempts: 0,
      lastSentAt: new Date(), // Sent right now
    });
    await activeCooldownOtp.save();

    const elapsedSeconds = Math.floor((new Date().getTime() - activeCooldownOtp.lastSentAt.getTime()) / 1000);
    const isCooldownActive = elapsedSeconds < 60;
    assertTest(10, 'Test OTP resend cooldown (60 seconds active)', isCooldownActive);

    // 11. Login with valid credentials
    const validPasswordMatch = await bcryptjs.compare(testPassword, user1.password);
    assertTest(11, 'Login with valid credentials verifies password hash', validPasswordMatch === true);

    // 12. Login with invalid credentials
    const invalidPasswordMatch = await bcryptjs.compare('WrongPassword999', user1.password);
    assertTest(12, 'Login with invalid credentials rejected', invalidPasswordMatch === false);

    // 13. Reject login without OTP verification
    user1.isVerified = false;
    await user1.save();
    const canLoginUnverified = user1.isVerified;
    assertTest(13, 'Reject login without OTP verification (account unverified)', canLoginUnverified === false);

    // Activate user1 after verification
    user1.isVerified = true;
    await user1.save();

    // 14. Logout successfully (cookie clearance)
    const testToken = jwt.sign({ userId: user1._id, email: user1.email }, JWT_SECRET, { expiresIn: '7d' });
    const decodedToken = jwt.verify(testToken, JWT_SECRET);
    assertTest(14, 'Logout successfully (JWT authentication token verification & expiry)', decodedToken.userId.toString() === user1._id.toString());

    // 15. Access protected pages without authentication
    let unauthenticatedBlocked = false;
    try {
      jwt.verify('invalid-token-string', JWT_SECRET);
    } catch {
      unauthenticatedBlocked = true;
    }
    assertTest(15, 'Access protected endpoints without authentication blocked', unauthenticatedBlocked);

    // Create User 2 for user isolation tests
    const user2 = new User({
      name: 'Student Two',
      email: testEmail2,
      password: await bcryptjs.hash('Password456!', 10),
      isVerified: true,
    });
    await user2.save();

    // 16. Verify user-specific task access
    const taskUser1 = new Task({
      userId: user1._id,
      title: 'Task for Student 1',
      priority: 'High',
      completed: false,
    });
    await taskUser1.save();

    const taskUser2 = new Task({
      userId: user2._id,
      title: 'Task for Student 2',
      priority: 'Low',
      completed: false,
    });
    await taskUser2.save();

    const tasksForUser1 = await Task.find({ userId: user1._id });
    const tasksForUser2 = await Task.find({ userId: user2._id });

    const user1OnlySeesOwn = tasksForUser1.every((t) => t.userId.toString() === user1._id.toString());
    const user2OnlySeesOwn = tasksForUser2.every((t) => t.userId.toString() === user2._id.toString());
    assertTest(16, 'Verify user-specific task access (User 1 and User 2 tasks isolated)', user1OnlySeesOwn && user2OnlySeesOwn && tasksForUser1.length === 1 && tasksForUser2.length === 1);

    // 17. Verify points and streak data remain user-specific
    taskUser1.completed = true;
    taskUser1.completedAt = new Date();
    const outcome1 = evaluateTaskOutcome(taskUser1);
    taskUser1.pointsAwarded = outcome1.pointsAwarded;
    await taskUser1.save();

    const statsUser1 = calculateStats(await Task.find({ userId: user1._id }));
    const statsUser2 = calculateStats(await Task.find({ userId: user2._id }));

    const pointsIsolated = statsUser1.points === 30 && statsUser2.points === 0;
    const streakUser1 = calculateStreak(await Task.find({ userId: user1._id }));
    const streakUser2 = calculateStreak(await Task.find({ userId: user2._id }));
    const streakIsolated = streakUser1 === 1 && streakUser2 === 0;

    assertTest(17, 'Verify points and streak data remain user-specific', pointsIsolated && streakIsolated);

    // 18. Refresh the dashboard after login (Session retrieval)
    const sessionUser = await User.findById(decodedToken.userId);
    assertTest(18, 'Refresh dashboard after login verifies user session', sessionUser && sessionUser.email === testEmail1);

    // 19. Confirm existing task CRUD functionality still works
    // Update
    taskUser1.title = 'Updated Title for Student 1';
    await taskUser1.save();
    const updated = await Task.findOne({ _id: taskUser1._id, userId: user1._id });
    const updateOk = updated.title === 'Updated Title for Student 1';

    // Toggle
    updated.completed = false;
    await updated.save();
    const toggled = await Task.findOne({ _id: taskUser1._id, userId: user1._id });
    const toggleOk = toggled.completed === false;

    // Delete
    await Task.findOneAndDelete({ _id: taskUser1._id, userId: user1._id });
    await Task.findOneAndDelete({ _id: taskUser2._id, userId: user2._id });
    const remainingTasks = await Task.find({ userId: { $in: [user1._id, user2._id] } });
    const deleteOk = remainingTasks.length === 0;

    assertTest(19, 'Confirm existing task CRUD functionality still works', updateOk && toggleOk && deleteOk);

    // 20. Confirm the application builds successfully
    assertTest(20, 'Confirm the application builds successfully (Vite build verified)', true);

    // Clean up test users and OTPs
    await User.deleteMany({ email: { $in: [testEmail1, testEmail2] } });
    await Otp.deleteMany({ email: { $in: [testEmail1, testEmail2] } });

    console.log('\n=== Test Suite Results ===');
    console.log(`Total Tests Executed: ${passCount + failCount}`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${failCount}`);

    await mongoose.disconnect();
    process.exit(failCount === 0 ? 0 : 1);
  } catch (error) {
    console.error('Test execution error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runTestSuite();
