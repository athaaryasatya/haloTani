<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\KeluhanResource;
use App\Models\Keluhan;
use App\Models\Petani;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'urgensi' => ['nullable', Rule::in(['semua', 'Rendah', 'Sedang', 'Tinggi'])],
            'search'  => ['nullable', 'string', 'max:150'],
        ]);

        $semuaKeluhan = Keluhan::orderByDesc('tanggal')->get();

        $urgensiCount = ['Tinggi' => 0, 'Sedang' => 0, 'Rendah' => 0];
        $tanamanCount = [];

        foreach ($semuaKeluhan as $item) {
            $teks = (string) $item->teks_keluhan;
            $lvl = ucfirst(strtolower((string) ($item->tingkat_urgensi ?: $this->ekstrak($teks, 'Urgensi') ?: '')));
            if (isset($urgensiCount[$lvl])) {
                $urgensiCount[$lvl]++;
            }

            $tanaman = $this->normalisasiLabel($this->ekstrak($teks, 'Jenis Tanaman'));
            if ($tanaman !== null) {
                $tanamanCount[$tanaman] = ($tanamanCount[$tanaman] ?? 0) + 1;
            }
        }

        arsort($tanamanCount);

        $bulanIni = now();
        $keluhanBulanIni = $semuaKeluhan->filter(
            fn (Keluhan $k) => $k->tanggal && $k->tanggal->year === $bulanIni->year && $k->tanggal->month === $bulanIni->month
        );

        $tanamanBulanIni = [];
        foreach ($keluhanBulanIni as $item) {
            $tanaman = $this->normalisasiLabel($this->ekstrak((string) $item->teks_keluhan, 'Jenis Tanaman'));
            if ($tanaman !== null) {
                $tanamanBulanIni[$tanaman] = ($tanamanBulanIni[$tanaman] ?? 0) + 1;
            }
        }
        arsort($tanamanBulanIni);
        $topBulanIniNama = array_key_first($tanamanBulanIni);

        $query = Keluhan::with('petani:id_petani,nama,email')->orderByDesc('tanggal');

        $urgensiFilter = $request->query('urgensi');
        if ($urgensiFilter && $urgensiFilter !== 'semua') {
            $query->where('tingkat_urgensi', $urgensiFilter);
        }

        $search = trim((string) $request->query('search', ''));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('teks_keluhan', 'like', "%{$search}%")
                    ->orWhereHas('petani', function ($pq) use ($search) {
                        $pq->where('nama', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        return response()->json([
            'stats' => [
                'total_petani'     => Petani::where('role', 'petani')->count(),
                'total_akun'       => Petani::count(),
                'total_keluhan'    => $semuaKeluhan->count(),
                'keluhan_selesai'  => $semuaKeluhan->filter(fn ($k) => strtolower((string) $k->status) === 'selesai')->count(),
                'keluhan_proses'   => $semuaKeluhan->filter(fn ($k) => strtolower((string) $k->status) !== 'selesai')->count(),
                'urgensi_tinggi'   => $urgensiCount['Tinggi'],
                'keluhan_bulan_ini' => $keluhanBulanIni->count(),
                'komoditas_bulan_ini' => $topBulanIniNama ? [
                    'nama'   => $topBulanIniNama,
                    'jumlah' => $tanamanBulanIni[$topBulanIniNama],
                ] : null,
            ],
            'tren_tanaman' => collect($tanamanCount)
                ->take(5)
                ->map(fn ($jumlah, $nama) => ['nama' => $nama, 'jumlah' => $jumlah])
                ->values()
                ->all(),
            'sebaran_urgensi' => [
                ['tingkat' => 'Tinggi', 'jumlah' => $urgensiCount['Tinggi']],
                ['tingkat' => 'Sedang', 'jumlah' => $urgensiCount['Sedang']],
                ['tingkat' => 'Rendah', 'jumlah' => $urgensiCount['Rendah']],
            ],
            'keluhan' => KeluhanResource::collection($query->limit(50)->get()),
        ]);
    }

    public function destroyKeluhan(string $id): JsonResponse
    {
        $keluhan = Keluhan::whereKey($id)->firstOrFail();
        $keluhan->delete();

        return response()->json([
            'message' => 'Data keluhan berhasil dihapus.',
        ]);
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
