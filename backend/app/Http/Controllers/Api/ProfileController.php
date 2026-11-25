<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PetaniResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function update(Request $request): PetaniResource
    {
        $petani = $request->user();

        $data = $request->validate([
            'nama'             => ['required', 'string', 'max:100'],
            'email'            => ['required', 'email', 'max:100',
                                   Rule::unique('petani', 'email')->ignore($petani->id_petani, 'id_petani')],
            'kontak'           => ['nullable', 'string', 'max:20'],
            'alamat'           => ['nullable', 'string', 'max:500'],
            'password'         => ['nullable', 'confirmed', PasswordRule::min(8)],
            'current_password' => ['nullable', 'string'],
        ]);

        if (! empty($data['password'])) {
            if (! Hash::check($data['current_password'] ?? '', $petani->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['Kata sandi saat ini salah.'],
                ]);
            }
        } else {
            unset($data['password']);
        }
        unset($data['current_password']);

        $petani->update($data);

        return new PetaniResource($petani->fresh());
    }
}
