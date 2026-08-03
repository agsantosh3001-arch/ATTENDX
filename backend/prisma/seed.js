"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function seedData() {
    console.log('Starting seed process...');
    // 1. Office Settings (Upsert single settings row)
    const officeSettings = await prisma.officeSettings.findFirst();
    if (!officeSettings) {
        await prisma.officeSettings.create({
            data: {
                officeLatitude: 22.5726,
                officeLongitude: 88.3639,
                allowedRadiusMeters: 150,
                gpsAccuracyThresholdMeters: 50,
                officeStartTime: '09:00',
                officeEndTime: '18:00',
                timezone: 'Asia/Kolkata',
            },
        });
        console.log('Created default OfficeSettings.');
    }
    // 2. Admin User
    const adminPasswordHash = await bcryptjs_1.default.hash('Admin@123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@attendx.com' },
        update: {
            passwordHash: adminPasswordHash,
            role: 'admin',
            status: 'approved',
        },
        create: {
            email: 'admin@attendx.com',
            fullName: 'System Administrator',
            passwordHash: adminPasswordHash,
            role: 'admin',
            status: 'approved',
            department: 'Management',
            designation: 'Administrator',
        },
    });
    console.log(`Admin user created/updated: ${admin.email}`);
    // 3. Test Employees (5 realistic Indian profiles)
    const employeeData = [
        {
            email: 'rajesh.sharma@attendx.com',
            fullName: 'Rajesh Sharma',
            department: 'Engineering',
            designation: 'Senior Developer',
            age: 29,
            phoneNumber: '+919876543210',
            googleId: 'mock_google_rajesh',
        },
        {
            email: 'priya.patel@attendx.com',
            fullName: 'Priya Patel',
            department: 'HR',
            designation: 'HR Specialist',
            age: 27,
            phoneNumber: '+919876543211',
            googleId: 'mock_google_priya',
        },
        {
            email: 'amit.verma@attendx.com',
            fullName: 'Amit Verma',
            department: 'Product',
            designation: 'Product Manager',
            age: 32,
            phoneNumber: '+919876543212',
            googleId: 'mock_google_amit',
        },
        {
            email: 'ananya.sen@attendx.com',
            fullName: 'Ananya Sen',
            department: 'Marketing',
            designation: 'Marketing Lead',
            age: 26,
            phoneNumber: '+919876543213',
            googleId: 'mock_google_ananya',
        },
        {
            email: 'vikram.malhotra@attendx.com',
            fullName: 'Vikram Malhotra',
            department: 'Operations',
            designation: 'Operations Associate',
            age: 30,
            phoneNumber: '+919876543214',
            googleId: 'mock_google_vikram',
        },
    ];
    const employees = [];
    for (const emp of employeeData) {
        const created = await prisma.user.upsert({
            where: { email: emp.email },
            update: {
                status: 'approved',
                department: emp.department,
                designation: emp.designation,
            },
            create: {
                email: emp.email,
                fullName: emp.fullName,
                googleId: emp.googleId,
                role: 'employee',
                status: 'approved',
                department: emp.department,
                designation: emp.designation,
                age: emp.age,
                phoneNumber: emp.phoneNumber,
            },
        });
        employees.push(created);
    }
    console.log(`Seeded ${employees.length} test employees.`);
    // 4. 30 Days of Past Attendance Data
    const lateReasons = [
        'Traffic delay on Western Express Highway',
        'Heavy rain causing metro delay',
        'Medical appointment in the morning',
        'Vehicle breakdown en route to office',
        'Personal emergency at home',
    ];
    const today = new Date();
    for (let i = 30; i >= 1; i--) {
        const dateObj = new Date();
        dateObj.setDate(today.getDate() - i);
        dateObj.setHours(0, 0, 0, 0);
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6)
            continue;
        for (const emp of employees) {
            const rand = Math.sin(i * 10 + emp.email.length) * 10000;
            const normalizedRand = Math.abs(rand - Math.floor(rand));
            if (normalizedRand < 0.1) {
                // Absent
                await prisma.attendance.upsert({
                    where: {
                        employeeId_date: {
                            employeeId: emp.id,
                            date: dateObj,
                        },
                    },
                    update: {},
                    create: {
                        employeeId: emp.id,
                        date: dateObj,
                        status: 'absent',
                        isLate: false,
                    },
                });
            }
            else if (normalizedRand < 0.3) {
                // Late
                const checkInHour = 9;
                const checkInMin = Math.floor(normalizedRand * 60) + 15;
                const checkInTime = new Date(dateObj);
                checkInTime.setHours(checkInHour, checkInMin, 0, 0);
                const workHours = 8;
                const workMins = Math.floor(normalizedRand * 30);
                const checkOutTime = new Date(checkInTime.getTime() + (workHours * 60 + workMins) * 60000);
                const workingMinutes = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / 60000);
                const hours = Math.floor(workingMinutes / 60);
                const mins = workingMinutes % 60;
                const formattedHours = `${hours}h ${mins}m`;
                const reasonIndex = Math.floor(normalizedRand * lateReasons.length);
                await prisma.attendance.upsert({
                    where: {
                        employeeId_date: {
                            employeeId: emp.id,
                            date: dateObj,
                        },
                    },
                    update: {},
                    create: {
                        employeeId: emp.id,
                        date: dateObj,
                        checkInTime,
                        checkInLatitude: 22.5726,
                        checkInLongitude: 88.3639,
                        checkInAccuracy: 25.0,
                        checkOutTime,
                        checkOutLatitude: 22.5726,
                        checkOutLongitude: 88.3639,
                        checkOutAccuracy: 20.0,
                        status: 'late',
                        isLate: true,
                        lateReason: lateReasons[reasonIndex],
                        workingMinutes,
                        formattedHours,
                    },
                });
            }
            else {
                // Present
                const checkInHour = 8;
                const checkInMin = Math.floor(normalizedRand * 30) + 30;
                const checkInTime = new Date(dateObj);
                checkInTime.setHours(checkInHour, checkInMin, 0, 0);
                const workHours = 8 + Math.floor(normalizedRand * 2);
                const workMins = Math.floor(normalizedRand * 40);
                const checkOutTime = new Date(checkInTime.getTime() + (workHours * 60 + workMins) * 60000);
                const workingMinutes = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / 60000);
                const hours = Math.floor(workingMinutes / 60);
                const mins = workingMinutes % 60;
                const formattedHours = `${hours}h ${mins}m`;
                await prisma.attendance.upsert({
                    where: {
                        employeeId_date: {
                            employeeId: emp.id,
                            date: dateObj,
                        },
                    },
                    update: {},
                    create: {
                        employeeId: emp.id,
                        date: dateObj,
                        checkInTime,
                        checkInLatitude: 22.5726,
                        checkInLongitude: 88.3639,
                        checkInAccuracy: 15.0,
                        checkOutTime,
                        checkOutLatitude: 22.5726,
                        checkOutLongitude: 88.3639,
                        checkOutAccuracy: 15.0,
                        status: 'present',
                        isLate: false,
                        workingMinutes,
                        formattedHours,
                    },
                });
            }
        }
    }
    console.log('Seeded 30 days of attendance history for all employees.');
}
async function startAndSeed() {
    let embeddedPg = null;
    try {
        await prisma.$connect();
        console.log('Connected to existing PostgreSQL server.');
    }
    catch (err) {
        console.log('No PostgreSQL server found. Starting embedded PostgreSQL on port 5432...');
        try {
            // @ts-ignore
            const { default: EmbeddedPostgres } = await Promise.resolve().then(() => __importStar(require('embedded-postgres')));
            embeddedPg = new EmbeddedPostgres({
                port: 5432,
                user: 'postgres',
                password: 'postgres',
                database: 'attendx',
                persistent: true,
            });
            await embeddedPg.initialise();
            await embeddedPg.start();
            await embeddedPg.createDatabase('attendx');
            console.log('Embedded PostgreSQL server started.');
        }
        catch (e) {
            console.warn('Embedded Postgres warning:', e?.message || e);
        }
    }
    try {
        await seedData();
    }
    catch (e) {
        console.error('Seeding error:', e);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
startAndSeed();
