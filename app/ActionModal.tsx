'use client';

import { 
  XMarkIcon, QrCodeIcon, FaceSmileIcon, ExclamationTriangleIcon, 
  SparklesIcon, EnvelopeIcon, PhoneIcon, CubeIcon, ChevronDownIcon,
  ShieldExclamationIcon, CheckBadgeIcon, ShieldCheckIcon, StarIcon,
  ChatBubbleLeftRightIcon, ArrowRightIcon
} from '@heroicons/react/24/outline';

// Definisikan tipe props agar Type Safety terjaga
interface ActionModalProps {
  selectedAction: 'verify' | 'survey' | 'complaint' | null;
  closeModal: () => void;
  // State Handlers
  handleVerify: (e: React.FormEvent) => void;
  handleQuickSurvey: (e: React.FormEvent) => void;
  handleQuickComplaint: (e: React.FormEvent) => void;
  // Form Values
  productType: 'hybrid' | 'sweetcorn';
  setProductType: (type: 'hybrid' | 'sweetcorn') => void;
  serialNumber: string;
  setSerialNumber: (val: string) => void;
  inputFocused: boolean;
  setInputFocused: (val: boolean) => void;
  loading: boolean;
  error: { message: string; isReportable: boolean } | null;
  // Reporting Logic
  reportSuccess: boolean;
  isReporting: boolean;
  handleReportFailure: () => void;
  // Quick Form Values
  quickName: string;
  setQuickName: (val: string) => void;
  quickEmail: string;
  setQuickEmail: (val: string) => void;
  quickPhone: string;
  setQuickPhone: (val: string) => void;
  // Product Dropdown
  selectedProductId: string;
  setSelectedProductId: (val: string) => void;
  allProducts: { id: number; name: string }[];
  productsLoading: boolean;
}

export default function ActionModal({
  selectedAction, closeModal, handleVerify, handleQuickSurvey, handleQuickComplaint,
  productType, setProductType, serialNumber, setSerialNumber, inputFocused, setInputFocused,
  loading, error, reportSuccess, isReporting, handleReportFailure,
  quickName, setQuickName, quickEmail, setQuickEmail, quickPhone, setQuickPhone,
  selectedProductId, setSelectedProductId, allProducts, productsLoading
}: ActionModalProps) {

  if (!selectedAction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 md:p-8 animate-scale-in max-h-[95vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        
        <button
          onClick={closeModal}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors z-20"
        >
          <XMarkIcon className="h-5 sm:h-6 w-5 sm:w-6 text-gray-500 dark:text-slate-400" />
        </button>

        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex p-4 rounded-2xl mb-4" style={{
            background: selectedAction === 'verify' ? 'linear-gradient(135deg, #10b981, #059669)' :
                       selectedAction === 'survey' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' :
                       'linear-gradient(135deg, #f97316, #ea580c)'
          }}>
            {selectedAction === 'verify' && <QrCodeIcon className="h-10 w-10 text-white" />}
            {selectedAction === 'survey' && <FaceSmileIcon className="h-10 w-10 text-white" />}
            {selectedAction === 'complaint' && <ExclamationTriangleIcon className="h-10 w-10 text-white" />}
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {selectedAction === 'verify' && 'Verifikasi Produk'}
            {selectedAction === 'survey' && 'Berikan Rating Anda'}
            {selectedAction === 'complaint' && 'Laporkan Masalah'}
          </h2>
          
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            {selectedAction === 'verify' && 'Masukkan nomor seri/lot untuk verifikasi'}
            {selectedAction === 'survey' && 'Bantu kami tingkatkan kualitas produk'}
            {selectedAction === 'complaint' && 'Sampaikan keluhan Anda kepada kami'}
          </p>
        </div>

        {/* Form Content */}
        <form onSubmit={
          selectedAction === 'verify' ? handleVerify :
          selectedAction === 'survey' ? handleQuickSurvey :
          handleQuickComplaint
        } className="space-y-5 sm:space-y-6">
          
          {/* Kategori Produk Toggle */}
          {selectedAction === 'verify' && (
            <div className="space-y-2 sm:space-y-3">
              <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                Kategori Produk
              </label>
              <div className="relative bg-slate-100 dark:bg-slate-700/50 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 flex gap-1">
                <button
                  type="button"
                  onClick={() => setProductType('hybrid')}
                  className={`flex-1 px-2 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                    productType === 'hybrid'
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl">🌽</span>
                    <span className="text-[11px] sm:text-sm">Jagung Hibrida</span>
                    <span className="text-[9px] sm:text-xs opacity-75">Nomor Seri</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setProductType('sweetcorn')}
                  className={`flex-1 px-2 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                    productType === 'sweetcorn'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-lg'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl">🍅</span>
                    <span className="text-[11px] sm:text-sm">Sweetcorn & Sayuran</span>
                    <span className="text-[9px] sm:text-xs opacity-75">Nomor Lot</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Serial/Lot Input */}
          {selectedAction === 'verify' && (
            <div className="relative group">
              <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 sm:mb-3">
                {productType === 'hybrid' ? 'Nomor Seri Label' : 'Nomor Lot Produksi'}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4">
                  <QrCodeIcon className={`h-4 sm:h-5 w-4 sm:w-5 transition-all duration-300 ${
                    inputFocused 
                      ? (productType === 'hybrid' ? 'text-emerald-500' : 'text-amber-500') + ' scale-110' 
                      : 'text-slate-400'
                  }`} />
                </div>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  className={`block w-full rounded-xl sm:rounded-2xl border-slate-200 dark:border-slate-600 py-3 sm:py-4 pl-10 sm:pl-12 pr-3 sm:pr-4 text-sm sm:text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 ring-1 ring-inset transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-lg hover:shadow-xl focus:shadow-xl focus:scale-[1.02] ${
                    inputFocused 
                      ? productType === 'hybrid'
                        ? 'ring-2 ring-emerald-500 border-emerald-500'
                        : 'ring-2 ring-amber-500 border-amber-500'
                      : 'ring-slate-200 dark:ring-slate-700 hover:ring-slate-300 dark:hover:ring-slate-600'
                  }`}
                  placeholder={productType === 'hybrid' ? "Contoh: HDBa900001" : "Contoh: LOT123456"}
                  disabled={loading}
                  required
                />
              </div>
              <p className="mt-2 text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <SparklesIcon className="w-3 h-3" />
                {productType === 'hybrid' 
                  ? 'Nomor seri tertera pada label benih jagung hibrida'
                  : 'Nomor lot tertera pada kemasan sweetcorn dan sayuran'
                }
              </p>
            </div>
          )}

          {/* Premium Product Dropdown */}
          {(selectedAction === 'survey' || selectedAction === 'complaint') && (
            <div className="relative group">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 sm:mb-3">
                <CubeIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Pilih Produk
                <span className="text-red-500">*</span>
              </label>
              
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 z-10">
                  <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                    selectedProductId 
                      ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20' 
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    <CubeIcon className={`h-4 sm:h-5 w-4 sm:w-5 transition-all duration-300 ${
                      selectedProductId 
                        ? 'text-emerald-600 dark:text-emerald-400 scale-110' 
                        : 'text-slate-400'
                    }`} />
                  </div>
                </div>

                <div className="relative">
                  <select
                    name="product_id"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                    disabled={productsLoading}
                    className={`block w-full rounded-xl sm:rounded-2xl border-2 py-3.5 sm:py-4 pl-14 sm:pl-16 pr-12 text-sm sm:text-base font-medium transition-all duration-300 appearance-none cursor-pointer ${
                      selectedProductId
                        ? 'text-slate-900 dark:text-slate-100 bg-gradient-to-r from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/30 border-emerald-500 dark:border-emerald-600 ring-4 ring-emerald-500/10 shadow-xl shadow-emerald-500/20'
                        : 'text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 shadow-lg hover:shadow-xl'
                    } focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 focus:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <option value="" className="text-slate-400">
                      {productsLoading ? '⏳ Memuat produk...' : '🌱 Pilih produk Anda'}
                    </option>
                    {allProducts.map((product) => (
                      <option 
                        key={product.id} 
                        value={product.id.toString()}
                        className="text-slate-900 dark:text-slate-100 py-2"
                      >
                        {product.name}
                      </option>
                    ))}
                  </select>

                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4">
                    <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                      selectedProductId 
                        ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20' 
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                      <ChevronDownIcon className={`h-4 sm:h-5 w-4 sm:w-5 transition-all duration-300 ${
                        selectedProductId 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-slate-400'
                      }`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Form */}
          {(selectedAction === 'survey' || selectedAction === 'complaint') && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Informasi Kontak {selectedAction === 'survey' ? '' : '(Untuk follow-up)'}
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Nama Lengkap</label>
                <input type="text" value={quickName} onChange={(e) => setQuickName(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500" placeholder="Nama Anda" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3"><EnvelopeIcon className="h-4 w-4 text-slate-400" /></div>
                  <input type="email" value={quickEmail} onChange={(e) => setQuickEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500" placeholder="email@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Nomor WhatsApp <span className="text-slate-400">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3"><PhoneIcon className="h-4 w-4 text-slate-400" /></div>
                  <input type="tel" value={quickPhone} onChange={(e) => setQuickPhone(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500" placeholder="08xxxxxxxxxx" />
                </div>
              </div>
            </div>
          )}

          {/* Error & Reporting Display */}
          {error && selectedAction === 'verify' && (
            <div className="p-3 sm:p-4 bg-gradient-to-r from-red-50 to-rose-50/80 dark:from-red-900/20 dark:to-rose-900/10 border border-red-200 dark:border-red-800 rounded-xl sm:rounded-2xl shadow-sm animate-slide-in-bottom">
              <div className="flex items-start gap-2 sm:gap-3">
                <ShieldExclamationIcon className="w-4 sm:w-5 h-4 sm:h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-grow">
                  <p className="text-xs sm:text-sm text-red-700 dark:text-red-400 font-semibold">{error.message}</p>
                  
                  {error.isReportable && !reportSuccess && (
                    <button
                      type="button"
                      onClick={handleReportFailure}
                      disabled={isReporting}
                      className="mt-2 sm:mt-3 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg sm:rounded-xl transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95"
                    >
                      <ShieldExclamationIcon className="h-3 sm:h-4 w-3 sm:w-4" />
                      {isReporting ? 'Mengirim...' : 'Laporkan Masalah Ini'}
                    </button>
                  )}

                  {reportSuccess && (
                    <div className="mt-2 sm:mt-3 flex items-center gap-1.5 sm:gap-2 text-emerald-700 dark:text-emerald-400">
                      <CheckBadgeIcon className="w-3 sm:w-4 h-3 sm:h-4" />
                      <span className="text-[10px] sm:text-sm font-bold">Terima kasih! Laporan diterima.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (selectedAction === 'verify' && !serialNumber.trim())}
            className={`group relative flex w-full items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-sm sm:text-base font-bold text-white shadow-2xl transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 overflow-hidden transform ${
              selectedAction === 'verify'
                ? productType === 'hybrid'
                  ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 shadow-emerald-500/25 hover:shadow-emerald-500/35'
                  : 'bg-gradient-to-r from-amber-600 via-orange-500 to-orange-600 shadow-orange-500/25 hover:shadow-orange-500/35'
                : selectedAction === 'survey'
                  ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 shadow-blue-500/25 hover:shadow-blue-500/35'
                  : 'bg-gradient-to-r from-orange-600 via-red-500 to-red-600 shadow-red-500/25 hover:shadow-red-500/35'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
            
            <div className="relative z-10 flex items-center gap-2 sm:gap-3">
              {loading ? (
                <>
                  <div className="w-5 sm:w-6 h-5 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  {selectedAction === 'verify' && <QrCodeIcon className="h-4 sm:h-5 w-4 sm:w-5" />}
                  {selectedAction === 'survey' && <StarIcon className="h-4 sm:h-5 w-4 sm:w-5" />}
                  {selectedAction === 'complaint' && <ChatBubbleLeftRightIcon className="h-4 sm:h-5 w-4 sm:w-5" />}
                  <span>
                    {selectedAction === 'verify' && 'Verifikasi Sekarang'}
                    {selectedAction === 'survey' && 'Lanjut ke Survey'}
                    {selectedAction === 'complaint' && 'Lanjut ke Form Komplain'}
                  </span>
                  <ArrowRightIcon className="h-4 sm:h-5 w-4 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </div>
          </button>

          <div className="text-center pt-2">
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheckIcon className="w-3 h-3" />
              <span>
                {selectedAction === 'verify' && 'Data Anda aman dan terenkripsi'}
                {selectedAction === 'survey' && 'Feedback Anda membantu kami lebih baik'}
                {selectedAction === 'complaint' && 'Tim kami akan merespon dalam 24 jam'}
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}