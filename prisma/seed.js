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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    // Create skills
    const skills = await createSkills();
    console.log(`✅ Created ${skills.length} skills`);
    // Create questions
    const questions = await createQuestions(skills);
    console.log(`✅ Created ${questions.length} questions`);
    // Create a demo user
    const demoUser = await createDemoUser();
    console.log('✅ Created demo user');
    console.log('🎉 Database seeding completed!');
}
async function createSkills() {
    const skillsData = [
        // Technical Skills
        { name: 'JavaScript Fundamentals', category: 'technical', description: 'Core JavaScript concepts, ES6+, closures, hoisting' },
        { name: 'TypeScript', category: 'technical', description: 'TypeScript syntax, interfaces, generics, type safety' },
        { name: 'React', category: 'technical', description: 'React hooks, state management, component lifecycle' },
        { name: 'Node.js', category: 'technical', description: 'Node.js runtime, modules, async programming' },
        { name: 'Database Design', category: 'technical', description: 'Schema design, normalization, relationships' },
        { name: 'SQL', category: 'technical', description: 'SQL queries, joins, indexes, transactions' },
        { name: 'PostgreSQL', category: 'technical', description: 'PostgreSQL specific features, performance tuning' },
        { name: 'API Design', category: 'technical', description: 'REST APIs, HTTP methods, status codes, authentication' },
        { name: 'Authentication & Authorization', category: 'technical', description: 'JWT, OAuth, session management, security' },
        { name: 'Concurrency & Race Conditions', category: 'technical', description: 'Threading, locks, atomic operations, consistency' },
        { name: 'Error Handling', category: 'technical', description: 'Exception handling, validation, graceful degradation' },
        { name: 'Testing', category: 'technical', description: 'Unit testing, integration testing, mocking' },
        { name: 'Performance Optimization', category: 'technical', description: 'Caching, query optimization, scalability' },
        // Problem Solving
        { name: 'Algorithm Design', category: 'problem-solving', description: 'Algorithm complexity, data structures' },
        { name: 'System Architecture', category: 'problem-solving', description: 'Scalable system design, microservices, distributed systems' },
        { name: 'Debugging', category: 'problem-solving', description: 'Problem diagnosis, root cause analysis' },
        { name: 'Trade-off Analysis', category: 'problem-solving', description: 'Evaluating alternatives, cost-benefit analysis' },
        // Communication
        { name: 'Technical Communication', category: 'communication', description: 'Explaining complex concepts clearly' },
        { name: 'Code Documentation', category: 'communication', description: 'Writing clear, maintainable code and documentation' },
        // Domain Knowledge
        { name: 'Fintech Domain', category: 'domain', description: 'Payment systems, financial regulations, security' },
        { name: 'SaaS Architecture', category: 'domain', description: 'Multi-tenancy, subscription billing, scaling' },
    ];
    const skills = [];
    for (const skillData of skillsData) {
        const skill = await prisma.skill.upsert({
            where: { name: skillData.name },
            update: skillData,
            create: skillData,
        });
        skills.push(skill);
    }
    return skills;
}
async function createQuestions(skills) {
    const questionsData = [
        // Backend Implementation Questions
        {
            title: 'Wallet Transfer Implementation',
            content: 'You are building a wallet service for a fintech app. A user wants to transfer ₦10,000 to another user. How would you design the transfer endpoint to ensure money is not lost or duplicated, even with concurrent requests?',
            difficulty: 'mid-level',
            type: 'implementation',
            technology: 'nodejs',
            industry: 'fintech',
            expectedAnswer: 'Use database transactions, row locking (SELECT FOR UPDATE), idempotency keys, proper error handling with rollback, and validation of sufficient balance before transfer.',
            followUpHints: [
                'Which SQL statement would you use to lock the wallet row?',
                'How would you handle the case where the debit succeeds but credit fails?',
                'What happens if two requests arrive simultaneously?',
                'How would you implement idempotency?',
                'Show me the actual Node.js code using pg or Prisma.'
            ],
            timeLimit: 900,
            skillNames: ['Concurrency & Race Conditions', 'Database Design', 'SQL', 'PostgreSQL', 'Node.js', 'Fintech Domain', 'Error Handling']
        },
        {
            title: 'JWT Authentication Middleware',
            content: 'Implement a middleware function in Express.js that validates JWT tokens. The middleware should extract the token from the Authorization header, verify it, and attach the user information to the request object.',
            difficulty: 'junior',
            type: 'coding',
            technology: 'nodejs',
            expectedAnswer: 'Extract Bearer token from header, use jsonwebtoken library to verify, handle errors gracefully, attach decoded user to req.user, call next() on success.',
            followUpHints: [
                'How do you extract the token from "Bearer <token>" format?',
                'What happens if the token is expired or invalid?',
                'How would you handle missing Authorization header?',
                'Show me the actual middleware function implementation.',
                'How would you test this middleware?'
            ],
            timeLimit: 600,
            skillNames: ['Authentication & Authorization', 'Node.js', 'API Design', 'Error Handling', 'Testing']
        },
        {
            title: 'React State Management',
            content: 'You have a React component that needs to fetch user data when it mounts and display loading states. How would you implement this using hooks, and how would you handle errors?',
            difficulty: 'junior',
            type: 'implementation',
            technology: 'react',
            expectedAnswer: 'Use useEffect for mounting, useState for data/loading/error states, try-catch for error handling, cleanup function to prevent memory leaks.',
            followUpHints: [
                'Which hooks would you use and why?',
                'How do you prevent the component from updating state after unmounting?',
                'What happens if the API call takes too long?',
                'How would you implement retry functionality?',
                'Show me the actual React component code.'
            ],
            timeLimit: 600,
            skillNames: ['React', 'JavaScript Fundamentals', 'Error Handling', 'Technical Communication']
        },
        {
            title: 'Database Query Optimization',
            content: 'You have a slow query that joins users, orders, and products tables to get a user\'s order history. The query takes 5 seconds with 100k users. How would you optimize it?',
            difficulty: 'senior',
            type: 'concept',
            technology: 'postgresql',
            expectedAnswer: 'Analyze query plan, add indexes on join columns and WHERE clauses, consider denormalization, pagination, query result caching, and potentially splitting into multiple queries.',
            followUpHints: [
                'How would you identify which part of the query is slow?',
                'What indexes would you create and why?',
                'How do you handle pagination efficiently?',
                'When would you consider denormalization?',
                'Show me the optimized SQL query.'
            ],
            timeLimit: 900,
            skillNames: ['SQL', 'PostgreSQL', 'Performance Optimization', 'Database Design', 'Trade-off Analysis']
        },
        {
            title: 'Multi-tenant SaaS Architecture',
            content: 'Design a multi-tenant SaaS application where each customer\'s data is isolated. How would you structure the database and ensure data security between tenants?',
            difficulty: 'senior',
            type: 'system-design',
            technology: null,
            industry: 'saas',
            expectedAnswer: 'Consider tenant isolation strategies: separate databases, shared database with tenant ID, or schema-based isolation. Implement row-level security, proper indexing, and access controls.',
            followUpHints: [
                'What are the trade-offs between different isolation strategies?',
                'How would you prevent tenant A from accessing tenant B\'s data?',
                'How do you handle database migrations across tenants?',
                'What happens when a tenant needs custom features?',
                'How would you implement this with your preferred technology stack?'
            ],
            timeLimit: 1200,
            skillNames: ['System Architecture', 'Database Design', 'SaaS Architecture', 'Trade-off Analysis', 'Technical Communication']
        },
        {
            title: 'Async Programming in JavaScript',
            content: 'Explain the difference between Promises and async/await. When would you use one over the other? Provide examples of error handling for both approaches.',
            difficulty: 'mid-level',
            type: 'concept',
            technology: 'javascript',
            expectedAnswer: 'Promises are the underlying mechanism, async/await is syntactic sugar. Use Promises for functional composition, async/await for linear code flow. Both need try-catch or .catch() for errors.',
            followUpHints: [
                'How do you handle multiple concurrent async operations?',
                'What is Promise.all() and when would you use it?',
                'How do you avoid callback hell?',
                'Show me error handling examples for both approaches.',
                'What happens if you don\'t await a Promise?'
            ],
            timeLimit: 600,
            skillNames: ['JavaScript Fundamentals', 'Node.js', 'Error Handling', 'Technical Communication']
        }
    ];
    const questions = [];
    for (const questionData of questionsData) {
        const { skillNames, ...questionWithoutSkills } = questionData;
        const question = await prisma.question.upsert({
            where: {
                title: questionData.title
            },
            update: questionWithoutSkills,
            create: questionWithoutSkills,
        });
        // Connect skills to the question
        for (const skillName of skillNames) {
            const skill = skills.find(s => s.name === skillName);
            if (skill) {
                await prisma.questionSkill.upsert({
                    where: {
                        questionId_skillId: {
                            questionId: question.id,
                            skillId: skill.id,
                        }
                    },
                    update: {},
                    create: {
                        questionId: question.id,
                        skillId: skill.id,
                    }
                });
            }
        }
        questions.push(question);
    }
    return questions;
}
async function createDemoUser() {
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'demo@interviewcoach.com' },
        update: {},
        create: {
            email: 'demo@interviewcoach.com',
            password: hashedPassword,
            firstName: 'Demo',
            lastName: 'User',
        },
    });
    // Create a sample profile
    await prisma.candidateProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            targetRole: 'backend',
            experienceLevel: 'mid-level',
            industry: 'fintech',
            interviewMode: 'practice',
            durationMinutes: 30,
            technologies: {
                create: [
                    { technology: 'nodejs' },
                    { technology: 'javascript' },
                    { technology: 'postgresql' },
                    { technology: 'react' },
                ]
            },
            focusAreas: {
                create: [
                    { focusArea: 'practical-implementation' },
                    { focusArea: 'databases' },
                    { focusArea: 'system-design' },
                ]
            }
        },
    });
    return user;
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map