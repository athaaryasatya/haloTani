<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'app'     => 'HaloTani API',
    'status'  => 'ok',
    'catatan' => 'Semua endpoint ada di /api/*',
]));
