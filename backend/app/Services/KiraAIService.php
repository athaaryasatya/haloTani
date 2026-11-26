<?php

namespace App\Services;

use App\Models\TemplatePrompt;
use Illuminate\Support\Facades\Http;

class KiraAIService
{
    public const DEFAULT_TEMPLATE = "Kamu adalah penyuluh pertanian 'Agritech Assistant' yang membantu petani Indonesia.\n"
        . "Jenis tanaman: {jenis_tanaman}\n"
        . "Lokasi lahan: {lokasi}\n"
        . "Tingkat urgensi: {urgensi}\n"
        . "Keluhan petani: {keluhan}\n\n"
        . "ATURAN JAWABAN:\n"
        . "1. Jangan gunakan simbol bullet inline dalam satu paragraf.\n"
        . "2. Gunakan daftar Markdown (- atau angka di baris baru) untuk setiap poin.\n"
        . "3. Jelaskan kemungkinan penyebab utama dan langkah penanganan praktis dengan bahasa yang mudah dipahami petani.";

    public static function susunPrompt(
        string $keluhanPetani,
        string $lokasiLahan,
        string $jenisTanaman = '-',
        string $tingkatUrgensi = 'Sedang',
        ?string $customTemplate = null
    ): string {
        $template = trim((string) ($customTemplate ?? TemplatePrompt::aktif()?->isi_template ?? self::DEFAULT_TEMPLATE));
        if ($template === '') {
            $template = self::DEFAULT_TEMPLATE;
        }

        $prompt = strtr($template, [
            '{jenis_tanaman}' => $jenisTanaman ?: '-',
            '{lokasi}'        => $lokasiLahan ?: '-',
            '{urgensi}'       => $tingkatUrgensi ?: 'Sedang',
            '{keluhan}'       => $keluhanPetani,
        ]);

        // Pastikan isi keluhan tetap terkirim jika template kustom lupa menyertakan {keluhan}.
        if (! str_contains($template, '{keluhan}')) {
            $prompt .= "\n\nKeluhan petani: {$keluhanPetani}";
        }

        return $prompt;
    }

    public static function generateSolusi(
        string $keluhanPetani,
        string $lokasiLahan,
        string $jenisTanaman = '-',
        string $tingkatUrgensi = 'Sedang',
        ?string $customTemplate = null
    ): string {
        $apiKey = config('services.cerebras.key');

        if (empty($apiKey)) {
            return 'ERROR: CEREBRAS_API_KEY belum terdeteksi!';
        }

        $prompt = self::susunPrompt($keluhanPetani, $lokasiLahan, $jenisTanaman, $tingkatUrgensi, $customTemplate);

        $models = array_values(array_unique(array_filter([
            config('services.cerebras.model', 'gpt-oss-120b'),
            'gpt-oss-120b',
            'qwen-3.8-27b',
        ])));

        foreach ($models as $model) {
            try {
                $response = Http::timeout(20)
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $apiKey,
                        'HTTP-Referer'  => 'http://localhost',
                        'Content-Type'  => 'application/json',
                    ])
                    ->post('https://api.cerebras.ai/v1/chat/completions', [
                        'model' => $model,
                        'messages' => [
                            ['role' => 'user', 'content' => $prompt],
                        ],
                        'max_tokens' => 1000,
                        'temperature' => 0.7,
                    ]);

                if ($response->successful() && ! empty($response->json('choices.0.message.content'))) {
                    return $response->json('choices.0.message.content');
                }
            } catch (\Exception) {
                continue;
            }
        }

        return 'Sistem AI sedang mengalami antrean padat di semua server. Silakan kirim atau uji ulang beberapa saat lagi.';
    }
}
