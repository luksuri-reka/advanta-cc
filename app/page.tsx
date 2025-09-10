import { QrCodeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function VerificationPage() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: "url('/background-field.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
      </div>

      {/* Main Content Grid */}
      <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center max-w-6xl w-full p-8">
        
        {/* Kolom Kiri: Branding & Teks */}
        <div className="hidden md:flex flex-col gap-4 text-zinc-800">
          <img src="/advanta-logo.png" alt="Advanta Logo" className="w-40 mb-4" />
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
            Jaminan Keaslian di Ujung Jari Anda.
          </h1>
          <p className="text-lg text-zinc-600">
            Verifikasi produk benih unggul Advanta Anda sekarang untuk memastikan kualitas dan hasil panen terbaik.
          </p>
        </div>

        {/* Kolom Kanan: Kartu Form Verifikasi */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 lg:p-10 border border-white/50">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-zinc-900 text-center">
              Masukkan Nomor Seri Produk
            </h2>
            <p className="text-center text-zinc-600 mt-2 mb-8">
              Temukan informasi detail dan keaslian benih unggul bersertifikat dari Advanta.
            </p>

            {/* Form Input */}
            <form className="space-y-6">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <QrCodeIcon className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="text"
                  name="serial_number"
                  id="serial_number"
                  className="block w-full rounded-xl border-0 py-4 pl-12 pr-4 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 transition-colors duration-200"
                  placeholder="Contoh: SN12345678"
                />
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all duration-200 active:scale-95"
              >
                <span>Cek Produk</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}