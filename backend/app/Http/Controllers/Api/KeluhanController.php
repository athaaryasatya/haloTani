<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\KeluhanResource;
use App\Services\KiraAIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class KeluhanController extends Controller
{
    /** Minimal jumlah kata deskripsi per tingkat urgensi (aturan lama dari halaman Kirim Keluhan). */
    private const MIN_KATA = ['rendah' => 15, 'sedang' => 25, 'tinggi' => 50];

    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate(['status' => ['nullable', Rule::in(['semua', 'selesai', 'proses'])]]);

        $query = $request->user()->keluhan()->orderByDesc('tanggal');

        $status = $request->query('status');
        if ($status && $status !== 'semua') {
            $query->where('status', $status);
        }

        return KeluhanResource::collection($query->get());
    }

    public function show(Request $request, string $id): KeluhanResource
    {
        // Dicari lewat relasi petani yang login, jadi keluhan milik orang lain = 404.
        return new KeluhanResource(
            $request->user()->keluhan()->whereKey($id)->firstOrFail()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'jenis_tanaman'   => ['required', 'string', 'max:100'],
            'lokasi_lahan'    => ['required', 'string', 'max:150'],
            'tingkat_urgensi' => ['required', Rule::in(['Rendah', 'Sedang', 'Tinggi'])],
            'deskripsi'       => ['required', 'string', 'max:5000'],
        ]);

        $minKata = self::MIN_KATA[strtolower($data['tingkat_urgensi'])];
        $jumlahKata = count(preg_split('/\s+/', trim($data['deskripsi']), -1, PREG_SPLIT_NO_EMPTY));

        if ($jumlahKata < $minKata) {
            throw ValidationException::withMessages([
                'deskripsi' => ["Untuk urgensi {$data['tingkat_urgensi']}, deskripsi minimal {$minKata} kata (saat ini {$jumlahKata} kata)."],
            ]);
        }

        // Panggilan AI bisa sampai ~40 detik (2 model x timeout 20 detik).
        set_time_limit(90);

        $teks = "Jenis Tanaman: {$data['jenis_tanaman']}\n"
              . "Lokasi: {$data['lokasi_lahan']}\n"
              . "Urgensi: {$data['tingkat_urgensi']}\n"
              . "Keluhan: {$data['deskripsi']}";

        $hasilAi = KiraAIService::generateSolusi($data['deskripsi'], $data['lokasi_lahan']);

        $keluhan = $request->user()->keluhan()->create([
            'id_keluhan'      => (string) Str::uuid(),
            'teks_keluhan'    => $teks,
            'tingkat_urgensi' => $data['tingkat_urgensi'],
            'hasil_analisis'  => $hasilAi,
            'tanggal'         => now(),
            'status'          => 'selesai',
        ]);

        return (new KeluhanResource($keluhan))->response()->setStatusCode(201);
    }
}
