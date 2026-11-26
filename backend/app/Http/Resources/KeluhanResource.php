<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KeluhanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $teks = (string) $this->teks_keluhan;

        return [
            'id'              => $this->id_keluhan,
            // Tabel keluhan menyimpan semua isian dalam satu kolom teks
            // ("Jenis Tanaman: ...\nLokasi: ...\n..."), jadi dipecah lagi di sini.
            'jenis_tanaman'   => $this->ambil($teks, 'Jenis Tanaman'),
            'lokasi_lahan'    => $this->ambil($teks, 'Lokasi'),
            'tingkat_urgensi' => $this->tingkat_urgensi ?: $this->ambil($teks, 'Urgensi'),
            'deskripsi'       => $this->ambilDeskripsi($teks),
            'teks_keluhan'    => $teks,
            'hasil_analisis'  => $this->hasil_analisis,
            'status'          => strtolower((string) $this->status),
            'tanggal'         => optional($this->tanggal)->toIso8601String(),
            'petani'          => $this->whenLoaded('petani', fn () => [
                'id'    => $this->petani->id_petani,
                'nama'  => $this->petani->nama,
                'email' => $this->petani->email,
            ]),
        ];
    }

    private function ambil(string $teks, string $label): ?string
    {
        if (preg_match('/^' . preg_quote($label, '/') . ':[ \t]*(.*)$/mi', $teks, $m)) {
            return trim($m[1]) ?: null;
        }

        return null;
    }

    private function ambilDeskripsi(string $teks): string
    {
        if (preg_match('/^Keluhan:\s*(.*)\z/msi', $teks, $m)) {
            return trim($m[1]);
        }

        return trim($teks);
    }
}
