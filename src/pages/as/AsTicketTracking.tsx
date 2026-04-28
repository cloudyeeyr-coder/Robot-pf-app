import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../../app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Badge } from '../../app/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, Clock, AlertCircle, User, Phone } from 'lucide-react';
import {
  getAsTicketById,
  simulateAsTicketProgress,
  checkSlaCompliance,
  getElapsedTime,
} from '../../lib/mockAsTickets';
import { useAuth } from '../../contexts/AuthContext';

const POLLING_INTERVAL = 30000; // 30 seconds

export function AsTicketTrackingPage() {
  const { contractId, ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<any>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    const loadData = () => {
      const ticketData = getAsTicketById(ticketId!);

      if (!ticketData) {
        setLoading(false);
        return;
      }

      // Check ownership
      if (ticketData.buyer_company_id !== user?.companyId) {
        navigate('/403');
        return;
      }

      setTicket(ticketData);

      // Stop polling if resolved
      if (ticketData.status === 'resolved') {
        setPolling(false);
      }

      setLoading(false);
    };

    loadData();
  }, [ticketId, user, navigate]);

  // Polling effect
  useEffect(() => {
    if (!polling || !ticketId) return;

    const interval = setInterval(() => {
      const newStatus = simulateAsTicketProgress(ticketId);
      const updatedTicket = getAsTicketById(ticketId);
      setTicket(updatedTicket);

      // Toast notifications on status change
      if (updatedTicket && ticket && updatedTicket.status !== ticket.status) {
        if (updatedTicket.status === 'assigned') {
          toast.success('엔지니어가 배정되었습니다!');
        } else if (updatedTicket.status === 'dispatched') {
          toast.success('엔지니어가 현장으로 출동했습니다!');
        } else if (updatedTicket.status === 'resolved') {
          toast.success('AS가 완료되었습니다!');
          setPolling(false);
        }
      }

      if (newStatus === 'resolved') {
        setPolling(false);
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [polling, ticketId, ticket]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">티켓 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">티켓을 찾을 수 없습니다</h2>
          <Button onClick={() => navigate('/my/as-tickets')}>목록으로</Button>
        </div>
      </div>
    );
  }

  const currentStep =
    ticket.status === 'reported' ? 1 :
    ticket.status === 'assigned' ? 2 :
    ticket.status === 'dispatched' ? 3 :
    4;

  const steps = [
    {
      number: 1,
      title: '접수 완료',
      timestamp: ticket.reported_at,
      icon: CheckCircle,
      completed: true,
      targetHours: null,
    },
    {
      number: 2,
      title: '엔지니어 배정',
      timestamp: ticket.assigned_at,
      icon: User,
      completed: !!ticket.assigned_at,
      targetHours: 4,
      startTime: ticket.reported_at,
    },
    {
      number: 3,
      title: '현장 출동',
      timestamp: ticket.dispatched_at,
      icon: Phone,
      completed: !!ticket.dispatched_at,
      targetHours: 24,
      startTime: ticket.reported_at,
    },
    {
      number: 4,
      title: '해결 완료',
      timestamp: ticket.resolved_at,
      icon: CheckCircle,
      completed: !!ticket.resolved_at,
      targetHours: 24,
      startTime: ticket.reported_at,
    },
  ];

  const slaCompliant = ticket.status === 'resolved' ? checkSlaCompliance(ticket) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-2">AS 진행 상황</h1>
          <div className="flex items-center gap-2">
            <p className="text-gray-600">티켓 번호: {ticket.ticket_number}</p>
            <Badge variant={ticket.priority === 'urgent' ? 'destructive' : 'secondary'}>
              {ticket.priority === 'urgent' ? '긴급' : '일반'}
            </Badge>
          </div>
        </div>

        {/* SLA Status (if resolved) */}
        {ticket.status === 'resolved' && slaCompliant !== null && (
          <Card className={slaCompliant ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                {slaCompliant ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">SLA 목표 달성 ✓</p>
                      <p className="text-sm text-green-800">
                        24시간 내에 성공적으로 해결되었습니다
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-900">SLA 목표 미달성 ✗</p>
                      <p className="text-sm text-red-800">
                        24시간 목표를 초과했습니다
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Stepper */}
        <Card>
          <CardHeader>
            <CardTitle>처리 단계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const timeInfo = step.startTime && step.targetHours
                  ? getElapsedTime(step.startTime, step.targetHours)
                  : null;

                return (
                  <div key={step.number} className="flex gap-4">
                    {/* Step Icon */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
                          step.completed
                            ? 'bg-green-600 text-white'
                            : currentStep === step.number
                            ? 'bg-blue-600 text-white animate-pulse'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`w-0.5 h-20 ${
                            step.completed ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 pb-8">
                      <h3 className="font-semibold mb-1">{step.title}</h3>

                      {step.timestamp && (
                        <p className="text-sm text-gray-600 mb-2">
                          {new Date(step.timestamp).toLocaleString('ko-KR')}
                        </p>
                      )}

                      {/* Engineer Info */}
                      {step.number === 2 && ticket.engineer_name && (
                        <div className="text-sm space-y-1 mt-2 p-2 bg-blue-50 rounded">
                          <p className="font-semibold">담당 엔지니어: {ticket.engineer_name}</p>
                          <p className="text-gray-600">연락처: {ticket.engineer_contact}</p>
                        </div>
                      )}

                      {/* Time Progress */}
                      {!step.completed && currentStep === step.number && timeInfo && (
                        <div className="mt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className={timeInfo.isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                              {timeInfo.elapsed}시간 경과 / 목표 {timeInfo.target}시간
                            </span>
                            {timeInfo.isOverdue && (
                              <span className="text-red-600 font-semibold">목표 초과</span>
                            )}
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                timeInfo.isOverdue ? 'bg-red-600' : 'bg-blue-600'
                              }`}
                              style={{
                                width: `${Math.min((timeInfo.elapsed / timeInfo.target) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Ticket Details */}
        <Card>
          <CardHeader>
            <CardTitle>접수 내용</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm text-gray-600">증상 설명</Label>
              <p className="text-sm bg-gray-50 p-3 rounded-lg mt-1 whitespace-pre-wrap">
                {ticket.symptom_description}
              </p>
            </div>

            {ticket.photos && ticket.photos.length > 0 && (
              <div>
                <Label className="text-sm text-gray-600 block mb-2">첨부 사진</Label>
                <div className="flex gap-2 flex-wrap">
                  {ticket.photos.map((photo: string, index: number) => (
                    <div
                      key={index}
                      className="px-3 py-1 bg-gray-100 rounded text-xs text-gray-600"
                    >
                      {photo}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Polling Indicator */}
        {polling && ticket.status !== 'resolved' && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 animate-pulse" />
            <span>30초마다 자동으로 상태를 확인하고 있습니다...</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/my/as-tickets')}
          >
            목록으로
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/contracts/${contractId}`)}
          >
            계약 상세
          </Button>
        </div>
      </div>
    </div>
  );
}
