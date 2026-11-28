import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { formatTanggalJam } from '../../lib/format.js';
import { Alert, Button, Card, Spinner, inputCls } from '../../components/ui.jsx';
import UjiPrompt from '../../components/admin/UjiPrompt.jsx';

const contoh = {
  '{jenis_tanaman}': 'Padi',
  '{lokasi}': 'Madiun',
  '{urgensi}': 'Sedang',
  '{keluhan}': 'Daun menguning sejak tiga hari lalu.',
};

export default function TemplatePrompt() {
  const [data, setData] = useState(null);
  const [isi, setIsi] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    api
      .getTemplatePrompt()
      .then((hasil) => {
        setData(hasil);
        setIsi(hasil.isi_template);
      })
      .catch((e) => setError(e.message));
  }, []);

  function ubah(teks) {
    setIsi(teks);
    setOk('');
  }

  function sisipkan(variabel) {
    const el = editorRef.current;
    const awal = el.selectionStart;
    ubah(isi.slice(0, awal) + variabel + isi.slice(el.selectionEnd));
    // tunggu layar diperbarui
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(awal + variabel.length, awal + variabel.length);
    });
  }

  async function simpan(e) {
    e.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const res = await api.updateTemplatePrompt({ isi_template: isi });
      setData(res.data);
      setIsi(res.data.isi_template);
      setOk(res.message);
    } catch (err) {
      setError(err.first?.('isi_template') || err.message);
    } finally {
      setBusy(false);
    }
  }


  const pratinjau = isi.replace(/\{[a-z_]+\}/g, (v) => contoh[v] ?? v);

  if (!data) {
    return error ? <Alert>{error}</Alert> : <Spinner />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Template Prompt AI</h1>
      <p className="text-sm text-gray-500">
        Terakhir diubah: {formatTanggalJam(data.updated_at)} oleh {data.diubah_oleh || '-'}
      </p>

      <Card title="Editor">
        <form onSubmit={simpan} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {data.placeholders.map((v) => (
              <Button key={v} type="button" variant="outline" disabled={busy} onClick={() => sisipkan(v)}>
                {v}
              </Button>
            ))}
          </div>
          <textarea
            ref={editorRef}
            aria-label="Isi template"
            rows={12}
            required
            minLength={20}
            maxLength={5000}
            disabled={busy}
            className={inputCls}
            value={isi}
            onChange={(e) => ubah(e.target.value)}
          />
          <Alert>{error}</Alert>
          <Alert type="success">{ok}</Alert>
          {isi !== data.isi_template && <p className="text-sm text-amber-700">Ada perubahan yang belum disimpan.</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? 'Menyimpan...' : 'Simpan'}
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => ubah(data.default_template)}>
              Kembalikan ke default
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Pratinjau (data contoh)">
        <p className="whitespace-pre-wrap break-words text-sm">{pratinjau}</p>
      </Card>

      <UjiPrompt template={isi} />
    </div>
  );
}