import { Link } from 'react-router';

export function Footer() {
  return (
    <footer className="border-t bg-gray-50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold mb-3">회사 정보</h3>
            <p className="text-sm text-gray-600">
              로봇 SI 안심 보증 매칭 플랫폼
              <br />
              서울특별시 강남구 테헤란로
              <br />
              사업자등록번호: 123-45-67890
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">고객 지원</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/support" className="text-gray-600 hover:text-blue-600">
                  고객센터
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-600 hover:text-blue-600">
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@robotsi.com"
                  className="text-gray-600 hover:text-blue-600"
                >
                  support@robotsi.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">약관 및 정책</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-gray-600 hover:text-blue-600">
                  이용약관
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-blue-600">
                  개인정보 처리방침
                </Link>
              </li>
              <li>
                <Link to="/business-terms" className="text-gray-600 hover:text-blue-600">
                  사업자 약관
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
          © 2026 로봇 SI 매칭 플랫폼. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
