<?php

namespace Tests\Feature;

use App\Models\Keluhan;
use App\Models\Petani;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminPanelApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_petani_biasa_ditolak_mengakses_endpoint_admin(): void
    {
        $petani = Petani::create([
            'nama'     => 'Budi Santoso',
            'email'    => 'budi@agritech.test',
            'password' => 'password123',
        ]);

        $this->actingAs($petani, 'sanctum')
            ->getJson('/api/admin/dashboard')
            ->assertStatus(403);
    }

    public function test_admin_dapat_melihat_dashboard_dan_menghapus_keluhan_spam(): void
    {
        $admin = $this->buatAdmin();
        $petani = Petani::create([
            'nama'     => 'Siti Rahayu',
            'email'    => 'siti@agritech.test',
            'password' => 'password123',
        ]);

        $keluhan = Keluhan::create([
            'id_keluhan'      => (string) Str::uuid(),
            'id_petani'       => $petani->id_petani,
            'teks_keluhan'    => "Jenis Tanaman: Padi\nLokasi: Jiwan, Madiun\nUrgensi: Tinggi\nKeluhan: Daun menguning parah.",
            'tingkat_urgensi' => 'Tinggi',
            'hasil_analisis'  => '- Semprot bakterisida sesuai dosis.',
            'tanggal'         => now(),
            'status'          => 'selesai',
        ]);

        $res = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/dashboard')
            ->assertOk()
            ->json();

        $this->assertSame(1, $res['stats']['total_petani']);
        $this->assertSame(1, $res['stats']['total_keluhan']);
        $this->assertSame(1, $res['stats']['urgensi_tinggi']);
        $this->assertSame('Padi', $res['tren_tanaman'][0]['nama']);
        $this->assertSame('Siti Rahayu', $res['keluhan'][0]['petani']['nama']);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/keluhan/{$keluhan->id_keluhan}")
            ->assertOk();

        $this->assertDatabaseMissing('keluhan', ['id_keluhan' => $keluhan->id_keluhan]);
    }

    public function test_admin_dapat_melihat_dan_menghapus_akun_lain_namun_tidak_akun_sendiri(): void
    {
        $admin = $this->buatAdmin();
        $petani = Petani::create([
            'nama'     => 'Joko Widodo',
            'email'    => 'joko@agritech.test',
            'password' => 'password123',
        ]);

        Keluhan::create([
            'id_keluhan'      => (string) Str::uuid(),
            'id_petani'       => $petani->id_petani,
            'teks_keluhan'    => "Jenis Tanaman: Cabai\nLokasi: Magetan\nUrgensi: Rendah\nKeluhan: Daun keriting.",
            'tingkat_urgensi' => 'Rendah',
            'hasil_analisis'  => '- Periksa kutu kebul.',
            'tanggal'         => now(),
            'status'          => 'selesai',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/pengguna/{$admin->id_petani}")
            ->assertStatus(422);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/pengguna')
            ->assertOk()
            ->assertJsonPath('summary.total', 2)
            ->assertJsonPath('summary.petani', 1);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/pengguna/{$petani->id_petani}")
            ->assertOk();

        $this->assertDatabaseMissing('petani', ['id_petani' => $petani->id_petani]);
        $this->assertSame(0, Keluhan::where('id_petani', $petani->id_petani)->count());
    }

    public function test_admin_dapat_mengelola_dan_menguji_template_prompt_ai(): void
    {
        config(['services.cerebras.key' => 'test-cerebras-key']);
        Http::fake([
            'https://api.cerebras.ai/*' => Http::response([
                'choices' => [
                    ['message' => ['content' => "- Periksa drainase lahan.\n- Berikan pupuk berimbang."]],
                ],
            ], 200),
        ]);

        $admin = $this->buatAdmin();

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/admin/template-prompt', [
                'isi_template' => 'Instruksi tanpa placeholder wajib yang cukup panjang.',
            ])
            ->assertStatus(422);

        $templateBaru = "Penyuluh HaloTani untuk {jenis_tanaman} di {lokasi} ({urgensi}):\n{keluhan}";

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/admin/template-prompt', [
                'isi_template' => $templateBaru,
            ])
            ->assertOk()
            ->assertJsonPath('data.isi_template', $templateBaru);

        $uji = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/template-prompt/test', [
                'jenis_tanaman'   => 'Jagung',
                'lokasi_lahan'    => 'Ngawi',
                'tingkat_urgensi' => 'Sedang',
                'deskripsi'       => 'Batang bawah membusuk dan berbau tidak sedap.',
            ])
            ->assertOk()
            ->json('data');

        $this->assertStringContainsString('Penyuluh HaloTani untuk Jagung di Ngawi (Sedang):', $uji['prompt_terkirim']);
        $this->assertStringContainsString('drainase lahan', $uji['hasil_analisis']);
        $this->assertSame(0, Keluhan::count());
    }

    public function test_admin_dapat_membuat_dan_menghapus_laporan_bulanan(): void
    {
        $admin = $this->buatAdmin();
        $petani = Petani::create([
            'nama'     => 'Rina Tani',
            'email'    => 'rina@agritech.test',
            'password' => 'password123',
        ]);

        Keluhan::create([
            'id_keluhan'      => (string) Str::uuid(),
            'id_petani'       => $petani->id_petani,
            'teks_keluhan'    => "Jenis Tanaman: Padi\nLokasi: Madiun\nUrgensi: Sedang\nKeluhan: Bercak daun cokelat.",
            'tingkat_urgensi' => 'Sedang',
            'hasil_analisis'  => '- Gunakan fungisida.',
            'tanggal'         => '2026-11-15 08:00:00',
            'status'          => 'selesai',
        ]);

        $res = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/laporan', [
                'bulan'   => 11,
                'tahun'   => 2026,
                'catatan' => 'Curah hujan meningkat di wilayah Madiun.',
            ])
            ->assertCreated()
            ->json('data');

        $this->assertSame('November', $res['bulan']);
        $this->assertSame('2026', $res['tahun']);
        $this->assertSame(1, $res['ringkasan']['total_keluhan']);
        $this->assertSame('Padi', $res['ringkasan']['tanaman_terbanyak'][0]['nama']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/laporan')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/laporan/{$res['id']}")
            ->assertOk();

        $this->assertDatabaseMissing('laporan', ['id_laporan' => $res['id']]);
    }

    private function buatAdmin(): Petani
    {
        $admin = new Petani([
            'nama'     => 'Admin HaloTani',
            'email'    => 'admin@agritech.test',
            'password' => 'password123',
        ]);
        $admin->role = 'admin';
        $admin->save();

        return $admin;
    }
}
