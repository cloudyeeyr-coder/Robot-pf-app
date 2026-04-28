import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../../app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { toast } from 'sonner';
import { Download, CheckCircle, FileText, Phone, Mail, Clock } from 'lucide-react';
import {
  getContractById,
  getWarrantyByContractId,
} from '../../lib/mockContracts';
import { useAuth } from '../../contexts/AuthContext';

export function WarrantyPage() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [contract, setContract] = useState<any>(null);
  const [warranty, setWarranty] = useState<any>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    const loadData = () => {
      const contractData = getContractById(contractId!);
      const warrantyData = getWarrantyByContractId(contractId!);

      if (!contractData) {
        setLoading(false);
        return;
      }

      // Check ownership
      if (contractData.buyer_company_id !== user?.companyId) {
        navigate('/403');
        return;
      }

      setContract(contractData);
      setWarranty(warrantyData);

      // Start polling if warranty not yet issued
      if (!warrantyData) {
        setPolling(true);
      }

      setLoading(false);
    };

    loadData();
  }, [contractId, user, navigate]);

  // Polling effect for warranty issuance
  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(() => {
      const warrantyData = getWarrantyByContractId(contractId!);
      if (warrantyData) {
        setWarranty(warrantyData);
        setPolling(false);
        toast.success('보증서가 발급되었습니다!');
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [polling, contractId]);

  const handleDownloadPdf = async () => {
    setDownloading(true);

    try {
      // TODO: Actual PDF download
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success('보증서 PDF가 다운로드되었습니다');

      // In production:
      // const response = await fetch(`/api/warranties/${warranty.id}/pdf`);
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `AS보증서_${contract.si_partner_name}_${new Date().toISOString().slice(0, 10)}.pdf`;
      // a.click();
    } catch (error) {
      console.error('PDF download failed:', error);
      toast.error('다운로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">계약을 찾을 수 없습니다</h2>
          <Button onClick={() => navigate('/my/contracts')}>계약 목록으로</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-2">AS 보증서</h1>
          <p className="text-gray-600">
            {contract.si_partner_name} • {contract.amount.toLocaleString('ko-KR')}원
          </p>
        </div>

        {!warranty ? (
          /* Warranty Not Yet Issued */
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-xl font-semibold mb-2">보증서가 곧 발급됩니다</h3>
              <p className="text-gray-600 mb-6">
                운영팀에서 보증서를 발급하고 있습니다. 잠시만 기다려주세요.
              </p>
              {polling && (
                <p className="text-sm text-gray-500">
                  30초마다 자동으로 확인하고 있습니다...
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Warranty Issued */
          <>
            {/* Success Banner */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900 mb-1">
                    AS 보증서가 발급되었습니다
                  </p>
                  <p className="text-sm text-green-800">
                    SI 파트너 부도/폐업 시에도 24시간 내 대체 엔지니어가 출동합니다
                  </p>
                </div>
              </div>
            </div>

            {/* Warranty Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    보증서 정보
                  </CardTitle>
                  <Button
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {downloading ? 'PDF 생성 중...' : 'PDF 다운로드'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">AS 업체명</label>
                    <p className="font-semibold">{warranty.as_company}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">보증 기간</label>
                    <p className="font-semibold">{warranty.period_months}개월</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600 block mb-2">보증 범위</label>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">
                    {warranty.coverage_scope}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">긴급 연락처</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-600" />
                      <a
                        href={`tel:${warranty.as_contact}`}
                        className="text-blue-600 hover:underline"
                      >
                        {warranty.as_contact}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <a
                        href={`mailto:${warranty.as_email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {warranty.as_email}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t text-sm text-gray-600">
                  <p>
                    발급일: {new Date(warranty.issued_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Important Notice */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">보증서 이용 안내</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>• SI 파트너 부도/폐업/연락두절 시 긴급 AS 요청 가능</p>
                <p>• 접수 후 4시간 내 엔지니어 배정, 24시간 내 현장 출동</p>
                <p>• 보증 기간은 시공 완료일로부터 {warranty.period_months}개월입니다</p>
                <p>• 보증서는 계약 목록에서 언제든지 다시 확인할 수 있습니다</p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/my/contracts')}
          >
            계약 목록으로
          </Button>
          {warranty && (
            <Button
              className="flex-1"
              onClick={() => navigate(`/contracts/${contractId}/as/new`)}
            >
              긴급 AS 요청
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
