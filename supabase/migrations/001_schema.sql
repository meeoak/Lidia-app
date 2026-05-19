-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Lidia 운영 시스템 - 데이터베이스 스키마
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 사용자 역할 enum
CREATE TYPE user_role AS ENUM ('head', 'manager', 'agent', 'teacher');

-- 케이스 상태 enum
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'on_hold');
CREATE TYPE lesson_result AS ENUM ('success', 'on_hold', 'failed', 'no_show');
CREATE TYPE closing_signal AS ENUM ('strong', 'medium', 'weak');
CREATE TYPE reclose_result AS ENUM ('success', 'in_progress', 'failed');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- profiles 테이블 (Supabase auth.users와 연결)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'agent',
  region TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_active ON profiles(active);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- cases 테이블 (메인 트래커)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_no SERIAL UNIQUE,

  -- 영업 정보
  agent_id UUID NOT NULL REFERENCES profiles(id),
  apply_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- 학부모/자녀
  parent_name TEXT NOT NULL,
  parent_phone TEXT,
  child_name TEXT NOT NULL,
  child_age INT,

  -- 보류 정보
  failure_reason TEXT NOT NULL,
  failure_detail TEXT,
  region TEXT,
  decision_maker TEXT,
  family_info TEXT,

  -- 매니저 검토
  approval_status approval_status DEFAULT 'pending',
  approval_date TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,

  -- 교사 배정
  teacher_id UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ,

  -- 수업 정보
  lesson_date DATE,
  lesson_time TIME,
  lesson_result lesson_result,
  closing_signal closing_signal,
  parent_feedback TEXT,
  next_action TEXT,

  -- 재클로징
  reclose_date DATE,
  reclose_result reclose_result,
  reclose_note TEXT,

  -- 메타
  manager_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cases_agent ON cases(agent_id);
CREATE INDEX idx_cases_teacher ON cases(teacher_id);
CREATE INDEX idx_cases_approval ON cases(approval_status);
CREATE INDEX idx_cases_apply_date ON cases(apply_date);
CREATE INDEX idx_cases_lesson_date ON cases(lesson_date);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- case_activities 테이블 (활동 로그)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE case_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id),
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_case ON case_activities(case_id);
CREATE INDEX idx_activities_actor ON case_activities(actor_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- updated_at 자동 갱신 트리거
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 회원가입 시 프로필 자동 생성
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'agent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 헬퍼 뷰: 케이스 + 사용자 정보
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE VIEW cases_with_users AS
SELECT
  c.*,
  a.full_name AS agent_name,
  a.email AS agent_email,
  t.full_name AS teacher_name,
  t.email AS teacher_email,
  m.full_name AS approver_name,
  CASE
    WHEN c.approval_status = 'approved' AND c.lesson_result IS NULL
      THEN GREATEST(0, 3 - EXTRACT(DAY FROM NOW() - c.approval_date)::INT)
    ELSE NULL
  END AS d_day_remaining
FROM cases c
LEFT JOIN profiles a ON c.agent_id = a.id
LEFT JOIN profiles t ON c.teacher_id = t.id
LEFT JOIN profiles m ON c.approved_by = m.id;
