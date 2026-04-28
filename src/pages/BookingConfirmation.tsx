import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { CheckCircle, MapPin, Calendar as CalendarIcon, Clock, User, Phone, Mail, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../app/components/ui/card';
import { Button } from '../app/components/ui/button';
import { Badge } from '../app/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../app/components/ui/dialog';
import { MOCK_BOOKINGS, cancelBooking, type Booking } from '../lib/mockBookings';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';

export function BookingConfirmationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    const foundBooking = MOCK_BOOKINGS.find((b) => b.id === bookingId);
    if (foundBooking) {
      setBooking(foundBooking);
    }
  }, [bookingId]);

  const handleCancelBooking = () => {
    if (!bookingId) return;
    const success = cancelBooking(bookingId);
    if (success) {
      toast.success('예약이 취소되었습니다');
      setCancelModalOpen(false);
      // Reload booking to show cancelled status
      const updatedBooking = MOCK_BOOKINGS.find((b) => b.id === bookingId);
      if (updatedBooking) {
        setBooking(updatedBooking);
      }
    } else {
      toast.error('예약 취소에 실패했습니다');
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-16 text-center">
            <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">예약을 찾을 수 없습니다</h3>
            <p className="text-gray-600 mb-4">
              잘못된 예약 번호이거나 예약이 존재하지 않습니다.
            </p>
            <Button onClick={() => navigate('/booking')}>
              새 예약하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">대기 중</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-600">확정됨</Badge>;
      case 'completed':
        return <Badge className="bg-blue-600">완료됨</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">취소됨</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        {booking.status === 'confirmed' && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="py-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-green-900 mb-2">
                예약이 확정되었습니다!
              </h1>
              <p className="text-green-800">
                예약 정보가 SMS와 카카오톡으로 발송되었습니다
              </p>
            </CardContent>
          </Card>
        )}

        {/* Cancelled Header */}
        {booking.status === 'cancelled' && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-red-900 mb-2">
                예약이 취소되었습니다
              </h1>
              <p className="text-red-800">
                필요하신 경우 언제든지 다시 예약하실 수 있습니다
              </p>
            </CardContent>
          </Card>
        )}

        {/* Booking Details */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>예약 정보</CardTitle>
              {getStatusBadge(booking.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Booking Number */}
            <div className="pb-4 border-b">
              <p className="text-sm text-gray-600 mb-1">예약 번호</p>
              <p className="text-xl font-bold font-mono">{booking.booking_number}</p>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <CalendarIcon className="h-4 w-4" />
                  <p className="text-sm">방문 날짜</p>
                </div>
                <p className="font-semibold">
                  {format(new Date(booking.date), 'yyyy년 M월 d일 (eee)', {
                    locale: ko,
                  })}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <p className="text-sm">방문 시간</p>
                </div>
                <p className="font-semibold">{booking.time}</p>
              </div>
            </div>

            {/* Region */}
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <MapPin className="h-4 w-4" />
                <p className="text-sm">방문 지역</p>
              </div>
              <p className="font-semibold">
                {booking.region_si} {booking.region_gu}
              </p>
              <p className="text-gray-700 mt-1">{booking.address}</p>
            </div>

            {/* Manager */}
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <User className="h-4 w-4" />
                <p className="text-sm">담당 매니저</p>
              </div>
              <p className="font-semibold">{booking.manager_name} 매니저</p>
            </div>

            {/* Topic */}
            {booking.topic && (
              <div>
                <p className="text-sm text-gray-600 mb-1">상담 주제</p>
                <p className="text-gray-700">{booking.topic}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>매니저 연락처</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">전화번호</p>
                <p className="font-semibold">010-1234-5678</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">이메일</p>
                <p className="font-semibold">manager@robotmatch.kr</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900">유의사항</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-yellow-900">
              <li>• 방문 시간 30분 전까지 도착 가능한지 확인해주세요</li>
              <li>• 부득이한 사정으로 일정 변경이 필요한 경우 최소 1일 전에 연락 부탁드립니다</li>
              <li>• 현장 상황에 따라 상담 시간이 연장될 수 있습니다</li>
              <li>• 현장 평가를 위해 도면이나 현장 사진이 있다면 준비해주세요</li>
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
            홈으로
          </Button>
          {booking.status === 'confirmed' && (
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => setCancelModalOpen(true)}
            >
              예약 취소
            </Button>
          )}
          {booking.status === 'cancelled' && (
            <Button className="flex-1" onClick={() => navigate('/booking')}>
              새 예약하기
            </Button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>예약을 취소하시겠습니까?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              예약을 취소하면 해당 시간대가 다른 고객에게 제공됩니다.
              <br />
              다시 예약하시려면 새로 신청하셔야 합니다.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
              돌아가기
            </Button>
            <Button variant="destructive" onClick={handleCancelBooking}>
              예약 취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
