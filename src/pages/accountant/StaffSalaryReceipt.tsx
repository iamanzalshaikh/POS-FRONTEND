import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  getPayrollById, 
  getStaffPayrollHistory,
  type PayrollRecord 
} from '../../api/staff.api'
import { Button } from "@/components/ui/button"
import { Globe, Phone, ArrowLeft, Loader2, FileText, Printer } from 'lucide-react'
import { toast } from '@/lib/toast'
import { useAuthStore } from '../../store/useAuthStore'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
        style: "currency",
        currency: "PKR",
        maximumFractionDigits: 0
    }).format(amount).replace('PKR', 'PKR ')
}

const safeFormatCurrency = (amount: any): string => {
    if (amount === null || amount === undefined || amount === '') return '0.00';
    const num = parseFloat(amount.toString());
    return isNaN(num) ? '0.00' : formatCurrency(num);
};

const MONTHS_LIST = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function StaffSalaryReceipt() {
    const { payrollId } = useParams<{ payrollId: string }>()
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [printType, setPrintType] = useState<'none' | 'pdf' | 'thermal'>('none')
    const [loading, setLoading] = useState(true);
    const [record, setRecord] = useState<PayrollRecord | null>(null);
    const [history, setHistory] = useState<PayrollRecord[]>([]);

    useEffect(() => {
        const fetchRecord = async () => {
            if (!payrollId) return;
            try {
                const response = await getPayrollById(payrollId);
                if (response.success) {
                    setRecord(response.data);
                    
                    // Fetch full history for this staff member to show partial payments breakdown
                    const histRes = await getStaffPayrollHistory(response.data.staffId, {
                      month: response.data.month,
                      year: response.data.year
                    });
                    if (histRes.success) {
                      // FILTER to only include same month and year as the current record
                      const filteredHistory = histRes.data.records.filter((h: any) => 
                        h.month === response.data.month && h.year === response.data.year
                      );
                      setHistory(filteredHistory);
                    }
                } else {
                    toast.error('Record not found');
                }
            } catch (err) {
                toast.error('Failed to load receipt');
            } finally {
                setLoading(false);
            }
        };
        fetchRecord();
    }, [payrollId]);

    useEffect(() => {
        if (printType !== 'none') {
            const timer = setTimeout(() => {
                window.print()
                setTimeout(() => setPrintType('none'), 1000)
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [printType])

    const handlePrint = () => {
        setPrintType('thermal')
    }

    const handleDownload = () => {
        setPrintType('pdf')
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Receipt Details...</p>
            </div>
        )
    }

    if (!record) {
        return (
            <div className="mx-auto max-w-4xl flex flex-col gap-6">
                <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">Salary Payment Receipt not found</p>
                    <Link
                        to="/accountant/payroll"
                        className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors mt-4"
                    >
                        Back to Payroll List
                    </Link>
                </div>
            </div>
        )
    }

    const staff = record.staff;
    const receiptNum = record.receiptNumber || record.displayId;
    const paymentMethod = record.paymentMethod || 'CASH';

    return (
        <div className={`mx-auto max-w-4xl flex flex-col gap-6 animate-fade-in`}>
            {/* Header — hidden on print */}
            <div className="flex items-center justify-between print:hidden overflow-hidden">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Salary Receipt</h1>
                    <p className="text-sm text-muted-foreground mt-1 text-nowrap">
                        View and print staff salary receipts.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 justify-end">
                    <Button
                        onClick={handlePrint}
                        className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                    >
                        <Printer size={16} />
                        Print Slip
                    </Button>
                    <Button
                        onClick={handleDownload}
                        className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                    >
                        <FileText size={16} />
                        PDF View
                    </Button>
                    <Link
                        to="/accountant/payroll"
                        className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors inline-flex items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </Link>
                </div>
            </div>

            {/* Receipt Card — this is the printable / PDF area */}
            <div id="receipt-print-area" className="bg-white mx-auto w-full max-w-[800px] border border-gray-100 shadow-sm print:shadow-none print:border-none print:p-0" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '12px' }}>
                {/* Section 1: Header */}
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        {/* Logo Box */}
                        <div className="w-[60px] h-[60px] border border-[#000000] flex items-center justify-center overflow-hidden shrink-0">
                            {user?.store?.logoUrl ? (
                                <img src={user.store.logoUrl} alt="Store Logo" className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-xs text-center font-bold">POS</span>
                            )}
                        </div>

                        {/* Store Info */}
                        <div className="flex-1">
                            <h2 className="text-[22px] font-bold uppercase text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '700' }}>
                                {user?.store?.name || "SALARY RECEIPT"}
                            </h2>
                            <p className="text-[11px] text-[#000000]">
                                {user?.store?.address || "Corporate Office Complex, Business District"}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                                <p className="text-[11px] text-[#000000]">
                                    Ph: {user?.store?.phone || "0312-8289654"}
                                </p>
                                {user?.store?.email && (
                                    <p className="text-[11px] text-[#000000]">
                                        Email: {user.store.email}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Header Divider */}
                <div className="border-b-2 border-[#000000]"></div>

                {/* Section 2: Receipt Meta Info */}
                <div className="px-6 py-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[9px] uppercase text-[#000000] tracking-wider">RECEIPT NO</p>
                            <p className="text-[13px] text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '500' }}>{receiptNum}</p>
                        </div>
                        <div>
                            <p className="text-[9px] uppercase text-[#000000] tracking-wider">DATE</p>
                            <p className="text-[13px] text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '500' }}>
                                {record.paymentDate ? new Date(record.paymentDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-b border-[#d1d5db]"></div>

                {/* Section 3: Staff Information */}
                <div className="px-6 py-3">
                    <div className="border-b border-[#000000] pb-2 mb-3">
                        <h3 className="text-sm font-bold text-[#000000] uppercase tracking-wider" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '600' }}>Staff Information</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                            <p className="text-[9px] uppercase text-[#000000] tracking-wider">STAFF NAME</p>
                            <p className="text-[13px] text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '500' }}>{staff?.name}</p>
                        </div>
                        <div>
                            <p className="text-[9px] uppercase text-[#000000] tracking-wider">ROLE</p>
                            <p className="text-[13px] text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '500' }}>{staff?.role?.replace(/_/g, ' ')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                            <p className="text-[9px] uppercase text-[#000000] tracking-wider">CONTACT</p>
                            <p className="text-[13px] text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '500' }}>{staff?.phone || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-[9px] uppercase text-[#000000] tracking-wider">STAFF ID</p>
                            <p className="text-[13px] text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '500' }}>{staff?.displayId || record.staffId.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-b border-[#d1d5db]"></div>

                {/* Section 7: Salary Breakdown Table */}
                <div className="px-6 py-4">
                    <table className="w-full border border-[#000000]">
                        {/* Table Header */}
                        <thead>
                            <tr className="bg-[#f3f4f6]">
                                <th className="border border-[#000000] px-3 py-2 text-left text-xs font-bold uppercase text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '600' }}>DESCRIPTION</th>
                                <th className="border border-[#000000] px-3 py-2 text-right text-xs font-bold uppercase text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '600' }}>AMOUNT (PKR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Basic Salary */}
                            <tr className="bg-[#ffffff]">
                                <td className="border border-[#000000] px-3 py-2 text-sm text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '500' }}>
                                    Basic Salary - {MONTHS_LIST[record.month - 1]} {record.year}
                                    
                                </td>
                                <td className="border border-[#000000] px-3 py-2 text-right text-sm font-bold text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '600' }}>
                                    {safeFormatCurrency(record.baseSalary)}
                                </td>
                            </tr>

                            {/* Bonus */}
                            {parseFloat(record.bonus?.toString() || '0') > 0 && (
                                <tr className="bg-[#ffffff]">
                                    <td className="border border-[#000000] px-3 py-2 text-sm text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '500' }}>
                                        Bonus
                                    </td>
                                    <td className="border border-[#000000] px-3 py-2 text-right text-sm font-bold text-emerald-600" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '600' }}>
                                        {safeFormatCurrency(record.bonus)}
                                    </td>
                                </tr>
                            )}

                            {/* Deductions */}
                            {parseFloat(record.deductions?.toString() || '0') > 0 && (
                                <tr className="bg-[#ffffff]">
                                    <td className="border border-[#000000] px-3 py-2 text-sm text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '500' }}>
                                        Deductions
                                    </td>
                                    <td className="border border-[#000000] px-3 py-2 text-right text-sm font-bold text-rose-600" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '600' }}>
                                        -{safeFormatCurrency(record.deductions)}
                                    </td>
                                </tr>
                            )}

                            {/* Previous Payments History */}
                            {history.filter(h => h.id !== record.id).map((h) => (
                                <tr key={h.id} className="bg-[#ffffff]">
                                    <td className="border border-[#000000] px-3 py-2 text-sm text-slate-500 italic" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '400' }}>
                                        Already Paid ({new Date(h.paymentDate || '').toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')})
                                    </td>
                                    <td className="border border-[#000000] px-3 py-2 text-right text-sm font-bold text-slate-400" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '600' }}>
                                        {safeFormatCurrency(h.amountPaid)}
                                    </td>
                                </tr>
                            ))}

                            {/* Amount Paid (This Slip) */}
                            <tr className="bg-slate-50/50">
                                <td className="border border-[#000000] px-3 py-2 text-sm font-bold text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '600' }}>
                                    AMOUNT PAID 
                                    {record.status === 'PARTIAL' && record.paymentDate && (
                                        <span className="ml-1 text-slate-500 font-bold">
                                            ({new Date(record.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')})
                                        </span>
                                    )}
                                    
                                </td>
                                <td className="border border-[#000000] px-3 py-2 text-right text-sm font-bold text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '700' }}>
                                    
                                    {safeFormatCurrency(record.amountPaid)}
                                </td>
                            </tr>

                            {/* Remaining Amount (Only for partial) */}
                            {record.status === 'PARTIAL' && (
                                <tr className="bg-white">
                                    <td className="border border-[#000000] px-3 py-2 text-sm font-bold text-rose-600" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '600' }}>
                                        REMAINING AMOUNT
                                    </td>
                                    <td className="border border-[#000000] px-3 py-2 text-right text-sm font-bold text-rose-600" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '700' }}>
                                        {safeFormatCurrency(Number(record.netSalary) - Number(record.amountPaid))}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="bg-[#f3f4f6]">
                                <td className="border border-[#000000] px-3 py-2 text-xs font-bold uppercase text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '700' }}>REMAINING BALANCE</td>
                                <td className="border border-[#000000] px-3 py-2 text-right text-sm font-bold text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '700' }}>
                                    {record.status === 'PAID' ? 'RS 0' : safeFormatCurrency(Number(record.netSalary) - history.reduce((sum, h) => sum + Number(h.amountPaid), 0))}
                                </td>
                            </tr>
                        </tfoot>

                    </table>
                </div>

                {/* Section 8: Info Box */}
                <div className="px-6 py-3 grid grid-cols-2 gap-y-2">
                    <p className="text-[11px] text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '400' }}>
                        <span className="font-bold">Method:</span> {paymentMethod}
                    </p>
                    {paymentMethod !== 'CASH' && (
                        <p className="text-[11px] text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '400' }}>
                            <span className="font-bold">Ref No:</span> {record.referenceNumber || 'INTERNAL'}
                        </p>
                    )}
                    <p className="text-[11px] text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '400' }}>
                        <span className="font-bold">Status:</span> PAID
                    </p>
                </div>

                {/* Section 9: Note Box */}
                <div className="px-6 py-3">
                    <div className="border border-[#000000] bg-[#f9fafb] p-3">
                        <p className="text-[10px] text-[#000000] italic" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '400' }}>
                            <span className="font-bold italic">Note:</span> {record.notes || "This is a computer generated salary slip." }
                        </p>
                    </div>
                </div>

                {/* Section 10: Footer */}
                <div className="px-6 py-4">
                  <div className="border-t border-[#000000] pt-3">
                    <p className="text-[10px] text-[#000000] text-center" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '400' }}>
                      Software by Elsa DevOps Technology 
                    </p>
                    <div className="flex justify-center items-center gap-4 text-[10px] text-[#000000]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '400' }}>
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#6b7280]" />
                        <span>03128289654</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-[#6b7280]" />
                        <span>www.elsadevops.com</span>
                      </div>
                    </div>
                  </div>
                </div>
            </div>

            {/* Print Styles — only the receipt card */}
            <style dangerouslySetInnerHTML={{
                __html: `
          @media print {
            body * { visibility: hidden !important; }
            #receipt-print-area, #receipt-print-area * { visibility: visible !important; }
            #receipt-print-area {
              position: relative !important;
              margin: 0 auto !important;
              width: 100% !important;
              max-width: 800px !important;
              padding: 20px !important;
              visibility: visible !important;
              background: white !important;
            }
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        ` + (printType === 'thermal' ? `
          @media print {
            @page { margin: 0; }
            body { margin: 0; }
            #receipt-print-area {
              position: relative !important;
              left: 0 !important;
              transform: none !important;
              width: 100% !important;
              max-width: 4.135in !important;
              margin: 0 auto !important;
              padding: 0 !important;
              visibility: visible !important;
              background: white !important;
            }
            #receipt-print-area h2 { font-size: 16px !important; line-height: 1.2 !important; }
            #receipt-print-area h3 { font-size: 12px !important; margin-bottom: 4px !important; }
            #receipt-print-area p, 
            #receipt-print-area th, 
            #receipt-print-area td,
            #receipt-print-area div { font-size: 10px !important; line-height: 1.2 !important; }
            #receipt-print-area .p-6 { padding: 12px !important; }
            #receipt-print-area .px-6 { padding-left: 12px !important; padding-right: 12px !important; }
            #receipt-print-area .py-4 { padding-top: 8px !important; padding-bottom: 8px !important; }
            #receipt-print-area .py-3 { padding-top: 6px !important; padding-bottom: 6px !important; }
            #receipt-print-area .gap-4 { gap: 8px !important; }
            #receipt-print-area .mb-3 { margin-bottom: 8px !important; }
          }
        ` : printType === 'pdf' ? `
          @media print {
            @page { size: A4 portrait; margin: 10mm; }
          }
        ` : '')
            }} />
        </div>
    )
}
