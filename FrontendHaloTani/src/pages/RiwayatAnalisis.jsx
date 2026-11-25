import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Markdown from 'react-markdown';
import { api } from '../lib/api.js';
import { formatTanggalJam } from '../lib/format.js';
import { Alert, Card, Spinner, StatusBadge } from '../components/ui.jsx';

const filters = [
  ['semua', 'Semua'],
  ['selesai', 'Selesai'],
  ['proses', 'Proses'],
];

export default function RiwayatAnalisis() {
  const location = useLocation();
  const [filter, setFilter] = useState('semua');
  const [list, setList] = useState(null);
  const [selectedId, setSelectedId] = useState(location.state?.selectedId ?? null);
  const [error, setError] = useState('');

  useEffect(() => {
    let batal = false;
    setList(null);
    api
      .listKeluhan(filter)
      .then((data) => {
        if (batal) return;
        setList(data);
        // pertahankan pilihan kalau masih ada di daftar, kalau tidak pilih yang pertama
        setSelectedId((cur) => (data.some((k) => k.id === cur) ? cur : data[0]?.id ?? null));
      })
      .catch((e) => !batal && setError(e.message));
    return () => {
      batal = true;
    };
  }, [filter]);

  const selected = list?.find((k) => k.id === selectedId);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold">Riwayat & Hasil Analisis AI</h1>
      <p className="mb-4 mt-1 text-sm text-gray-500">Daftar konsultasi keluhan serta rekomendasi penanganan penyakit tanaman</p>
      <Alert>{error}</Alert>

      <div className="grid items-start gap-6 lg:grid-cols-[360px_1fr]">
        <Card title="Daftar Keluhan">
          <div className="mb-4 flex gap-2">
            {filters.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                  filter === key ? 'border-brand bg-brand text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {!list ? (
            <Spinner className="mx-auto my-6" />
          ) : list.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">Belum ada Keluhan</p>
          ) : (
            <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
              {list.map((k) => (
                <button
                  key={k.id}
                  onClick={() => setSelectedId(k.id)}
                  className={`block w-full rounded-lg border p-3.5 text-left transition ${
                    k.id === selectedId ? 'border-emerald-500 bg-green-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
                    <span>{formatTanggalJam(k.tanggal)}</span>
                    <StatusBadge status={k.status} />
                  </div>
                  <p className="line-clamp-2 whitespace-pre-line text-sm font-medium leading-snug">{k.teks_keluhan}</p>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card title="Detail & Hasil Analisis">
          {selected ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="mb-2 text-sm font-semibold text-gray-700">Rincian Keluhan:</p>
                <p className="whitespace-pre-line text-sm leading-relaxed">{selected.teks_keluhan}</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="mb-3 text-sm font-semibold text-green-700">Hasil & Rekomendasi AI:</p>
                <div className="ai-content">
                  <Markdown>{selected.hasil_analisis || 'Belum ada hasil analisis.'}</Markdown>
                </div>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">
              Pilih salah satu keluhan di sebelah kiri untuk melihat detail hasil analisis AI.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
