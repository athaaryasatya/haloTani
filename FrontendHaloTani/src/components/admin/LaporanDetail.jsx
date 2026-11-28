import { Card } from '../ui.jsx';

function Peringkat({ judul, data = [] }) {
  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold">{judul}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-gray-500">Tidak ada data.</p>
      ) : (
        <ol className="list-decimal pl-5 text-sm">
          {data.map((item) => (
            <li key={item.nama}>{item.nama}: {item.jumlah}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function LaporanDetail({ laporan }) {
  const r = laporan.ringkasan;

  return (
    <Card title={`Rincian ${laporan.bulan} ${laporan.tahun}`}>
      {!r ? (
        <p className="whitespace-pre-wrap text-sm">{laporan.isi_teks || 'Tidak ada isi.'}</p>
      ) : (
        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            {[
              ['Total keluhan', r.total_keluhan],
              ['Petani melapor', r.petani_aktif],
              ['Selesai', r.keluhan_selesai],
              ['Proses', r.keluhan_proses],
              ['Urgensi tinggi', r.urgensi?.Tinggi],
              ['Urgensi sedang', r.urgensi?.Sedang],
              ['Urgensi rendah', r.urgensi?.Rendah],
            ].map(([label, nilai]) => (
              <div key={label} className="rounded-lg bg-gray-50 p-3">
                <dt className="text-gray-500">{label}</dt>
                <dd className="text-xl font-bold">{nilai ?? 0}</dd>
              </div>
            ))}
          </dl>
          <div className="grid gap-4 md:grid-cols-2">
            <Peringkat judul="5 tanaman terbanyak" data={r.tanaman_terbanyak} />
            <Peringkat judul="5 lokasi terbanyak" data={r.lokasi_terbanyak} />
          </div>
          <div>
            <h3 className="mb-1 text-sm font-semibold">Catatan evaluasi</h3>
            <p className="whitespace-pre-wrap break-words text-sm">{r.catatan || '-'}</p>
          </div>
        </div>
      )}
    </Card>
  );
}