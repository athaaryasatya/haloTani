<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PetaniResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'     => $this->id_petani,
            'nama'   => $this->nama,
            'email'  => $this->email,
            'kontak' => $this->kontak,
            'alamat' => $this->alamat,
            'role'   => $this->role,
        ];
    }
}
