<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PetaniResource;
use App\Models\Petani;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const TOKEN_HARI = 7;

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nama'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'max:100', 'unique:petani,email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
            'kontak'   => ['nullable', 'string', 'max:20'],
            'alamat'   => ['nullable', 'string', 'max:500'],
        ]);

        // role tidak boleh diisi dari luar: selalu 'petani' (default di database)
        $petani = Petani::create($data);
        $petani->refresh();

        return response()->json([
            'token'  => $this->buatToken($petani),
            'petani' => new PetaniResource($petani),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $petani = Petani::where('email', $data['email'])->first();

        if (! $petani || ! Hash::check($data['password'], $petani->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password yang Anda masukkan salah.'],
            ]);
        }

        return response()->json([
            'token'  => $this->buatToken($petani),
            'petani' => new PetaniResource($petani),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Berhasil keluar.']);
    }

    public function me(Request $request): PetaniResource
    {
        return new PetaniResource($request->user());
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        Password::sendResetLink($request->only('email'));

        // Jawaban selalu sama supaya orang luar tidak bisa menebak email yang terdaftar.
        return response()->json([
            'message' => 'Jika email terdaftar, tautan reset kata sandi sudah dikirim.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token'    => ['required', 'string'],
            'email'    => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ]);

        $status = Password::reset(
            $data,
            function (Petani $petani, string $password) {
                $petani->forceFill([
                    'password'       => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                $petani->tokens()->delete(); // semua sesi lama dicabut
                event(new PasswordReset($petani));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => ['Tautan reset tidak valid atau sudah kedaluwarsa.'],
            ]);
        }

        return response()->json(['message' => 'Kata sandi berhasil diubah. Silakan masuk.']);
    }

    private function buatToken(Petani $petani): string
    {
        return $petani->createToken('halotani-web', ['*'], now()->addDays(self::TOKEN_HARI))->plainTextToken;
    }
}
