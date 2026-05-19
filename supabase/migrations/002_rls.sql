-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Row Level Security (RLS) 정책
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_activities ENABLE ROW LEVEL SECURITY;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 현재 사용자 역할 확인 헬퍼
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_manager_or_head()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() IN ('manager', 'head');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- profiles 정책
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 모두: 본인 프로필 조회
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 매니저/본부장: 모든 프로필 조회
CREATE POLICY "profiles_select_all_manager"
  ON profiles FOR SELECT
  USING (is_manager_or_head());

-- 에이전트/교사도 다른 프로필 이름은 볼 수 있어야 함 (배정 등)
CREATE POLICY "profiles_select_basic_info"
  ON profiles FOR SELECT
  USING (active = TRUE);

-- 본인 프로필 수정
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 매니저/본부장: 모든 프로필 수정
CREATE POLICY "profiles_update_all_manager"
  ON profiles FOR UPDATE
  USING (is_manager_or_head());

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- cases 정책
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 매니저/본부장: 모든 케이스 조회
CREATE POLICY "cases_select_manager"
  ON cases FOR SELECT
  USING (is_manager_or_head());

-- 에이전트: 본인 케이스만 조회
CREATE POLICY "cases_select_agent"
  ON cases FOR SELECT
  USING (auth.uid() = agent_id);

-- 교사: 본인 배정 케이스만 조회
CREATE POLICY "cases_select_teacher"
  ON cases FOR SELECT
  USING (auth.uid() = teacher_id);

-- 에이전트: 본인 명의로 케이스 생성
CREATE POLICY "cases_insert_agent"
  ON cases FOR INSERT
  WITH CHECK (auth.uid() = agent_id);

-- 매니저/본부장: 케이스 생성 가능 (대리 입력)
CREATE POLICY "cases_insert_manager"
  ON cases FOR INSERT
  WITH CHECK (is_manager_or_head());

-- 매니저/본부장: 모든 케이스 수정
CREATE POLICY "cases_update_manager"
  ON cases FOR UPDATE
  USING (is_manager_or_head());

-- 에이전트: 본인 케이스 일부 필드 수정 (재클로징 결과)
CREATE POLICY "cases_update_agent_own"
  ON cases FOR UPDATE
  USING (auth.uid() = agent_id);

-- 교사: 본인 배정 케이스의 수업 결과 수정
CREATE POLICY "cases_update_teacher_own"
  ON cases FOR UPDATE
  USING (auth.uid() = teacher_id);

-- 매니저/본부장: 케이스 삭제
CREATE POLICY "cases_delete_manager"
  ON cases FOR DELETE
  USING (is_manager_or_head());

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- case_activities 정책
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 케이스 접근 권한이 있으면 활동 로그도 조회
CREATE POLICY "activities_select"
  ON case_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = case_activities.case_id
    )
  );

-- 인증된 사용자는 활동 로그 추가 가능
CREATE POLICY "activities_insert"
  ON case_activities FOR INSERT
  WITH CHECK (auth.uid() = actor_id);
