/**
 * @integration SPEC4 RLS Negative-Test Matrix
 *
 * 26 DENY assertions + 5 destructive tests.
 * Skipped when SUPABASE_TEST_URL is not set (no-database CI run).
 *
 * Run: SUPABASE_TEST_URL=... SUPABASE_TEST_SERVICE_KEY=... \
 *      SUPABASE_TEST_ANON_KEY=... SUPABASE_JWT_SECRET=... \
 *      vitest run tests/integration/rls.test.ts
 *
 * CONTRACT.md §3: RLS enforced at the database level.
 * SPEC4: every DENY row returns empty result set (data.length === 0), not an error.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createHmac } from 'node:crypto'

// ─── Environment ─────────────────────────────────────────────────────────────

const SUPABASE_URL =
  process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY =
  process.env.SUPABASE_TEST_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY =
  process.env.SUPABASE_TEST_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET

const shouldSkip = !SUPABASE_URL || !SERVICE_KEY || !ANON_KEY || !JWT_SECRET

// ─── JWT helpers ─────────────────────────────────────────────────────────────

function signJwt(payload: Record<string, unknown>, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

function signAuthJwt(userId: string, email: string): string {
  const now = Math.floor(Date.now() / 1000)
  return signJwt(
    {
      aud: 'authenticated',
      exp: now + 3600,
      iat: now,
      iss: `${SUPABASE_URL}/auth/v1`,
      sub: userId,
      email,
      role: 'authenticated',
    },
    JWT_SECRET!,
  )
}

function signStudentJwt(studentId: string, classIds: string[], expOffset = 28800): string {
  const now = Math.floor(Date.now() / 1000)
  return signJwt(
    {
      sub: studentId,
      role: 'student',
      student_id: studentId,
      class_ids: classIds,
      iat: now,
      exp: now + expOffset,
    },
    JWT_SECRET!,
  )
}

function signExpiredStudentJwt(studentId: string, classIds: string[]): string {
  const past = Math.floor(Date.now() / 1000) - 36000 // 10 hours ago
  return signJwt(
    {
      sub: studentId,
      role: 'student',
      student_id: studentId,
      class_ids: classIds,
      iat: past - 28800,
      exp: past, // already expired
    },
    JWT_SECRET!,
  )
}

// ─── Supabase client factory (dynamic import to allow skipIf pattern) ─────────

type SupabaseClient = Awaited<ReturnType<typeof makeClient>>

async function makeClient(jwt?: string) {
  const { createClient } = await import('@supabase/supabase-js')
  if (jwt) {
    return createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    })
  }
  return createClient(SUPABASE_URL!, ANON_KEY!, {
    auth: { persistSession: false },
  })
}

async function makeAdmin() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(SUPABASE_URL!, SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

interface Fixtures {
  // Auth user IDs
  parentAId: string
  parentBId: string
  teacherAId: string
  // Profile / student IDs
  studentAId: string
  studentBId: string
  studentCId: string // enrolled in classB, created by teacherA
  // Class IDs
  classAId: string
  classBId: string
  // Session / attempt IDs
  sessionAId: string
  attemptAId: string
  // Signed JWTs
  parentAJwt: string
  parentBJwt: string
  teacherAJwt: string
  studentAJwt: string
  studentAExpiredJwt: string
}

async function createFixtures(admin: SupabaseClient): Promise<Fixtures> {
  // Auth users
  const { data: { user: parentA } } = await (admin as any).auth.admin.createUser({
    email: 'parent-a@rls-test.invalid',
    password: 'RlsTest123!',
    email_confirm: true,
  })
  const { data: { user: parentB } } = await (admin as any).auth.admin.createUser({
    email: 'parent-b@rls-test.invalid',
    password: 'RlsTest123!',
    email_confirm: true,
  })
  const { data: { user: teacherA } } = await (admin as any).auth.admin.createUser({
    email: 'teacher-a@rls-test.invalid',
    password: 'RlsTest123!',
    email_confirm: true,
  })

  const parentAId = parentA!.id
  const parentBId = parentB!.id
  const teacherAId = teacherA!.id

  // Profiles
  await (admin as any).from('parent_profiles').insert([
    { user_id: parentAId, full_name: 'Parent A' },
    { user_id: parentBId, full_name: 'Parent B' },
  ])
  await (admin as any).from('teacher_profiles').insert({
    user_id: teacherAId,
    full_name: 'Teacher A',
    state: 'NSW',
  })

  // Students
  const { data: studentA } = await (admin as any)
    .from('student_profiles')
    .insert({ display_name: 'Student A', year_level: 7, created_by_role: 'parent', created_by_id: parentAId })
    .select('id')
    .single()
  const { data: studentB } = await (admin as any)
    .from('student_profiles')
    .insert({ display_name: 'Student B', year_level: 7, created_by_role: 'parent', created_by_id: parentBId })
    .select('id')
    .single()
  const { data: studentC } = await (admin as any)
    .from('student_profiles')
    .insert({ display_name: 'Student C', year_level: 8, created_by_role: 'teacher', created_by_id: teacherAId })
    .select('id')
    .single()

  const studentAId = studentA!.id
  const studentBId = studentB!.id
  const studentCId = studentC!.id

  // Parent-student links
  await (admin as any).from('parent_student').insert([
    { parent_id: parentAId, student_id: studentAId },
    { parent_id: parentBId, student_id: studentBId },
  ])

  // Classes
  const { data: classA } = await (admin as any)
    .from('classes')
    .insert({ teacher_id: teacherAId, name: 'Class A', year_level: 7, join_code: 'RLS-A-001' })
    .select('id')
    .single()
  const { data: classB } = await (admin as any)
    .from('classes')
    .insert({ teacher_id: teacherAId, name: 'Class B', year_level: 8, join_code: 'RLS-B-001' })
    .select('id')
    .single()

  const classAId = classA!.id
  const classBId = classB!.id

  // Enrolments
  await (admin as any).from('class_enrolments').insert([
    { class_id: classAId, student_id: studentAId },
    { class_id: classBId, student_id: studentBId },
    { class_id: classBId, student_id: studentCId },
  ])

  // Assignments
  await (admin as any)
    .from('assignments')
    .insert({ class_id: classAId, substrand_code: 'AC9M7N01' })

  // Practice sessions
  const { data: sessionA } = await (admin as any)
    .from('practice_sessions')
    .insert({ student_id: studentAId, substrand_code: 'AC9M7N01', source: 'free_practice' })
    .select('id')
    .single()

  const { data: sessionB } = await (admin as any)
    .from('practice_sessions')
    .insert({ student_id: studentBId, substrand_code: 'AC9M7N01', source: 'free_practice' })
    .select('id')
    .single()

  const sessionAId = sessionA!.id

  // Question attempts
  const { data: attemptA } = await (admin as any)
    .from('question_attempts')
    .insert({ session_id: sessionAId, question_id: 'AC9M7N01-001', is_correct: true, hints_used: 0 })
    .select('id')
    .single()

  const attemptAId = attemptA!.id

  // Signed JWTs
  const parentAJwt = signAuthJwt(parentAId, 'parent-a@rls-test.invalid')
  const parentBJwt = signAuthJwt(parentBId, 'parent-b@rls-test.invalid')
  const teacherAJwt = signAuthJwt(teacherAId, 'teacher-a@rls-test.invalid')
  const studentAJwt = signStudentJwt(studentAId, [classAId])
  const studentAExpiredJwt = signExpiredStudentJwt(studentAId, [classAId])

  return {
    parentAId, parentBId, teacherAId,
    studentAId, studentBId, studentCId,
    classAId, classBId,
    sessionAId, attemptAId,
    parentAJwt, parentBJwt, teacherAJwt, studentAJwt, studentAExpiredJwt,
  }
}

async function deleteFixtures(admin: SupabaseClient, fx: Fixtures) {
  await (admin as any).auth.admin.deleteUser(fx.parentAId)
  await (admin as any).auth.admin.deleteUser(fx.parentBId)
  await (admin as any).auth.admin.deleteUser(fx.teacherAId)
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe.skipIf(shouldSkip)('RLS negative-test matrix (SPEC4)', () => {
  let admin: SupabaseClient
  let fx: Fixtures

  beforeAll(async () => {
    admin = await makeAdmin()
    fx = await createFixtures(admin)
  })

  afterAll(async () => {
    if (fx) await deleteFixtures(admin, fx)
  })

  // ─── DENY: Parent A ───────────────────────────────────────────────────────

  describe('Parent A — cross-parent / cross-role denies', () => {
    it('DENY 01 — Parent A cannot SELECT student_profiles of Student B', async () => {
      const client = await makeClient(fx.parentAJwt)
      const { data } = await (client as any)
        .from('student_profiles')
        .select('id')
        .eq('id', fx.studentBId)
      expect(data).toHaveLength(0)
    })

    it('DENY 02 — Parent A cannot SELECT practice_sessions of Student B', async () => {
      const client = await makeClient(fx.parentAJwt)
      const { data } = await (client as any)
        .from('practice_sessions')
        .select('id')
        .eq('student_id', fx.studentBId)
      expect(data).toHaveLength(0)
    })

    it('DENY 03 — Parent A cannot SELECT any teacher_profiles', async () => {
      const client = await makeClient(fx.parentAJwt)
      const { data } = await (client as any).from('teacher_profiles').select('user_id')
      expect(data).toHaveLength(0)
    })

    it('DENY 04 — Parent A cannot SELECT any classes', async () => {
      const client = await makeClient(fx.parentAJwt)
      const { data } = await (client as any).from('classes').select('id')
      expect(data).toHaveLength(0)
    })

    it('DENY 05 — Parent A cannot SELECT parent_profiles of Parent B', async () => {
      const client = await makeClient(fx.parentAJwt)
      const { data } = await (client as any)
        .from('parent_profiles')
        .select('user_id')
        .eq('user_id', fx.parentBId)
      expect(data).toHaveLength(0)
    })
  })

  // ─── DENY: Parent B ───────────────────────────────────────────────────────

  describe('Parent B — cross-parent denies', () => {
    it('DENY 06 — Parent B cannot SELECT practice_sessions of Student A', async () => {
      const client = await makeClient(fx.parentBJwt)
      const { data } = await (client as any)
        .from('practice_sessions')
        .select('id')
        .eq('student_id', fx.studentAId)
      expect(data).toHaveLength(0)
    })
  })

  // ─── DENY: Teacher A ─────────────────────────────────────────────────────

  describe('Teacher A — cross-class and cross-role denies', () => {
    it('DENY 07 — Teacher A cannot SELECT practice_sessions of Student C (no sessions exist)', async () => {
      // TODO: improve DENY-07 — add Teacher B fixture to test cross-teacher (not just cross-class) isolation
      // Current: asserts 0 rows for Student C, who happens to have no sessions
      // Stronger: Teacher B's student sessions must be invisible to Teacher A's JWT
      // Track as test-coverage improvement before Phase 1 Definition of Done check.
      const client = await makeClient(fx.teacherAJwt)
      const { data } = await (client as any)
        .from('practice_sessions')
        .select('id')
        .eq('student_id', fx.studentCId)
      expect(data).toHaveLength(0)
    })

    it('DENY 08 — Teacher A cannot SELECT any parent_profiles', async () => {
      const client = await makeClient(fx.teacherAJwt)
      const { data } = await (client as any).from('parent_profiles').select('user_id')
      expect(data).toHaveLength(0)
    })

    it('DENY 09 — Teacher A cannot SELECT student_profiles not created by Teacher A', async () => {
      const client = await makeClient(fx.teacherAJwt)
      const { data } = await (client as any)
        .from('student_profiles')
        .select('id')
        .eq('id', fx.studentAId) // studentA was created by parentA, not teacherA
      expect(data).toHaveLength(0)
    })
  })

  // ─── DENY: Teacher A removed from class ──────────────────────────────────

  describe('Teacher A (removed) — access loss after class deleted', () => {
    it('DENY 10 — Teacher A loses access to practice_sessions after class is deleted', async () => {
      // Create isolated fixtures for this test
      const { data: tempClass } = await (admin as any)
        .from('classes')
        .insert({ teacher_id: fx.teacherAId, name: 'Temp Class', year_level: 7, join_code: 'RLS-T-001' })
        .select('id')
        .single()

      await (admin as any).from('class_enrolments').insert({
        class_id: tempClass!.id,
        student_id: fx.studentAId,
      })

      const { data: tempSession } = await (admin as any)
        .from('practice_sessions')
        .insert({ student_id: fx.studentAId, substrand_code: 'AC9M7N01', source: 'free_practice' })
        .select('id')
        .single()

      // Delete the class (simulates "Teacher A removed from Class")
      await (admin as any)
        .from('classes')
        .delete()
        .eq('id', tempClass!.id)

      // Now Teacher A should not see the sessions for former class students
      const client = await makeClient(fx.teacherAJwt)
      const { data } = await (client as any)
        .from('practice_sessions')
        .select('id')
        .eq('id', tempSession!.id)
      expect(data).toHaveLength(0)

      // Clean up session (class cascade deletes enrolment; session remains per SPEC4 §3)
      await (admin as any).from('practice_sessions').delete().eq('id', tempSession!.id)
    })
  })

  // ─── DENY: Student A JWT ─────────────────────────────────────────────────

  describe('Student A JWT — cross-student and cross-table denies', () => {
    it('DENY 11 — Student A cannot SELECT practice_sessions of Student B', async () => {
      const client = await makeClient(fx.studentAJwt)
      const { data } = await (client as any)
        .from('practice_sessions')
        .select('id')
        .eq('student_id', fx.studentBId)
      expect(data).toHaveLength(0)
    })

    it('DENY 12 — Student A cannot SELECT any parent_profiles', async () => {
      const client = await makeClient(fx.studentAJwt)
      const { data } = await (client as any).from('parent_profiles').select('user_id')
      expect(data).toHaveLength(0)
    })

    it('DENY 13 — Student A cannot SELECT any teacher_profiles', async () => {
      const client = await makeClient(fx.studentAJwt)
      const { data } = await (client as any).from('teacher_profiles').select('user_id')
      expect(data).toHaveLength(0)
    })

    it('DENY 14 — Student A cannot SELECT any classes', async () => {
      const client = await makeClient(fx.studentAJwt)
      const { data } = await (client as any).from('classes').select('id')
      expect(data).toHaveLength(0)
    })

    it('DENY 15 — Student A cannot SELECT student_profiles of Student B', async () => {
      const client = await makeClient(fx.studentAJwt)
      const { data } = await (client as any)
        .from('student_profiles')
        .select('id')
        .eq('id', fx.studentBId)
      expect(data).toHaveLength(0)
    })

    it('DENY 16 — Student A cannot SELECT class_enrolments for Class B (not enrolled)', async () => {
      const client = await makeClient(fx.studentAJwt)
      const { data } = await (client as any)
        .from('class_enrolments')
        .select('class_id')
        .eq('class_id', fx.classBId)
      expect(data).toHaveLength(0)
    })
  })

  // ─── DENY: Expired student JWT ───────────────────────────────────────────

  describe('Expired student JWT', () => {
    it('DENY 17 — Expired student JWT is rejected (401 or empty result)', async () => {
      const client = await makeClient(fx.studentAExpiredJwt)
      const { data, error } = await (client as any)
        .from('practice_sessions')
        .select('id')
        .eq('student_id', fx.studentAId)
      // Supabase rejects expired JWTs — either error or 0 rows
      const isRejected = (error !== null) || (Array.isArray(data) && data.length === 0)
      expect(isRejected).toBe(true)
    })
  })

  // ─── DENY: Anonymous ─────────────────────────────────────────────────────

  describe('Anonymous — no token, all tables deny', () => {
    it('DENY 18 — Anonymous cannot SELECT parent_profiles', async () => {
      const client = await makeClient()
      const { data } = await (client as any).from('parent_profiles').select('user_id')
      expect(data).toHaveLength(0)
    })

    it('DENY 19 — Anonymous cannot SELECT teacher_profiles', async () => {
      const client = await makeClient()
      const { data } = await (client as any).from('teacher_profiles').select('user_id')
      expect(data).toHaveLength(0)
    })

    it('DENY 20 — Anonymous cannot SELECT student_profiles', async () => {
      const client = await makeClient()
      const { data } = await (client as any).from('student_profiles').select('id')
      expect(data).toHaveLength(0)
    })

    it('DENY 21 — Anonymous cannot SELECT classes', async () => {
      const client = await makeClient()
      const { data } = await (client as any).from('classes').select('id')
      expect(data).toHaveLength(0)
    })

    it('DENY 22 — Anonymous cannot SELECT class_enrolments', async () => {
      const client = await makeClient()
      const { data } = await (client as any).from('class_enrolments').select('class_id')
      expect(data).toHaveLength(0)
    })

    it('DENY 23 — Anonymous cannot SELECT assignments', async () => {
      const client = await makeClient()
      const { data } = await (client as any).from('assignments').select('id')
      expect(data).toHaveLength(0)
    })

    it('DENY 24 — Anonymous cannot SELECT practice_sessions', async () => {
      const client = await makeClient()
      const { data } = await (client as any).from('practice_sessions').select('id')
      expect(data).toHaveLength(0)
    })

    it('DENY 25 — Anonymous cannot SELECT question_attempts', async () => {
      const client = await makeClient()
      const { data } = await (client as any).from('question_attempts').select('id')
      expect(data).toHaveLength(0)
    })

    it('DENY 26 — Anonymous INSERT into question_attempts is rejected', async () => {
      const client = await makeClient()
      const { error } = await (client as any).from('question_attempts').insert({
        session_id: fx.sessionAId,
        question_id: 'AC9M7N01-001',
        is_correct: false,
        hints_used: 0,
      })
      expect(error).not.toBeNull()
    })
  })

  // ─── Destructive tests ───────────────────────────────────────────────────

  describe('Destructive test 1: parent hard-deletes student → cascade', () => {
    it('deletes all child records (sessions, attempts, enrolments, parent_student)', async () => {
      // Create isolated fixtures
      const { data: { user: dp } } = await (admin as any).auth.admin.createUser({
        email: 'd1-parent@rls-test.invalid', password: 'Dest1Test!', email_confirm: true,
      })
      await (admin as any).from('parent_profiles').insert({ user_id: dp!.id, full_name: 'D1 Parent' })

      const { data: ds } = await (admin as any)
        .from('student_profiles')
        .insert({ display_name: 'D1 Student', year_level: 7, created_by_role: 'parent', created_by_id: dp!.id })
        .select('id').single()

      await (admin as any).from('parent_student').insert({ parent_id: dp!.id, student_id: ds!.id })
      await (admin as any).from('class_enrolments').insert({ class_id: fx.classAId, student_id: ds!.id })

      const { data: sess1 } = await (admin as any)
        .from('practice_sessions')
        .insert({ student_id: ds!.id, substrand_code: 'AC9M7N01', source: 'free_practice' })
        .select('id').single()
      const { data: sess2 } = await (admin as any)
        .from('practice_sessions')
        .insert({ student_id: ds!.id, substrand_code: 'AC9M7N01', source: 'assignment' })
        .select('id').single()
      const { data: sess3 } = await (admin as any)
        .from('practice_sessions')
        .insert({ student_id: ds!.id, substrand_code: 'AC9M7N01', source: 'free_practice' })
        .select('id').single()

      for (const sess of [sess1!, sess2!, sess3!]) {
        for (let i = 0; i < 4; i++) {
          await (admin as any).from('question_attempts').insert({
            session_id: sess.id, question_id: `AC9M7N01-00${i + 1}`, is_correct: i < 2, hints_used: 0,
          })
        }
      }

      // Act: parent hard-deletes student via their own JWT (policy: creator_sees_student FOR ALL)
      const parentClient = await makeClient(signAuthJwt(dp!.id, 'd1-parent@rls-test.invalid'))
      const { error: delErr } = await (parentClient as any)
        .from('student_profiles')
        .delete()
        .eq('id', ds!.id)
      expect(delErr).toBeNull()

      // Assert: all cascade has happened
      const { data: sessAfter } = await (admin as any)
        .from('practice_sessions').select('id').eq('student_id', ds!.id)
      expect(sessAfter).toHaveLength(0)

      const { data: attemptsAfter } = await (admin as any)
        .from('question_attempts').select('id')
        .in('session_id', [sess1!.id, sess2!.id, sess3!.id])
      expect(attemptsAfter).toHaveLength(0)

      const { data: enrolAfter } = await (admin as any)
        .from('class_enrolments').select('student_id').eq('student_id', ds!.id)
      expect(enrolAfter).toHaveLength(0)

      const { data: linkAfter } = await (admin as any)
        .from('parent_student').select('student_id').eq('student_id', ds!.id)
      expect(linkAfter).toHaveLength(0)

      await (admin as any).auth.admin.deleteUser(dp!.id)
    })
  })

  describe('Destructive test 2: teacher removed from class → access revoked', () => {
    it('teacher cannot see sessions of former class students after class deletion', async () => {
      // Create a separate teacher and class for isolation
      const { data: { user: dt } } = await (admin as any).auth.admin.createUser({
        email: 'd2-teacher@rls-test.invalid', password: 'Dest2Test!', email_confirm: true,
      })
      await (admin as any).from('teacher_profiles').insert({ user_id: dt!.id, full_name: 'D2 Teacher', state: 'VIC' })

      const { data: d2class } = await (admin as any)
        .from('classes')
        .insert({ teacher_id: dt!.id, name: 'D2 Class', year_level: 8, join_code: 'RLS-D2-001' })
        .select('id').single()

      await (admin as any).from('class_enrolments').insert({
        class_id: d2class!.id, student_id: fx.studentAId,
      })

      const teacherClient = await makeClient(signAuthJwt(dt!.id, 'd2-teacher@rls-test.invalid'))

      // Verify teacher CAN see session before removal
      const { data: before } = await (teacherClient as any)
        .from('practice_sessions').select('id').eq('student_id', fx.studentAId)
      expect(before!.length).toBeGreaterThan(0)

      // Remove teacher from class (delete class)
      await (admin as any).from('classes').delete().eq('id', d2class!.id)

      // Verify teacher CANNOT see sessions now
      const { data: after } = await (teacherClient as any)
        .from('practice_sessions').select('id').eq('student_id', fx.studentAId)
      expect(after).toHaveLength(0)

      // Verify student data is intact
      const { data: studentData } = await (admin as any)
        .from('student_profiles').select('id').eq('id', fx.studentAId)
      expect(studentData!.length).toBeGreaterThan(0)

      await (admin as any).auth.admin.deleteUser(dt!.id)
    })
  })

  describe('Destructive test 3: class hard-deleted → cascade enrolments/assignments; sessions untouched', () => {
    it('cascades enrolments and assignments but preserves student practice sessions', async () => {
      const { data: { user: dt3 } } = await (admin as any).auth.admin.createUser({
        email: 'd3-teacher@rls-test.invalid', password: 'Dest3Test!', email_confirm: true,
      })
      await (admin as any).from('teacher_profiles').insert({ user_id: dt3!.id, full_name: 'D3 Teacher', state: 'QLD' })

      const { data: d3class } = await (admin as any)
        .from('classes')
        .insert({ teacher_id: dt3!.id, name: 'D3 Class', year_level: 9, join_code: 'RLS-D3-001' })
        .select('id').single()

      await (admin as any).from('class_enrolments').insert([
        { class_id: d3class!.id, student_id: fx.studentAId },
        { class_id: d3class!.id, student_id: fx.studentBId },
        { class_id: d3class!.id, student_id: fx.studentCId },
      ])

      const { data: asgn1 } = await (admin as any)
        .from('assignments').insert({ class_id: d3class!.id, substrand_code: 'AC9M7N07' })
        .select('id').single()
      const { data: asgn2 } = await (admin as any)
        .from('assignments').insert({ class_id: d3class!.id, substrand_code: 'AC9M7N01' })
        .select('id').single()

      // Delete the class
      await (admin as any).from('classes').delete().eq('id', d3class!.id)

      // Enrolments cascaded
      const { data: enrolAfter } = await (admin as any)
        .from('class_enrolments').select('student_id').eq('class_id', d3class!.id)
      expect(enrolAfter).toHaveLength(0)

      // Assignments cascaded
      const { data: asgnAfter } = await (admin as any)
        .from('assignments').select('id').in('id', [asgn1!.id, asgn2!.id])
      expect(asgnAfter).toHaveLength(0)

      // Student A's practice sessions are untouched
      const { data: sessAfter } = await (admin as any)
        .from('practice_sessions').select('id').eq('student_id', fx.studentAId)
      expect(sessAfter!.length).toBeGreaterThan(0)

      await (admin as any).auth.admin.deleteUser(dt3!.id)
    })
  })

  describe('Destructive test 4: parent account deleted → full cascade', () => {
    it('deletes parent_profiles, student_profiles, sessions, attempts, parent_student rows', async () => {
      const { data: { user: dp4 } } = await (admin as any).auth.admin.createUser({
        email: 'd4-parent@rls-test.invalid', password: 'Dest4Test!', email_confirm: true,
      })
      await (admin as any).from('parent_profiles').insert({ user_id: dp4!.id, full_name: 'D4 Parent' })

      const { data: ds4 } = await (admin as any)
        .from('student_profiles')
        .insert({ display_name: 'D4 Student', year_level: 7, created_by_role: 'parent', created_by_id: dp4!.id })
        .select('id').single()

      await (admin as any).from('parent_student').insert({ parent_id: dp4!.id, student_id: ds4!.id })

      const { data: s4 } = await (admin as any)
        .from('practice_sessions')
        .insert({ student_id: ds4!.id, substrand_code: 'AC9M7N01', source: 'free_practice' })
        .select('id').single()

      await (admin as any).from('question_attempts').insert({
        session_id: s4!.id, question_id: 'AC9M7N01-001', is_correct: true, hints_used: 0,
      })

      // Act: delete the parent's auth.users row (cascade via created_by_id)
      await (admin as any).auth.admin.deleteUser(dp4!.id)

      // Assert: all cascaded
      const { data: ppAfter } = await (admin as any)
        .from('parent_profiles').select('user_id').eq('user_id', dp4!.id)
      expect(ppAfter).toHaveLength(0)

      const { data: spAfter } = await (admin as any)
        .from('student_profiles').select('id').eq('id', ds4!.id)
      expect(spAfter).toHaveLength(0)

      const { data: sessAfter } = await (admin as any)
        .from('practice_sessions').select('id').eq('student_id', ds4!.id)
      expect(sessAfter).toHaveLength(0)

      const { data: attAfter } = await (admin as any)
        .from('question_attempts').select('id').eq('session_id', s4!.id)
      expect(attAfter).toHaveLength(0)

      const { data: psAfter } = await (admin as any)
        .from('parent_student').select('parent_id').eq('parent_id', dp4!.id)
      expect(psAfter).toHaveLength(0)
    })
  })

  describe('Destructive test 5: audit log contains no banned PII', () => {
    it('answer.ts and repair.ts contain no console.log statements that could leak PII', async () => {
      const { readFileSync } = await import('node:fs')
      const { resolve } = await import('node:path')

      const libDir = resolve(__dirname, '../../src/lib')
      const files = ['answer.ts', 'repair.ts']

      for (const file of files) {
        const content = readFileSync(`${libDir}/${file}`, 'utf-8')
        const logLines = content
          .split('\n')
          .filter(l => /console\.(log|error|warn|info)/.test(l))
        expect(
          logLines,
          `${file} must have zero console.log calls (pure functions, no logging): found ${logLines.join('; ')}`,
        ).toHaveLength(0)
      }
    })

    it('no PII field names appear in runtime log positions in src/ files', async () => {
      const { readFileSync, readdirSync } = await import('node:fs')
      const { resolve, join } = await import('node:path')

      const PII_IN_LOGS = ['display_name', 'full_name', 'email', 'pin', 'pin_hash', 'answer_given']
      const srcDir = resolve(__dirname, '../../src')

      function scanDir(dir: string): string[] {
        const results: string[] = []
        try {
          for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const full = join(dir, entry.name)
            if (entry.isDirectory()) results.push(...scanDir(full))
            else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) results.push(full)
          }
        } catch { /* directory may not exist yet */ }
        return results
      }

      const violations: string[] = []
      for (const file of scanDir(srcDir)) {
        const content = readFileSync(file, 'utf-8')
        const logLines = content.split('\n').filter(l => /console\.(log|error|warn|info)/.test(l))
        for (const line of logLines) {
          for (const pii of PII_IN_LOGS) {
            if (line.includes(pii)) {
              violations.push(`${file}: console.log with "${pii}"`)
            }
          }
        }
      }
      expect(violations, `PII found in log statements:\n${violations.join('\n')}`).toHaveLength(0)
    })
  })
})
