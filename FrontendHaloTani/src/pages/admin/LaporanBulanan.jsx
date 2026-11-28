import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { Alert, Button, Card, Spinner } from '../../components/ui.jsx';
import LaporanForm from '../../components/admin/LaporanForm.jsx';
import LaporanDetail from '../../components/admin/LaporanDetail.jsx';

export default function LaporanBulanan() {
  const [daftar, setDaftar] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  async function muat() {
    try {
      setDaftar(await api.listLaporan());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    api.listLaporan().then(setDaftar).catch((e) => setError(e.message));
  }, []);

  async function setelahSimpan(res) {
    setError('');
    setOk(res.message);
    setSelectedId(res.data.id);
    await muat();
  }

  async function hapus(laporan) {
    if (!window.confirm(`Hapus laporan ${laporan.bulan} ${laporan.tahun}?`)) return;
    setError('');
    setOk('');
    setDeletingId(laporan.id);
    try {
      const res = await api.deleteLaporan(laporan.id);
      setOk(res.message);
      await muat();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  const selected = daftar?.find((l) => l.id === selectedId);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Laporan Bulanan</h1>
      <Alert>{error}</Alert>
      <Alert type="success">{ok}</Alert>
      {!daftar && !error && <Spinner />}

      {daftar && (
        <>
          <LaporanForm daftar={daftar} onSaved={setelahSimpan} />

          <Card title="Arsip Laporan">
            {daftar.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada laporan.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {daftar.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="text-sm font-semibold">{l.bulan} {l.tahun}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setSelectedId(l.id)}>Lihat</Button>
                      <Button variant="outline" className="text-red-600!" disabled={deletingId !== null} onClick={() => hapus(l)}>
                        {deletingId === l.id ? 'Menghapus...' : 'Hapus'}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {selected && <LaporanDetail laporan={selected} />}
        </>
      )}
    </div>
  );
}