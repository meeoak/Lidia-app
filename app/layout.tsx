import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lidia 운영 시스템",
  description: "영업 에이전트와 빔블 교사를 위한 통합 운영 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
