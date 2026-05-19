import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
              L
            </div>
            <span className="font-semibold text-lg">Lidia</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                로그인
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">시작하기</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            영업 에이전트와 빔블 교사를
            <br />
            <span className="text-brand-600">한 곳에서 연결</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            보류된 학부모 케이스를 신청부터 재클로징까지 추적하세요.
            <br />
            매니저 승인, 교사 자동 배정, D-Day 알림까지 한 번에.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">무료로 시작하기</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                로그인
              </Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid md:grid-cols-3 gap-6">
            <Feature
              title="실시간 케이스 추적"
              description="신청부터 재클로징까지 모든 단계를 한 화면에서 확인합니다."
              icon="📋"
            />
            <Feature
              title="역할별 맞춤 뷰"
              description="에이전트, 교사, 매니저 각각에게 필요한 정보만 노출됩니다."
              icon="👥"
            />
            <Feature
              title="자동 D-Day 알림"
              description="재클로징 데드라인을 놓치지 않도록 자동으로 카운트다운합니다."
              icon="⏰"
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-gray-500 text-center">
          © 2026 Lidia. 영업 에이전트와 빔블 교사를 위한 통합 운영 시스템.
        </div>
      </footer>
    </div>
  );
}

function Feature({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
    </div>
  );
}
