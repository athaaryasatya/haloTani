export const formatTanggal = (iso) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export const formatTanggalJam = (iso) =>
  iso
    ? new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '-';

export const hitungKata = (teks) => teks.trim().split(/\s+/).filter(Boolean).length;

export const MIN_KATA = { Rendah: 1, Sedang: 2, Tinggi: 5 };
