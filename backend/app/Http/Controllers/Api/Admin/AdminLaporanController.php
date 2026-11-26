<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Keluhan;
use App\Models\Laporan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminLaporanController extends Controller
{
    private const NAMA_BULAN = [
        1  => 'Januari',
        2  => 'Februari',
        3  => 'Maret',
        4  => 'April',
        5  => 'Mei',
        6  => 'Juni',
        7  => 'Juli',
        8  => 'Agustus',
        9  => 'September',
        10 => 'Oktober',
        11 => 'November',
        12 => 'Desember',
    ];

    public function index(): JsonResponse
    {
        $laporan = Laporan::orderByDesc('created_at')
            ->get()
            ->map(fn (Laporan $l) => $this->formatLaporan($l));

        return response()->json(['data' => $laporan]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'bulan'   => ['required', 'integer', 'between:1,12'],
            'tahun'   => ['required', 'integer', 'between:2020,2100'],
            'catatan' => ['nullable', 'string', 'max:1000'],
        ]);

        $angkaBulan = (int) $data['bulan'];
        $namaBulan = self::NAMA_BULAN[$angkaBulan];
        $tahun = (string) $data['tahun'];

        $keluhanBulanIni = Keluhan::query()
            ->whereYear('tanggal', $angkaTahun = (int) $data['tahun'])
            ->whereMonth('tanggal', $angkaBulan)
            ->get();

        $urgensi = ['Tinggi' => 0, 'Sedang' => 0, 'Rendah' => 0];
        $tanamanMap = [];
        $lokasiMap = [];

        foreach ($keluhanBulanIni as $item) {
            $teks = (string) $item->teks_keluhan;
            $lvl = ucfirst(strtolower((string) ($item->tingkat_urgensi ?: $this->ekstrak($teks, 'Urgensi') ?: '')));
            if (isset($urgensi[$lvl])) {
                $urgensi[$lvl]++;
            }

            $tanaman = $this->normalisasiLabel($this->ekstrak($teks, 'Jenis Tanaman'));
            if ($tanaman !== null) {
                $tanamanMap[$tanaman] = ($tanamanMap[$tanaman] ?? 0) + 1;
            }

            $lokasi = $this->normalisasiLabel($this->ekstrak($teks, 'Lokasi'));
            if ($lokasi !== null) {
                $lokasiMap[$lokasi] = ($lokasiMap[$lokasi] ?? 0) + 1;
            }
        }

        arsort($tanamanMap);
        arsort($lokasiMap);

        $ringkasan = [
            'bulan_angka'        => $angkaBulan,
            'total_keluhan'      => $keluhanBulanIni->count(),
            'keluhan_selesai'    => $keluhanBulanIni->filter(fn ($k) => strtolower((string) $k->status) === 'selesai')->count(),
            'keluhan_proses'     => $keluhanBulanIni->filter(fn ($k) => strtolower((string) $k->status) === 'proses')->count(),
            'petani_aktif'       => $keluhanBulanIni->pluck('id_petani')->unique()->count(),
            'urgensi'            => $urgensi,
            'tanaman_terbanyak'  => collect($tanamanMap)
                ->take(5)
                ->map(fn ($jumlah, $nama) => ['nama' => $nama, 'jumlah' => $jumlah])
                ->values()
                ->all(),
            'lokasi_terbanyak'   => collect($lokasiMap)
                ->take(5)
                ->map(fn ($jumlah, $nama) => ['nama' => $nama, 'jumlah' => $jumlah])
                ->values()
                ->all(),
            'catatan'            => trim((string) ($data['catatan'] ?? '')),
            'dibuat_oleh'        => $request->user()->nama,
            'digenerate_pada'    => now()->toIso8601String(),
        ];

        $laporan = Laporan::where('bulan', $namaBulan)->where('tahun', $tahun)->first() ?? new Laporan();
        $isBaru = ! $laporan->exists;
        $laporan->bulan = $namaBulan;
        $laporan->tahun = $tahun;
        $laporan->isi_data = json_encode($ringkasan, JSON_UNESCAPED_UNICODE);
        $laporan->created_at = now();
        $laporan->save();

        return response()->json([
            'message' => $isBaru
                ? "Rekap laporan {$namaBulan} {$tahun} berhasil dibuat."
                : "Rekap laporan {$namaBulan} {$tahun} berhasil diperbarui.",
            'data'    => $this->formatLaporan($laporan),
        ], $isBaru ? 201 : 200);
    }

    public function destroy(string $id): JsonResponse
    {
        $laporan = Laporan::whereKey($id)->firstOrFail();
        $periode = "{$laporan->bulan} {$laporan->tahun}";
        $laporan->delete();

        return response()->json([
            'message' => "Laporan periode {$periode} berhasil dihapus.",
        ]);
    }

    private function formatLaporan(Laporan $laporan): array
    {
        $decoded = json_decode((string) $laporan->isi_data, true);

        return [
            'id'         => $laporan->id_laporan,
            'bulan'      => $laporan->bulan,
            'tahun'      => $laporan->tahun,
            'ringkasan'  => is_array($decoded) ? $decoded : null,
            'isi_teks'   => is_array($decoded) ? null : $laporan->isi_data,
            'created_at' => optional($laporan->created_at)->toIso8601String(),
        ];
    }

    private function ekstrak(string $teks, string $label): ?string
    {
        if (preg_match('/^' . preg_quote($label, '/') . ':[ \t]*(.*)$/mi', $teks, $m)) {
            return trim($m[1]) ?: null;
        }

        return null;
    }

    private function normalisasiLabel(?string $nilai): ?string
    {
        if ($nilai === null || trim($nilai) === '') {
            return null;
        }

        return mb_convert_case(preg_replace('/\s+/', ' ', trim($nilai)), MB_CASE_TITLE, 'UTF-8');
    }
}
