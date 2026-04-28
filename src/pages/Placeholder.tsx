import { useLocation } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../app/components/ui/card';
import { Construction } from 'lucide-react';

export function PlaceholderPage() {
  const location = useLocation();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Construction className="h-8 w-8 text-blue-600" />
            <div>
              <CardTitle>페이지 준비 중</CardTitle>
              <CardDescription>{location.pathname}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            이 페이지는 현재 개발 중입니다. 곧 서비스될 예정입니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
