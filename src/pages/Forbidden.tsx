import { Link } from 'react-router';
import { Button } from '../app/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <ShieldAlert className="h-20 w-20 text-red-600 mx-auto mb-4" />
        <h1 className="text-6xl font-bold text-gray-900 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          접근 권한이 없습니다
        </h2>
        <p className="text-gray-600 mb-8">
          이 페이지에 접근할 수 있는 권한이 없습니다.
          <br />
          올바른 계정으로 로그인했는지 확인해주세요.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/">
            <Button variant="outline">홈으로 돌아가기</Button>
          </Link>
          <Link to="/login">
            <Button>로그인</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
