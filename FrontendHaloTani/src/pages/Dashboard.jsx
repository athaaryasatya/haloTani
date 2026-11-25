import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { formatTanggal } from '../lib/format.js';
import { Alert, Card, Spinner, StatusBadge, UrgensiBadge } from '../components/ui.jsx';

const statCards = [
  { key: 'total', label: 'Total Keluhan', desc: 'Keseluruhan laporan keluhan', color: 'text-brand' },
  { key: 'selesai', label: 'Telah Selesai', desc: 'Sudah dianalisis AI', color: 'text-green-600' },
  { key: 'proses', label: 'Dalam Proses', desc: 'Menunggu balasan AI', color: 'text-amber-600' },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-2xl font-bold">Beranda</h1>
      <Alert>{error}</Alert>
      {!data && !error && <Spinner />}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {statCards.map((s) => (
              <div key={s.key} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className={`mt-1 text-3xl font-bold ${s.color}`}>{data.stats[s.key]}</p>
                <p className="mt-1 text-xs text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>

          <Card title="Keluhan Terbaru">
            {(data?.terbaru?.data?.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                Belum ada keluhan.{' '}
                <Link to="/keluhan/baru" className="font-semibold text-brand">
                  Kirim keluhan pertama
                </Link>
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-gray-500">
                    <tr>
                      <th className="pb-2 pr-4">Judul / Deskripsi</th>
                      <th className="pb-2 pr-4">Tanaman</th>
                      <th className="pb-2 pr-4">Urgensi</th>
                      <th className="pb-2 pr-4">Tanggal</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
  {data?.terbaru?.data?.map((k) => (
    <tr key={k.id}>
      <td className="max-w-xs truncate py-2.5 pr-4">
        {k.deskripsi?.slice(0, 40)}{(k.deskripsi?.length ?? 0) > 40 && '…'}
      </td>
      <td className="py-2.5 pr-4">{k.jenis_tanaman || '-'}</td>
      <td className="py-2.5 pr-4"><UrgensiBadge urgensi={k.tingkat_urgensi} /></td>
      <td className="whitespace-nowrap py-2.5 pr-4">{formatTanggal(k.tanggal)}</td>
      <td className="py-2.5"><StatusBadge status={k.status} /></td>
    </tr>
  ))}
</tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
