<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\KeluhanResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $keluhan = $request->user()->keluhan();

        return response()->json([
            'stats' => [
                'total'   => (clone $keluhan)->count(),
                'selesai' => (clone $keluhan)->where('status', 'selesai')->count(),
                'proses'  => (clone $keluhan)->where('status', 'proses')->count(),
            ],
            'terbaru' => KeluhanResource::collection(
                (clone $keluhan)->orderByDesc('tanggal')->limit(5)->get()
            ),
        ]);
    }
}
