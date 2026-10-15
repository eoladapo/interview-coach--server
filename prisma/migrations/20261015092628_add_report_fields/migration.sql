-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "candidate_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "target_role" TEXT NOT NULL,
    "experience_level" TEXT NOT NULL,
    "industry" TEXT,
    "interview_mode" TEXT NOT NULL DEFAULT 'mock',
    "duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "candidate_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "candidate_technologies" (
    "profile_id" TEXT NOT NULL,
    "technology" TEXT NOT NULL,

    PRIMARY KEY ("profile_id", "technology"),
    CONSTRAINT "candidate_technologies_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "candidate_focus_areas" (
    "profile_id" TEXT NOT NULL,
    "focus_area" TEXT NOT NULL,

    PRIMARY KEY ("profile_id", "focus_area"),
    CONSTRAINT "candidate_focus_areas_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "user_skill_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "score" REAL,
    "confidence" REAL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_tested" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_skill_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_skill_progress_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "technology" TEXT,
    "industry" TEXT,
    "expected_answer" TEXT,
    "follow_up_hints" TEXT NOT NULL DEFAULT '[]',
    "time_limit" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "question_skills" (
    "question_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,

    PRIMARY KEY ("question_id", "skill_id"),
    CONSTRAINT "question_skills_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "question_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "interview_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "mode" TEXT NOT NULL,
    "target_role" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "technologies" TEXT NOT NULL DEFAULT '[]',
    "industry" TEXT,
    "duration" INTEGER NOT NULL,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "interview_plan" TEXT,
    "started_at" DATETIME,
    "ended_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "interview_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "interview_messages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_id" TEXT NOT NULL,
    "speaker" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'transcript',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "interview_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "interview_questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "asked_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "interview_questions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "interview_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "skill_assessments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "score" REAL,
    "confidence" TEXT DEFAULT 'medium',
    "notes" TEXT,
    "evidence" TEXT NOT NULL DEFAULT '[]',
    "assessed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "skill_assessments_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "skill_assessments_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "interview_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "overall_score" REAL,
    "technical_score" REAL,
    "communication_score" REAL,
    "problem_solving_score" REAL,
    "strengths" TEXT NOT NULL,
    "weaknesses" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "detailed_feedback" TEXT,
    "summary" TEXT,
    "next_steps" TEXT,
    "generated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "interview_reports_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "learning_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "target_skills" TEXT NOT NULL,
    "estimated_hours" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_profiles_user_id_key" ON "candidate_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_skill_progress_user_id_skill_id_key" ON "user_skill_progress"("user_id", "skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "interview_questions_session_id_order_key" ON "interview_questions"("session_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "skill_assessments_session_id_skill_id_key" ON "skill_assessments"("session_id", "skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "interview_reports_session_id_key" ON "interview_reports"("session_id");
