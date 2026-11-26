<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\TemplatePrompt;
use App\Services\KiraAIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminPromptController extends Controller
{
    public function show(): JsonResponse
    {
        $aktif = TemplatePrompt::with('petani:id_petani,nama')->orderByDesc('updated_at')->first();

        return response()->json([
            'data' => [
                'id'               => $aktif?->id_template,
                'isi_template'     => $aktif?->isi_template ?? KiraAIService::DEFAULT_TEMPLATE,
                'default_template' => KiraAIService::DEFAULT_TEMPLATE,
                'updated_at'       => optional($aktif?->updated_at)->toIso8601String(),
                'diubah_oleh'      => $aktif?->petani?->nama,
                'placeholders'     => ['{jenis_tanaman}', '{lokasi}', '{urgensi}', '{keluhan}'],
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'isi_template' => ['required', 'string', 'min:20', 'max:5000'],
        ]);

        if (! str_contains($data['isi_template'], '{keluhan}')) {
            throw ValidationException::withMessages([
                'isi_template' => ['Template wajib memuat variabel {keluhan} agar keluhan petani terkirim ke AI.'],
            ]);
        }

        $prompt = TemplatePrompt::aktif() ?? new TemplatePrompt();
        $prompt->id_petani = $request->user()->id_petani;
        $prompt->isi_template = trim($data['isi_template']);
        $prompt->updated_at = now();
        $prompt->save();
        $prompt->load('petani:id_petani,nama');

        return response()->json([
            'message' => 'Template prompt AI berhasil disimpan.',
            'data' => [
                'id'               => $prompt->id_template,
                'isi_template'     => $prompt->isi_template,
                'default_template' => KiraAIService::DEFAULT_TEMPLATE,
                'updated_at'       => optional($prompt->updated_at)->toIso8601String(),
                'diubah_oleh'      => $prompt->petani?->nama,
                'placeholders'     => ['{jenis_tanaman}', '{lokasi}', '{urgensi}', '{keluhan}'],
            ],
        ]);
    }

    public function test(Request $request): JsonResponse
    {
        $data = $request->validate([
            'jenis_tanaman'   => ['required', 'string', 'max:100'],
            'lokasi_lahan'    => ['required', 'string', 'max:150'],
            'tingkat_urgensi' => ['required', Rule::in(['Rendah', 'Sedang', 'Tinggi'])],
            'deskripsi'       => ['required', 'string', 'max:3000'],
            'isi_template'    => ['nullable', 'string', 'max:5000'],
        ]);

        set_time_limit(90);

        $promptTerkirim = KiraAIService::susunPrompt(
            $data['deskripsi'],
            $data['lokasi_lahan'],
            $data['jenis_tanaman'],
            $data['tingkat_urgensi'],
            $data['isi_template'] ?? null,
        );

        $hasil = KiraAIService::generateSolusi(
            $data['deskripsi'],
            $data['lokasi_lahan'],
            $data['jenis_tanaman'],
            $data['tingkat_urgensi'],
            $data['isi_template'] ?? null,
        );

        return response()->json([
            'data' => [
                'prompt_terkirim' => $promptTerkirim,
                'hasil_analisis'  => $hasil,
            ],
        ]);
    }
}
