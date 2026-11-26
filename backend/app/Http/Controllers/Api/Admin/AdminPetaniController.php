<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Petani;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPetaniController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $query = Petani::query()
            ->withCount('keluhan')
            ->orderByDesc('created_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('alamat', 'like', "%{$search}%");
            });
        }

        $akun = $query->get()->map(fn (Petani $p) => [
            'id'            => $p->id_petani,
            'nama'          => $p->nama,
            'email'         => $p->email,
            'role'          => $p->role,
            'kontak'        => $p->kontak,
            'alamat'        => $p->alamat,
            'keluhan_count' => $p->keluhan_count,
            'created_at'    => optional($p->created_at)->toIso8601String(),
        ]);

        return response()->json([
            'summary' => [
                'total'  => Petani::count(),
                'petani' => Petani::where('role', 'petani')->count(),
                'admin'  => Petani::where('role', 'admin')->count(),
            ],
            'data' => $akun,
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $target = Petani::whereKey($id)->firstOrFail();

        if ($target->id_petani === $request->user()->id_petani) {
            return response()->json([
                'message' => 'Anda tidak dapat menghapus akun yang sedang digunakan.',
            ], 422);
        }

        // Tabel keluhan belum memakai foreign key cascade, jadi dibersihkan eksplisit.
        $target->keluhan()->delete();
        $target->tokens()->delete();
        $target->delete();

        return response()->json([
            'message' => "Akun {$target->nama} berhasil dihapus.",
        ]);
    }
}
