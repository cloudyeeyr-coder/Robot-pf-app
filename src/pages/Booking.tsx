import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Calendar as CalendarIcon, MapPin, Clock, User, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../app/components/ui/card';
import { Button } from '../app/components/ui/button';
import { Calendar } from '../app/components/ui/calendar';
import { Label } from '../app/components/ui/label';
import { Textarea } from '../app/components/ui/textarea';
import { Input } from '../app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../app/components/ui/dialog';
import { Badge } from '../app/components/ui/badge';
import {
  REGIONS_SI_DO,
  REGIONS_GU_GUN,
  getAvailableSlots,
  findNearestAvailableDate,
  bookSlot,
  isBookableDate,
  type BookingSlot,
} from '../lib/mockBookings';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export function BookingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedRegionSi, setSelectedRegionSi] = useState<string>('');
  const [selectedRegionGu, setSelectedRegionGu] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [topic, setTopic] = useState('');
  const [nearestDate, setNearestDate] = useState<string | null>(null);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && selectedRegionSi && selectedRegionGu) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const slots = getAvailableSlots(selectedRegionSi, selectedRegionGu, dateStr);
      setAvailableSlots(slots);

      // If no slots, find nearest available date
      if (slots.length === 0) {
        const nearest = findNearestAvailableDate(selectedRegionSi, selectedRegionGu, dateStr);
        setNearestDate(nearest);
      } else {
        setNearestDate(null);
      }
    }
  };

  const handleRegionChange = () => {
    setSelectedDate(undefined);
    setAvailableSlots([]);
    setNearestDate(null);
  };

  const handleSlotSelect = (slot: BookingSlot) => {
    setSelectedSlot(slot);
    setConfirmModalOpen(true);
  };

  const handleConfirmBooking = () => {
    if (!user || !selectedSlot || !address) {
      toast.error('필수 정보를 입력해주세요');
      return;
    }

    try {
      const booking = bookSlot(user.id, selectedSlot.id, address, topic);
      toast.success('예약이 확정되었습니다!');
      setConfirmModalOpen(false);

      // Navigate to confirmation page
      navigate(`/booking/${booking.id}`);
    } catch (error: any) {
      toast.error(error.message || '예약에 실패했습니다');
    }
  };

  const handleRecommendedDate = () => {
    if (nearestDate) {
      const date = new Date(nearestDate);
      handleDateSelect(date);
    }
  };

  const guOptions = selectedRegionSi ? REGIONS_GU_GUN[selectedRegionSi] || [] : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">현장 방문 예약</h1>
          <p className="text-gray-600">
            전문 매니저가 직접 방문하여 로봇 도입을 상담해드립니다
          </p>
        </div>

        {/* Phase 2 Banner */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-blue-900">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">
                현재 수도권 지역에서 시범 운영 중입니다
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Region & Date Selection */}
          <div className="space-y-6">
            {/* Region Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  지역 선택
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="region-si">시/도</Label>
                  <Select
                    value={selectedRegionSi}
                    onValueChange={(value) => {
                      setSelectedRegionSi(value);
                      setSelectedRegionGu('');
                      handleRegionChange();
                    }}
                  >
                    <SelectTrigger id="region-si">
                      <SelectValue placeholder="시/도 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS_SI_DO.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="region-gu">구/군</Label>
                  <Select
                    value={selectedRegionGu}
                    onValueChange={(value) => {
                      setSelectedRegionGu(value);
                      handleRegionChange();
                    }}
                    disabled={!selectedRegionSi}
                  >
                    <SelectTrigger id="region-gu">
                      <SelectValue placeholder="구/군 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {guOptions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Date Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  날짜 선택
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => !isBookableDate(date)}
                  locale={ko}
                  className="rounded-md border"
                />
                <p className="text-sm text-gray-600 mt-2">
                  * 주말 및 공휴일은 예약할 수 없습니다
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right: Available Slots */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  예약 가능 시간
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedRegionSi || !selectedRegionGu ? (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      지역을 먼저 선택해주세요
                    </p>
                  </div>
                ) : !selectedDate ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      날짜를 선택해주세요
                    </p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                      <h3 className="font-semibold mb-2">
                        선택하신 날짜에 가용 매니저가 없습니다
                      </h3>
                      {nearestDate ? (
                        <>
                          <p className="text-gray-600 mb-4">
                            가장 가까운 가용 일정:{' '}
                            <span className="font-semibold text-blue-600">
                              {format(new Date(nearestDate), 'yyyy년 M월 d일 (eee)', {
                                locale: ko,
                              })}
                            </span>
                          </p>
                          <div className="flex gap-2 justify-center">
                            <Button onClick={handleRecommendedDate}>
                              추천 일정으로 예약
                            </Button>
                            <Button variant="outline">대기 예약 신청</Button>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-600">
                          다른 날짜를 선택해주세요
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-3">
                      {selectedRegionSi} {selectedRegionGu} ·{' '}
                      {format(selectedDate, 'M월 d일 (eee)', { locale: ko })}
                    </p>
                    {availableSlots.map((slot) => (
                      <Card
                        key={slot.id}
                        className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                        onClick={() => handleSlotSelect(slot)}
                        role="option"
                        aria-selected={false}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Clock className="h-5 w-5 text-gray-500" />
                              <div>
                                <p className="font-semibold">
                                  {slot.time.replace(':', ':')}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <p className="text-sm text-gray-600">
                                    {slot.manager_name} 매니저
                                  </p>
                                </div>
                              </div>
                            </div>
                            <Badge variant="default" className="bg-green-600">
                              예약 가능
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>예약 확정</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Selected Slot Summary */}
            {selectedSlot && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {selectedSlot.region_si} {selectedSlot.region_gu}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      {selectedDate &&
                        format(selectedDate, 'yyyy년 M월 d일 (eee)', { locale: ko })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{selectedSlot.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span>{selectedSlot.manager_name} 매니저</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Address */}
            <div>
              <Label htmlFor="address">
                방문 주소 <span className="text-red-600">*</span>
              </Label>
              <Input
                id="address"
                placeholder="상세 주소를 입력해주세요"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            {/* Topic */}
            <div>
              <Label htmlFor="topic">상담 주제 (선택)</Label>
              <Textarea
                id="topic"
                placeholder="상담하고 싶은 내용을 입력해주세요 (최대 500자)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={500}
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmModalOpen(false)}
              >
                취소
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmBooking}
                disabled={!address}
              >
                예약 확정
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
